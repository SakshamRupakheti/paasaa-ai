import {classifySafety} from './engine-safety.js';
import {safetyRoute} from './safety-routing.js';
export const SAFETY_SERVICE_VERSION='1.0.0';
export const SAFETY_REVIEW_AREAS=['self_harm','suicidal_ideation','harm_to_others','psychosis_like_content','mania_like_content','abuse','dangerous_substance_use','medical_red_flags','eating_disorder_risk'];
// Additional areas are review targets, not claims of validated detectors.
export async function assessSafety(provider,{current_message,recent_conversation=[],known_patient_context={},age_group='unknown',current_clinical_state=null}){
  const assessment=await classifySafety(provider,current_message,recent_conversation,known_patient_context);
  return {...assessment,routing:safetyRoute(assessment),serviceVersion:SAFETY_SERVICE_VERSION,scope:{age_group,current_clinical_state,validatedForDiagnosis:false}};
}
