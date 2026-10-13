import argparse
import csv
import json
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, FormatChecker

from . import responses
from .quality import digest, duplicate_pairs, semantic_pairs, clusters, group_splits, leakage, flags, repeated_responses
from .review import validate_reviews, training_blockers
from .schemas import SCHEMAS
from .seeds import seeds
from .taxonomy import FAMILIES, SKILLS, NEGATIVE, SPECIALIZED, RATINGS

ROOT = Path(__file__).resolve().parents[2]
SOURCE = 'codex_design_drafts'

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def write_jsonl(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(''.join(json.dumps(x, ensure_ascii=False) + '\n' for x in data), encoding='utf-8')

def read_jsonl(path):
    return [json.loads(line) for line in path.read_text(encoding='utf-8-sig').splitlines() if line.strip()]

def metadata(seed, i, version):
    family = seed['condition_family']
    skills = ['reflection', 'patient_choice']
    stage, goal = 'respond_to_latest_turn', 'Use the actual latest answer and prior context; offer clarity without a question loop.'
    if seed['risk_level'] in ('urgent', 'medical_emergency'):
        skills = ['safety_escalation', 'boundary_setting']
        stage, goal = 'safety_support', 'Prioritize appropriate human support; no improvised treatment or medical reassurance.'
    elif family in ('misunderstanding', 'rupture_repair', 'intervention_refusal', 'ambiguous'):
        skills = ['rupture_repair', 'patient_choice', 'clarification']
        goal = 'Respect correction, refusal, or uncertainty; do not invent a feared consequence or repeat a rejected intervention.'
    elif family in ('academic_stress', 'work_stress', 'problem_solving', 'avoidance'):
        skills = ['problem_solving', 'behavioral_planning', 'patient_choice']
        goal = 'Offer one feasible step when requested, matching the stated practical constraint.'
    elif family in ('uncertainty', 'reassurance_seeking'):
        skills = ['uncertainty_tolerance', 'balanced_alternative']
    elif family in ('cognitive_distortions', 'automatic_thoughts', 'performance_anxiety'):
        skills = ['automatic_thought_identification', 'balanced_alternative', 'reflection']
    elif family in ('safety_sensitive', 'clinician_homework', 'low_mood'):
        skills = ['clinician_referral', 'boundary_setting', 'patient_choice']
    mixed = family == 'multilingual'
    language_mix = [seed['language']]
    if mixed:
        if seed['language'] != 'en':
            language_mix.append('en')
        else:
            language_mix.append('hi' if any('\u0900' <= c <= '\u097f' for c in seed['opening']) or 'Yaar' in seed['opening'] else 'es')
    # Conservative grouping: all examples in a scenario family and all translations stay together.
    record = {
        'scenario_id': f'pilot_{i:04d}', 'dataset_version': version, **seed,
        'conversation_stage': stage, 'language_mix': language_mix, 'code_switching': mixed,
        'translation_origin': 'ai_assisted_original_or_parallel_concept_draft', 'native_review_status': 'pending',
        'desired_skills': skills, 'prohibited_behaviors': NEGATIVE,
        'clinical_goal': goal, 'source_id': SOURCE, 'scenario_family': family,
        'conversation_family': f'{family}:review_draft', 'template_origin': f'response-v1:{family}',
    }
    record['content_hash'] = digest(record)
    return record

def generate(config, timestamp):
    raw = seeds()
    if len(raw) != config['pilot_size']:
        raise ValueError(f'Expected {config["pilot_size"]} seeds, got {len(raw)}')
    if set(s['condition_family'] for s in raw) != set(FAMILIES):
        raise ValueError('Pilot must cover all scenario families')
    scenarios = [metadata(s, i + 1, config['version']) for i, s in enumerate(raw)]
    conversations, preferences = [], []
    for s in scenarios:
        cs = []
        for j, response in enumerate(responses.candidates(s), 1):
            cs.append({'scenario_id': s['scenario_id'], 'candidate_id': f'{s["scenario_id"]}_c{j}', 'source_id': SOURCE,
                       'teacher_model': 'deterministic-review-template-v1', 'response': response, 'temperature': 0,
                       'generation_timestamp': timestamp, 'prompt_version': 'draft-v1', 'automatic_flags': flags(response, s),
                       'intentional_negative': j == 3, 'negative_behaviors': ['false_reassurance', 'overconfidence', 'toxic_positivity'] if j == 3 else [],
                       'review_status': 'pending', 'content_hash': digest(response)})
        conversations.append({'scenario_id': s['scenario_id'], 'messages': responses.history(s), 'candidates': cs})
        preferences.append({'scenario_id': s['scenario_id'], 'preferred_candidate': None, 'rejected_candidate': None,
                            'preferred_response': None, 'rejected_response': None, 'reason': None, 'status': 'unselected_pending_review'})
    return scenarios, conversations, preferences

def validate(scenarios, conversations, preferences):
    for name, records in [('scenario', scenarios), ('conversation', conversations), ('preference', preferences)]:
        validator = Draft202012Validator(SCHEMAS[name], format_checker=FormatChecker())
        for record in records:
            validator.validate(record)
    ids = [s['scenario_id'] for s in scenarios]
    if len(ids) != len(set(ids)) or [c['scenario_id'] for c in conversations] != ids:
        raise ValueError('Scenario/conversation IDs are not one-to-one')
    candidate_ids = [c['candidate_id'] for conv in conversations for c in conv['candidates']]
    if len(candidate_ids) != len(set(candidate_ids)):
        raise ValueError('Candidate IDs must be unique')
    for s in scenarios:
        if s['content_hash'] != digest({k: v for k, v in s.items() if k != 'content_hash'}):
            raise ValueError('Scenario content hash mismatch')
    for conv in conversations:
        if [m['role'] for m in conv['messages']] != ['user', 'assistant', 'user', 'assistant', 'user']:
            raise ValueError('Expected three user turns with two assistant history turns')
        if any(c['scenario_id'] != conv['scenario_id'] for c in conv['candidates']):
            raise ValueError('Candidate association mismatch')
        if any(c['content_hash'] != digest(c['response']) for c in conv['candidates']):
            raise ValueError('Candidate content hash mismatch')

def embed(scenarios, config):
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(config['embedding_model'], revision=config['embedding_revision'], cache_folder=str(ROOT / '.cache'), device='cpu', trust_remote_code=False)
    # Use full user-side context, not shared assistant boilerplate.
    texts = ['\n'.join(s[k] for k in ('context', 'opening', 'followup', 'user_message')) for s in scenarios]
    token_lengths = [len(model.tokenizer(t, truncation=False)['input_ids']) for t in texts]
    # Use mean normalized embeddings of nonoverlapping token-sized chunks to avoid silent truncation.
    import numpy as np
    encoded = []
    for text in texts:
        ids = model.tokenizer.encode(text, add_special_tokens=False)
        limit = model.max_seq_length - 2
        chunks = [model.tokenizer.decode(ids[i:i+limit], skip_special_tokens=True) for i in range(0, len(ids), limit)]
        v = model.encode(chunks, normalize_embeddings=True, show_progress_bar=False).mean(axis=0)
        encoded.append(v / np.linalg.norm(v))
    pairs = semantic_pairs(encoded, config['semantic_threshold'])
    return pairs, {'status': 'completed', 'model': config['embedding_model'], 'revision': config['embedding_revision'], 'dimensions': model.get_sentence_embedding_dimension(), 'threshold': config['semantic_threshold'], 'chunked_scenarios': sum(n > model.max_seq_length for n in token_lengths), 'method': 'cosine of mean normalized token-chunk embeddings; CPU; no remote code', 'threshold_calibration': 'not clinically or linguistically calibrated'}

def export_review(scenarios, conversations):
    rows = []
    for s, conv in zip(scenarios, conversations):
        for c in conv['candidates']:
            rows.append({'scenario_id': s['scenario_id'], 'candidate_id': c['candidate_id'], 'scenario_hash': s['content_hash'], 'candidate_hash': c['content_hash'],
                         'context': s['context'], 'conversation': '\n'.join(m['role'] + ': ' + m['content'] for m in conv['messages']),
                         'response': c['response'], 'desired_skills': ', '.join(s['desired_skills']), 'prohibited_behaviors': ', '.join(s['prohibited_behaviors']),
                         'risk_level': s['risk_level'], 'language': s['language'], 'automatic_flags': ', '.join(c['automatic_flags']),
                         'intentional_negative': c['intentional_negative'], **{r: '' for r in RATINGS}, 'decision': '', 'preferred_candidate': '',
                         'reviewer_id': '', 'reviewer_role': '', 'clinical_rationale': '', 'edited_response': '', 'native_language_reviewed': '', 'flags_resolved': ''})
    with (ROOT / 'reports/review_queue.csv').open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    write_jsonl(ROOT / 'reports/review_queue.jsonl', rows)
    first20 = ['# First 20 pilot examples', '', '**Synthetic review fixtures only. Not clinically reviewed, not cleared for training.**', '',
               'Each example has three user turns; A/B are alternative draft endings and C is deliberately flawed. No preference is approved. Shared history and template mismatches need editing. Full review queue: `review_queue.csv`.', '']
    for s, conv in zip(scenarios[:20], conversations[:20]):
        first20.extend([f'## {s["scenario_id"]} — {s["context"]}', '', f'{s["condition_family"]} · {s["age_group"]} · {s["language"]} · {s["risk_level"]}', '', f'Goal: {s["clinical_goal"]}', ''])
        first20.extend(f'**{m["role"].title()}:** {m["content"]}\n' for m in conv['messages'])
        for label, c in zip('ABC', conv['candidates']):
            first20.extend([f'**Candidate {label}' + (' — intentional negative' if c['intentional_negative'] else ' — unreviewed') + f':** {c["response"]}', ''])
    (ROOT / 'reports/first-20-examples.md').write_text('\n'.join(first20), encoding='utf-8')

def build(use_embeddings=True):
    config = yaml.safe_load((ROOT / 'configs/dataset.yaml').read_text(encoding='utf-8'))
    registry = json.loads((ROOT / 'source_registry.json').read_text(encoding='utf-8'))
    timestamp = datetime.now(timezone.utc).isoformat()
    scenarios, conversations, preferences = generate(config, timestamp)
    repeats = repeated_responses(conversations)
    validate(scenarios, conversations, preferences)
    texts = ['\n'.join(s[k] for k in ('opening', 'followup', 'user_message')) for s in scenarios]
    exact, normalized = duplicate_pairs(texts), duplicate_pairs(texts, True)
    pairs, embedding = embed(scenarios, config) if use_embeddings else ([], {'status': 'not_run'})
    groups = clusters(len(scenarios), normalized + [(i, j) for i, j, _ in pairs])
    proposed = group_splits(scenarios, pairs, config['seed'], config['split_ratios'])
    leaks = leakage(proposed, pairs)
    if leaks:
        raise ValueError('Cross-split semantic leakage')
    for name, schema in SCHEMAS.items():
        write_json(ROOT / f'schemas/{name}.schema.json', schema)
    write_json(ROOT / 'schemas/taxonomy.json', {'scenario_families': FAMILIES, 'skills': SKILLS, 'negative_behaviors': NEGATIVE, 'specialized_boundary_topics': SPECIALIZED})
    write_jsonl(ROOT / 'data/raw/seeds.jsonl', seeds())
    write_jsonl(ROOT / 'data/generated/scenarios.jsonl', scenarios)
    write_jsonl(ROOT / 'data/generated/conversations.jsonl', conversations)
    write_jsonl(ROOT / 'data/generated/preferences.pending.jsonl', preferences)
    write_jsonl(ROOT / 'reports/safety-review-subset.jsonl', [{'scenario': s, 'conversation': c, 'use': 'development_review_only_NOT_independent_benchmark'} for s, c in zip(scenarios, conversations) if s['risk_level'] != 'routine' or s['condition_family'] in ('adversarial', 'adolescent_specific')])
    write_json(ROOT / 'reports/duplicate-review.json', {'exact_pairs': exact, 'normalized_pairs': normalized, 'semantic_pairs': [{'left': scenarios[i]['scenario_id'], 'right': scenarios[j]['scenario_id'], 'cosine': score} for i, j, score in pairs], 'cluster_assignments': dict(zip([s['scenario_id'] for s in scenarios], groups)), 'action': 'Retained for reviewer adjudication; grouped to prevent split leakage, not automatically deleted.'})
    write_json(ROOT / 'reports/split-dry-run.json', {'status': 'proposal_only_NOT_a_frozen_test_set', 'all_pilot_records_are_development_data': True, 'assignments': proposed})
    blockers = Counter()
    for s, conv in zip(scenarios, conversations):
        for c in conv['candidates']:
            blockers.update(training_blockers(s, c, registry, []))
    report = {'dataset_version': config['version'], 'generated_at': timestamp, 'scenarios': len(scenarios), 'candidates': sum(len(c['candidates']) for c in conversations),
              'language_counts': dict(Counter(s['language'] for s in scenarios)), 'age_counts': dict(Counter(s['age_group'] for s in scenarios)), 'risk_counts': dict(Counter(s['risk_level'] for s in scenarios)),
              'family_counts': dict(Counter(s['condition_family'] for s in scenarios)), 'code_switched': sum(s['code_switching'] for s in scenarios),
              'schema_validation': 'passed', 'reviewed_candidates': 0, 'training_eligible_candidates': 0, 'intentional_negatives': len(scenarios),
              'exact_duplicate_pairs': len(exact), 'normalized_duplicate_pairs': len(normalized), 'semantic_pairs': len(pairs), 'semantic_clusters': len(set(groups)),
              'repeated_candidate_instances_beyond_first': repeats, 'automatic_flags': dict(Counter(f for conv in conversations for c in conv['candidates'] for f in c['automatic_flags'])),
              'embedding_check': embedding, 'split_counts_dry_run': dict(Counter(x['proposed_split'] for x in proposed)), 'split_groups': len(set(x['group'] for x in proposed)),
              'cross_split_pairs_at_threshold': len(leaks), 'training_blockers': dict(blockers), 'training_run': False,
              'limitations': ['Draft templates are not independent teacher outputs.', 'All source rights, clinical reviews, and native-language reviews pending.', 'Pilot is development material, not an independent benchmark.', 'Heuristics cannot establish safety; false positives and missed hazards expected.', 'Similarity threshold needs calibration; English-heavy and very small per-language samples.', 'Repeated assistant histories and response templates reduce effective diversity. No claim of 100 unique therapeutic processes.', 'Some user turns explicitly request the target behavior, a shortcut unsuitable for a final benchmark.']}
    write_json(ROOT / 'reports/quality-report.json', report)
    export_review(scenarios, conversations)
    try:
        commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        commit = 'unavailable'
    manifest = {'dataset_version': config['version'], 'generated_at': timestamp, 'git_base_commit': commit, 'working_tree_changes_included': True,
                'seed': config['seed'], 'config': config, 'source_registry_hash': digest(registry), 'scenario_content_hash': digest(scenarios),
                'generator_files': {p.name: digest(p.read_text(encoding='utf-8')) for p in sorted((ROOT / 'src/paasaa_research').glob('*.py'))}, 'embedding': embedding}
    write_json(ROOT / 'reports/build-manifest.json', manifest)
    summary = ['# Pilot dataset quality report', '', 'Status: **review-only draft; not eligible for training.**', '',
               f'- {report["scenarios"]} scenarios, {report["candidates"]} candidates, {len(FAMILIES)} scenario families.',
               f'- Languages: {report["language_counts"]}; age groups: {report["age_counts"]}.',
               f'- Schema validation: passed. Human reviews: 0. Training eligible: 0.',
               f'- Exact / normalized duplicate pairs: {len(exact)} / {len(normalized)}.',
               f'- Embedding check: {embedding["status"]}. Near-duplicate pairs: {len(pairs)}; scenario clusters: {len(set(groups))}.',
               f'- Repeated candidate instances beyond the first: {repeats}. These are flagged, not removed.',
               f'- Dry-run split sizes: {report["split_counts_dry_run"]}; groups: {report["split_groups"]}; cross-split semantic pairs at configured threshold: {len(leaks)}.',
               '- This is not a frozen holdout; all 100 examples are development/review data.', '', '## Limitations and review priorities', ''] + ['- ' + x for x in report['limitations']]
    summary += ['', 'Inspect safety examples first, then corrections/refusals, context mismatch, translated/code-switched examples, and near-duplicate clusters. Replace generic history turns before expanding. Do not scale simply by paraphrasing.', '', 'Full counts and flags: `quality-report.json`. Pair list: `duplicate-review.json`. First 20: `first-20-examples.md`.']
    (ROOT / 'reports/quality-report.md').write_text('\n'.join(summary) + '\n', encoding='utf-8')
    print(json.dumps({k: report[k] for k in ['scenarios', 'candidates', 'schema_validation', 'semantic_pairs', 'training_eligible_candidates']}, indent=2))

def read_reviews(path):
    if path.suffix.lower() != '.csv':
        return read_jsonl(path)
    def boolean(value):
        if value.lower() not in ('true', 'false'):
            raise ValueError('Reviewed CSV rows require true/false for both review flags')
        return value.lower() == 'true'
    with path.open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    records = []
    for row in rows:
        if not row['decision'].strip():
            continue
        r = {k: row[k].strip() for k in ('scenario_id', 'candidate_id', 'candidate_hash', 'scenario_hash', 'reviewer_id', 'reviewer_role', 'decision', 'clinical_rationale')}
        r.update(ratings={k: int(row[k]) for k in RATINGS}, preferred_candidate=row['preferred_candidate'].strip() or None,
                 edited_response=row['edited_response'].strip() or None, native_language_reviewed=boolean(row['native_language_reviewed'].strip()), flags_resolved=boolean(row['flags_resolved'].strip()))
        records.append(r)
    return records

def import_review(path):
    records = read_reviews(path)
    if not records:
        raise ValueError('No completed review rows to import')
    scenarios = read_jsonl(ROOT / 'data/generated/scenarios.jsonl')
    conversations = read_jsonl(ROOT / 'data/generated/conversations.jsonl')
    reviewed = validate_reviews(records, scenarios, conversations)
    destination = ROOT / 'data/reviewed' / f'reviews-{digest(records)[:16]}.jsonl'
    if destination.exists():
        raise FileExistsError('This exact review batch has already been imported')
    write_jsonl(destination, reviewed)
    print(f'Imported {len(reviewed)} reviews to {destination.name}; no training data exported.')

def main():
    parser = argparse.ArgumentParser(description='Paasaa review-only research pilot; no training command.')
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('build')
    p.add_argument('--skip-embeddings', action='store_true', help='Fast draft only; report explicitly says semantic check did not run')
    r = sub.add_parser('import-review')
    r.add_argument('path', type=Path)
    sub.add_parser('validate')
    args = parser.parse_args()
    if args.command == 'build':
        build(not args.skip_embeddings)
    elif args.command == 'import-review':
        import_review(args.path)
    else:
        validate(read_jsonl(ROOT / 'data/generated/scenarios.jsonl'), read_jsonl(ROOT / 'data/generated/conversations.jsonl'), read_jsonl(ROOT / 'data/generated/preferences.pending.jsonl'))
        print('Schemas and conversation associations passed.')
