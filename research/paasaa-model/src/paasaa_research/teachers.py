"""Provider-neutral boundary. Credentials and networking belong in an approved adapter."""
from dataclasses import dataclass
from typing import Callable

KINDS = {'local_open_weight', 'permitted_api', 'clinician_authored', 'manual', 'licensed_public', 'internal_synthetic'}
REQUIRED_SOURCE = {'source_name', 'source_type', 'license', 'allowed_for_training', 'allowed_for_commercial_use', 'review_status', 'date_checked'}

def rights_blockers(source):
    blockers = []
    if not REQUIRED_SOURCE <= source.keys():
        blockers.append('incomplete_source_metadata')
    if source.get('source_type') not in KINDS:
        blockers.append('unsupported_source_type')
    if source.get('allowed_for_training') is not True:
        blockers.append('training_rights_missing')
    if source.get('allowed_for_commercial_use') is not True:
        blockers.append('commercial_rights_missing')
    if source.get('review_status') != 'approved':
        blockers.append('source_review_pending')
    if not source.get('license') or any(word in source['license'].upper() for word in ['UNKNOWN', 'UNRESOLVED']):
        blockers.append('license_unresolved')
    return blockers

@dataclass
class ApprovedTeacher:
    source: dict
    model: str
    generate: Callable[[dict], list[str]]

    def candidates(self, scenario):
        blockers = rights_blockers(self.source)
        if blockers:
            raise PermissionError(', '.join(blockers))
        responses = self.generate(scenario)
        if not 3 <= len(responses) <= 5 or any(not isinstance(x, str) or not x.strip() for x in responses):
            raise ValueError('Teacher must return 3–5 nonempty responses')
        return responses

def import_candidates(records, registry):
    """Adapter for licensed/manual/clinician/local/API exports, without initiating a teacher call."""
    for record in records:
        blockers = rights_blockers(registry.get(record.get('source_id'), {}))
        if blockers:
            raise PermissionError(', '.join(blockers))
        if not all(record.get(k) for k in ('teacher_model', 'prompt_version', 'generation_timestamp', 'response')):
            raise ValueError('Missing candidate provenance')
    return records
