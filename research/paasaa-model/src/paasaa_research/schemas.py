from .taxonomy import FAMILIES, LANGUAGES, SKILLS, NEGATIVE, RATINGS

TEXT = {'type': 'string', 'minLength': 1}
def enum(values):
    return {'enum': values}
def array(items, minimum=0):
    return {'type': 'array', 'items': items, 'minItems': minimum}
def obj(properties):
    return {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'type': 'object', 'properties': properties, 'required': list(properties), 'additionalProperties': False}

SCENARIO = obj({
 'scenario_id': TEXT, 'dataset_version': TEXT, 'age_group': enum(['adult', 'adolescent']),
 'condition_family': enum(FAMILIES), 'context': TEXT, 'conversation_stage': TEXT,
 'risk_level': enum(['routine', 'clinical_follow_up', 'urgent', 'medical_emergency']),
 'language': enum(LANGUAGES), 'language_mix': array(enum(LANGUAGES), 1),
 'code_switching': {'type': 'boolean'}, 'translation_origin': TEXT,
 'native_review_status': enum(['pending', 'approved']), 'desired_skills': array(enum(SKILLS), 1),
 'prohibited_behaviors': array(enum(NEGATIVE), 1), 'opening': TEXT, 'followup': TEXT,
 'user_message': TEXT, 'clinical_goal': TEXT, 'source_id': TEXT,
 'scenario_family': TEXT, 'conversation_family': TEXT, 'template_origin': TEXT, 'content_hash': TEXT,
})
MESSAGE = obj({'role': enum(['user', 'assistant']), 'content': TEXT})
CANDIDATE = obj({
 'scenario_id': TEXT, 'candidate_id': TEXT, 'source_id': TEXT, 'teacher_model': TEXT,
 'response': TEXT, 'temperature': {'type': 'number', 'minimum': 0}, 'generation_timestamp': {'type': 'string', 'format': 'date-time'},
 'prompt_version': TEXT, 'automatic_flags': array(TEXT), 'intentional_negative': {'type': 'boolean'},
 'negative_behaviors': array(enum(NEGATIVE)), 'review_status': enum(['pending']), 'content_hash': TEXT,
})
CONVERSATION = obj({'scenario_id': TEXT, 'messages': array(MESSAGE, 5), 'candidates': {**array(CANDIDATE, 3), 'maxItems': 5}})
RATING = obj({name: {'type': 'integer', 'minimum': 1, 'maximum': 5} for name in RATINGS})
EVALUATION = obj({
 'scenario_id': TEXT, 'candidate_id': TEXT, 'candidate_hash': TEXT, 'scenario_hash': TEXT,
 'reviewer_id': TEXT, 'reviewer_role': enum(['clinician', 'trained_reviewer', 'native_language_reviewer']),
 'decision': enum(['APPROVE', 'EDIT', 'REJECT']), 'ratings': RATING,
 'preferred_candidate': {'type': ['string', 'null']}, 'clinical_rationale': {'type': 'string'},
 'edited_response': {'type': ['string', 'null']}, 'native_language_reviewed': {'type': 'boolean'},
 'flags_resolved': {'type': 'boolean'},
})
PREFERENCE = obj({'scenario_id': TEXT, 'preferred_candidate': {'type': ['string', 'null']}, 'rejected_candidate': {'type': ['string', 'null']}, 'preferred_response': {'type': ['string', 'null']}, 'rejected_response': {'type': ['string', 'null']}, 'reason': {'type': ['string', 'null']}, 'status': enum(['unselected_pending_review', 'reviewed'])})
SCHEMAS = {'scenario': SCENARIO, 'candidate': CANDIDATE, 'conversation': CONVERSATION, 'preference': PREFERENCE, 'evaluation': EVALUATION}
