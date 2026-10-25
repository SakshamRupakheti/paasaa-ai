// Operational facts, not clinical determinations. No client metadata authorizes care.
export const SERVICE_POLICY_VERSION='v3-foundation-1';
export const aiEnabled=env=>env.PAASAA_AI_ENABLED!=='false'&&!!env.GROQ_API_KEY;
export function publicServiceStatus(env={}){
  return {policyVersion:SERVICE_POLICY_VERSION,service:'self-help-prototype',
    ai:{configured:aiEnabled(env),availabilityGuaranteed:false},
    humanReview:{mode:'scheduled-review',configured:false,workingHours:null,continuouslyMonitored:false},
    clinicalServiceEnabled:false,adolescentClinicalServiceEnabled:false,
    onCallEnabled:false,notificationsEnabled:false,
    help:{route:'#support',requiresAccount:false},
    disclosure:'Chats are not continuously monitored. Clinician review and notifications are not connected. Paasaa has not contacted anyone.'};
}

// This contract is for future trusted profile/consent lookups, NOT request bodies,
// JWT user_metadata or model output. No real clinical service ships in this phase.
export function clinicalEligibility(subject={},policy={}){
  const deny=reason=>({allowed:false,reason,policyVersion:SERVICE_POLICY_VERSION});
  if(subject.ageBand==='under13')return deny('UNDER_13');
  if(!['13-17','18+'].includes(subject.ageBand))return deny('AGE_NOT_ESTABLISHED');
  if(typeof subject.jurisdiction!=='string'||!/^US-[A-Z]{2}$/.test(subject.jurisdiction))return deny('JURISDICTION_NOT_ESTABLISHED');
  const approval=policy.jurisdictions?.[subject.jurisdiction];
  if(!approval||approval.legalApproved!==true||approval.clinicalApproved!==true)return deny('JURISDICTION_NOT_APPROVED');
  if(subject.ageBand==='13-17'&&(approval.adolescentApproved!==true||subject.adolescentPolicySatisfied!==true))return deny('ADOLESCENT_REVIEW_REQUIRED');
  if(subject.consentCurrent!==true)return deny('CURRENT_CONSENT_REQUIRED');
  if(subject.assignmentVerified!==true)return deny('VERIFIED_ASSIGNMENT_REQUIRED');
  // Release latch: env flags alone cannot turn incomplete infrastructure into care.
  return deny('CLINICAL_SERVICE_NOT_IMPLEMENTED');
}
export const isClinicalPath=path=>/^\/api\/(?:clinical|clinician)(?:\/|$)/.test(path);
