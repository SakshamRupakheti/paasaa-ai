"""Review import is append-only. EDIT requires a fresh review of the edited text."""
from jsonschema import Draft202012Validator
from .quality import digest
from .schemas import EVALUATION
from .teachers import rights_blockers

def validate_reviews(records, scenarios, conversations):
    index = {s['scenario_id']: s for s in scenarios}
    candidates = {c['candidate_id']: c for conv in conversations for c in conv['candidates']}
    accepted = []
    seen = set()
    for r in records:
        Draft202012Validator(EVALUATION).validate(r)
        sid, cid = r['scenario_id'], r['candidate_id']
        if sid not in index or cid not in candidates or candidates[cid]['scenario_id'] != sid:
            raise ValueError('Unknown scenario/candidate association')
        if r['candidate_hash'] != candidates[cid]['content_hash'] or r['scenario_hash'] != index[sid]['content_hash']:
            raise ValueError('Stale review: content hashes differ')
        preferred = r['preferred_candidate']
        if preferred is not None and (preferred not in candidates or candidates[preferred]['scenario_id'] != sid):
            raise ValueError('Preferred candidate belongs to another scenario')
        if r['decision'] == 'EDIT' and not (r['edited_response'] or '').strip():
            raise ValueError('EDIT requires replacement text')
        if r['decision'] != 'EDIT' and r['edited_response'] is not None:
            raise ValueError('Only EDIT can contain replacement text')
        key = (cid, r['reviewer_id'])
        if key in seen:
            raise ValueError('Duplicate reviewer/candidate entry in this batch')
        seen.add(key)
        accepted.append({**r, 'review_hash': digest(r), 'edited_text_requires_new_review': r['decision'] == 'EDIT'})
    return accepted

def training_blockers(scenario, candidate, registry, reviews, pilot_approved=False, holdout_frozen=False):
    reasons = []
    if not pilot_approved:
        reasons.append('pilot_not_approved')
    if not holdout_frozen:
        reasons.append('independent_holdout_not_frozen')
    for source_id in {scenario['source_id'], candidate['source_id']}:
        reasons.extend(rights_blockers(registry.get(source_id, {})))
    if candidate['intentional_negative']:
        reasons.append('intentional_negative_not_sft')
    current = [r for r in reviews if r['candidate_id'] == candidate['candidate_id'] and r['candidate_hash'] == candidate['content_hash'] and r['scenario_hash'] == scenario['content_hash']]
    if any(r['decision'] in ('REJECT', 'EDIT') for r in current):
        reasons.append('unresolved_review_conflict_or_edit')
    approved = [r for r in current if r['decision'] == 'APPROVE']
    clinical = [r for r in approved if r['reviewer_role'] == 'clinician' and r['ratings']['safety'] >= 4 and r['ratings']['clinical_appropriateness'] >= 4 and r['flags_resolved']]
    if not clinical:
        reasons.append('clinical_review_missing')
    if not any(r['native_language_reviewed'] for r in approved):
        reasons.append('native_language_review_missing')
    return sorted(set(reasons))
