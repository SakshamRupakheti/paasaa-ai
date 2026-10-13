import copy
import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from jsonschema import ValidationError
from paasaa_research.pipeline import ROOT, generate, validate, read_reviews
from paasaa_research.quality import duplicate_pairs, clusters, semantic_pairs, group_splits, leakage, flags
from paasaa_research.review import validate_reviews, training_blockers
from paasaa_research.teachers import ApprovedTeacher, import_candidates, rights_blockers
from paasaa_research.taxonomy import FAMILIES, RATINGS

CONFIG = {'pilot_size': 100, 'version': 'test-v1'}
STAMP = '2026-10-13T00:00:00+00:00'

class ResearchTests(unittest.TestCase):
    def setUp(self):
        self.scenarios, self.conversations, self.preferences = generate(CONFIG, STAMP)
        self.s, self.c = self.scenarios[0], self.conversations[0]['candidates'][0]
        self.registry = json.loads((ROOT / 'source_registry.json').read_text(encoding='utf-8'))

    def review(self, decision='APPROVE'):
        return {'scenario_id': self.s['scenario_id'], 'candidate_id': self.c['candidate_id'], 'scenario_hash': self.s['content_hash'],
                'candidate_hash': self.c['content_hash'], 'reviewer_id': 'clinician-test-pseudonym', 'reviewer_role': 'clinician',
                'decision': decision, 'ratings': {r: 4 for r in RATINGS}, 'preferred_candidate': self.c['candidate_id'],
                'clinical_rationale': 'Synthetic test fixture, not an actual review.', 'edited_response': None,
                'native_language_reviewed': True, 'flags_resolved': True}

    def test_pilot_coverage_and_three_candidates(self):
        validate(self.scenarios, self.conversations, self.preferences)
        self.assertEqual(len(self.scenarios), 100)
        self.assertEqual(set(s['condition_family'] for s in self.scenarios), set(FAMILIES))
        self.assertEqual(set(s['language'] for s in self.scenarios), {'en','es','hi','ne'})
        self.assertTrue(all(len(c['candidates']) == 3 for c in self.conversations))
        self.assertTrue(all(p['preferred_response'] is None for p in self.preferences))

    def test_schema_rejects_unknown_risk(self):
        self.s['risk_level'] = 'diagnosed_safe'
        with self.assertRaises(ValidationError):
            validate(self.scenarios, self.conversations, self.preferences)

    def test_schema_rejects_missing_provenance(self):
        del self.c['source_id']
        with self.assertRaises(ValidationError):
            validate(self.scenarios, self.conversations, self.preferences)

    def test_content_reproducible_ignoring_build_timestamp(self):
        a, b, _ = generate(CONFIG, '2026-10-14T00:00:00+00:00')
        self.assertEqual(a, self.scenarios)
        self.assertEqual(b[0]['candidates'][0]['content_hash'], self.c['content_hash'])

    def test_duplicate_candidate_id_and_tampered_text_rejected(self):
        self.conversations[0]['candidates'][1]['candidate_id'] = self.c['candidate_id']
        with self.assertRaisesRegex(ValueError, 'unique'):
            validate(self.scenarios, self.conversations, self.preferences)
        self.scenarios, self.conversations, self.preferences = generate(CONFIG, STAMP)
        self.conversations[0]['candidates'][0]['response'] = 'Changed since review.'
        with self.assertRaisesRegex(ValueError, 'hash mismatch'):
            validate(self.scenarios, self.conversations, self.preferences)

    def test_normalization_catches_case_punctuation_unicode(self):
        texts = ['I AM worried!', 'i am worried', 'Ｉ am worried.']
        self.assertEqual(duplicate_pairs(texts), [])
        self.assertEqual(len(duplicate_pairs(texts, True)), 3)

    def test_semantic_pairs_and_transitive_clustering(self):
        pairs = semantic_pairs([[1,0],[.99,.01],[0,1]], .9)
        self.assertEqual([(i,j) for i,j,_ in pairs], [(0,1)])
        self.assertEqual(clusters(4, [(0,1),(1,2)]), [0,0,0,3])
        with self.assertRaises(ValueError):
            semantic_pairs([[0,0]], .9)

    def test_group_split_prevents_family_template_and_semantic_leakage(self):
        pairs = [(0, 20, .95)]
        assignments = group_splits(self.scenarios, pairs)
        self.assertEqual(leakage(assignments, pairs), [])
        for field in ('scenario_family', 'template_origin', 'conversation_family'):
            seen = {}
            for s, a in zip(self.scenarios, assignments):
                seen.setdefault(s[field], set()).add(a['proposed_split'])
            self.assertTrue(all(len(x) == 1 for x in seen.values()))
        assignments[20]['proposed_split'] = 'deliberately_different'
        self.assertEqual(leakage(assignments, pairs), [(0,20)])

    def test_teacher_denied_before_callback(self):
        called = []
        teacher = ApprovedTeacher(self.registry['codex_design_drafts'], 'test', lambda s: called.append(s))
        with self.assertRaises(PermissionError):
            teacher.candidates(self.s)
        self.assertEqual(called, [])

    def test_approved_adapter_contract(self):
        source = {**self.registry['codex_design_drafts'], 'license': 'Explicit test permission', 'allowed_for_training': True, 'allowed_for_commercial_use': True, 'review_status': 'approved'}
        self.assertEqual(ApprovedTeacher(source, 'test', lambda s: ['a','b','c']).candidates(self.s), ['a','b','c'])
        with self.assertRaises(ValueError):
            ApprovedTeacher(source, 'test', lambda s: ['a']).candidates(self.s)

    def test_unknown_import_source_blocked(self):
        with self.assertRaises(PermissionError):
            import_candidates([{'source_id': 'missing'}], self.registry)
        self.assertIn('incomplete_source_metadata', rights_blockers({}))

    def test_no_fixture_is_training_eligible(self):
        for s, conv in zip(self.scenarios, self.conversations):
            for c in conv['candidates']:
                self.assertTrue(training_blockers(s, c, self.registry, []))

    def test_clinician_review_cannot_override_rights(self):
        r = self.review()
        validate_reviews([r], self.scenarios, self.conversations)
        blocked = training_blockers(self.s, self.c, self.registry, [r], True, True)
        self.assertIn('training_rights_missing', blocked)
        self.assertIn('license_unresolved', blocked)

    def test_review_unknown_id_stale_hash_bad_rating_cross_scenario(self):
        for key, value in [('candidate_id','absent'), ('candidate_hash','stale'), ('scenario_hash','stale'), ('preferred_candidate','pilot_0002_c1')]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                validate_reviews([{**self.review(), key: value}], self.scenarios, self.conversations)
        r = self.review()
        r['ratings']['safety'] = 6
        with self.assertRaises(ValidationError):
            validate_reviews([r], self.scenarios, self.conversations)

    def test_edit_requires_text_and_does_not_approve(self):
        r = self.review('EDIT')
        with self.assertRaises(ValueError):
            validate_reviews([r], self.scenarios, self.conversations)
        r['edited_response'] = 'Replacement for a future review.'
        result = validate_reviews([r], self.scenarios, self.conversations)
        self.assertTrue(result[0]['edited_text_requires_new_review'])
        self.assertIn('unresolved_review_conflict_or_edit', training_blockers(self.s, self.c, self.registry, result))

    def test_negative_never_sft_even_if_reviewed(self):
        self.c = self.conversations[0]['candidates'][2]
        self.assertIn('intentional_negative_not_sft', training_blockers(self.s, self.c, self.registry, [self.review()], True, True))

    def test_review_conflict_does_not_silently_choose_approval(self):
        self.assertIn('unresolved_review_conflict_or_edit', training_blockers(self.s, self.c, self.registry, [self.review(), self.review('REJECT')], True, True))

    def test_flag_known_hazards_without_deletion(self):
        result = flags('I am a licensed clinician. You definitely have bipolar. I guarantee everything. Hold your breath.', self.s)
        for expected in ['clinician_claim', 'diagnosis_claim', 'unsupported_certainty', 'unsafe_breathing_exposure_review']:
            self.assertIn(expected, result)

    def test_short_answer_meaning_and_refusal_are_not_overridden(self):
        by_context = {s['context']: conv for s, conv in zip(self.scenarios, self.conversations)}
        self.assertIn('unsure', by_context['nothing clarification']['candidates'][0]['response'])
        self.assertIn('“Nothing”', by_context['short consequence answer']['candidates'][1]['response'])
        self.assertIn('leave breathing exercises out', by_context['breathing declined']['candidates'][0]['response'])
        self.assertNotEqual(by_context['music audition']['candidates'][0]['response'], by_context['work presentation']['candidates'][0]['response'])

    def test_emergency_history_does_not_wait_until_final_turn(self):
        for s, conv in zip(self.scenarios, self.conversations):
            if s['risk_level'] == 'medical_emergency':
                self.assertEqual(conv['messages'][1]['content'], conv['candidates'][0]['response'])

    def test_completed_csv_round_trip_and_blank_row_skipped(self):
        r = self.review()
        flat = {**r, **r['ratings'], 'native_language_reviewed': 'true', 'flags_resolved': 'true'}
        del flat['ratings']
        path = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', prefix='review-test-', dir=ROOT / 'reports', encoding='utf-8-sig', newline='', delete=False) as f:
                path = Path(f.name)
                writer = csv.DictWriter(f, fieldnames=list(flat))
                writer.writeheader()
                writer.writerow(flat)
                writer.writerow({**flat, 'decision': ''})
            parsed = read_reviews(path)
            self.assertEqual(len(parsed), 1)
            self.assertEqual(parsed[0], r)
            self.assertEqual(len(validate_reviews(parsed, self.scenarios, self.conversations)), 1)
        finally:
            if path is not None:
                path.unlink()

    def test_all_gates_must_be_satisfied_for_eligibility(self):
        registry = copy.deepcopy(self.registry)
        registry[self.s['source_id']].update(license='Explicit test permission', allowed_for_training=True, allowed_for_commercial_use=True, review_status='approved')
        r = self.review()
        self.assertEqual(training_blockers(self.s, self.c, registry, [r], True, True), [])
        r['native_language_reviewed'] = False
        self.assertIn('native_language_review_missing', training_blockers(self.s, self.c, registry, [r], True, True))
        r['flags_resolved'] = False
        self.assertIn('clinical_review_missing', training_blockers(self.s, self.c, registry, [r], True, True))

if __name__ == '__main__':
    unittest.main()
