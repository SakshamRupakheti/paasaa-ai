import {FOUNDATION_VERSIONS,fail,text,exact} from './foundation-contracts.js';
export const REVIEW_STATES=['NOT_REVIEWED','QUEUED_FOR_REVIEW','REVIEWED','FOLLOWUP_REQUESTED','RESOLVED'];
export const SAFETY_REVIEW_STATES=['DETECTED','PATIENT_GUIDANCE_SHOWN','REVIEW_CREATED','NOTIFICATION_SENT','ACKNOWLEDGED','UNDER_REVIEW','RESOLVED'];
const transitions={NOT_REVIEWED:['QUEUED_FOR_REVIEW'],QUEUED_FOR_REVIEW:['REVIEWED'],REVIEWED:['FOLLOWUP_REQUESTED','RESOLVED'],FOLLOWUP_REQUESTED:['REVIEWED','RESOLVED'],RESOLVED:[]};
export function newReview(interaction){
  if(interaction.synthetic!==true)fail('Only synthetic interactions may enter this prototype review workflow.');
  return {id:crypto.randomUUID(),interaction_id:text(interaction.id,160),exchange:interaction.exchange?text(interaction.exchange,6000):null,synthetic:true,state:'NOT_REVIEWED',version:FOUNDATION_VERSIONS.review,feedback:null,events:[],dataset_approved:false};
}
// Caller supplies a verified reviewer identity from a trusted context, never a
// patient body or user_metadata. No production clinician endpoint is enabled.
export function transitionReview(review,next,actor,feedback=null,now=new Date().toISOString()){
  if(actor?.verified!==true||actor?.role!=='reviewer'||!actor.id)fail('Verified reviewer required.',403);
  if(!transitions[review.state]?.includes(next))fail('Invalid review transition.');
  if(next==='REVIEWED'){
    exact(feedback,['rating','appropriate','correction','error_type','clinical_strategy','safety_issue','clinical_rationale','reviewer_notes']);
    if(!Number.isInteger(feedback.rating)||feedback.rating<1||feedback.rating>5||typeof feedback.appropriate!=='boolean'||typeof feedback.safety_issue!=='boolean')fail('Complete the review ratings.');
    for(const key of ['correction','error_type','clinical_strategy','clinical_rationale','reviewer_notes'])text(feedback[key],2000);
  }
  return {...review,state:next,feedback:feedback||review.feedback,events:[...review.events,{from:review.state,to:next,actor:actor.id,at:now}],dataset_approved:false};
}
export function advanceSafetyReview(record,next,evidence){
  const allowed={DETECTED:['PATIENT_GUIDANCE_SHOWN'],PATIENT_GUIDANCE_SHOWN:['REVIEW_CREATED'],REVIEW_CREATED:['NOTIFICATION_SENT','ACKNOWLEDGED'],NOTIFICATION_SENT:['ACKNOWLEDGED'],ACKNOWLEDGED:['UNDER_REVIEW'],UNDER_REVIEW:['RESOLVED'],RESOLVED:[]};
  const required={PATIENT_GUIDANCE_SHOWN:'guidance_event_id',REVIEW_CREATED:'review_id',NOTIFICATION_SENT:'delivery_id',ACKNOWLEDGED:'reviewer_ack_id',UNDER_REVIEW:'reviewer_id',RESOLVED:'resolution_id'};
  if(!allowed[record.state]?.includes(next)||!evidence?.[required[next]])fail('Verified workflow evidence required.');
  return {...record,state:next,events:[...(record.events||[]),{state:next,evidence_id:text(evidence[required[next]],160),at:new Date().toISOString()}]};
}
export function datasetCandidate(review,governance){
  if(review.state!=='RESOLVED'||review.feedback?.appropriate!==true||review.feedback.safety_issue||governance?.sourceRightsApproved!==true||governance?.researchConsent!==true||governance?.deidentified!==true||governance?.independentClinicalApproval!==true||!governance?.approvalId)fail('Dataset inclusion requires separate governance approval.');
  return {review_id:review.id,approval_id:governance.approvalId,status:'candidate_only',training_allowed:false,version:FOUNDATION_VERSIONS.corpus};
}
