import {FOUNDATION_VERSIONS,MEMORY_TYPES,OUTCOMES,fail,text,date,rating,exact} from './foundation-contracts.js';
import {INTERVENTIONS} from '../src/chat-interventions.js';
export function makeMemory(body,owner,previous=null,now=new Date().toISOString()){
  exact(body,['id','revision','memory_type','content','confirmed','use_in_chat','valid_until','operation']);
  if(body.operation==='revoke'){
    if(!previous)fail('Memory not found.',404);
    return {...previous,content:'',confirmation_status:'revoked',use_in_chat:false,last_updated_at:now};
  }
  if(!MEMORY_TYPES.includes(body.memory_type)||body.confirmed!==true||typeof body.use_in_chat!=='boolean')fail('Choose a memory type and confirm what you want to save.');
  if(body.memory_type==='declined_interventions'&&!Object.hasOwn(INTERVENTIONS,body.content))fail('Choose an existing practice to avoid.');
  const expiry=date(body.valid_until);if(expiry&&expiry<=now)fail('The expiry must be in the future.');
  return {id:previous?.id||crypto.randomUUID(),kind:'memory',patient_id:owner,memory_type:body.memory_type,content:text(body.content),source:'patient_entry',created_at:previous?.created_at||now,last_updated_at:now,confirmation_status:'patient_confirmed',sensitivity_level:'sensitive',valid_until:expiry,clinician_verified:false,patient_editable:true,use_in_chat:body.use_in_chat,schema_version:FOUNDATION_VERSIONS.memory};
}
export function makeOutcome(body,owner,now=new Date().toISOString()){
  exact(body,['intervention_id','context','started_at','completed_at','pre_rating','post_rating','patient_reported_helpfulness','patient_feedback','followup_date','use_in_chat','confirmed']);
  if(!Object.hasOwn(INTERVENTIONS,body.intervention_id)||!OUTCOMES.includes(body.patient_reported_helpfulness)||body.confirmed!==true||typeof body.use_in_chat!=='boolean')fail('Confirm an existing practice and your own reported outcome.');
  const started=date(body.started_at),completed=date(body.completed_at),followup=date(body.followup_date);
  if(!started||!completed||started>completed||completed>now||followup&&followup<=now)fail('Check the practice and follow-up dates.');
  return {id:crypto.randomUUID(),kind:'intervention_outcome',patient_id:owner,intervention_id:body.intervention_id,intervention_type:INTERVENTIONS[body.intervention_id].family,context:text(body.context),started_at:started,completed_at:completed,pre_rating:rating(body.pre_rating),post_rating:rating(body.post_rating),patient_reported_helpfulness:body.patient_reported_helpfulness,patient_feedback:body.patient_feedback?text(body.patient_feedback):'',followup_required:!!followup,followup_date:followup,source:'patient_entry',confirmation_status:'patient_confirmed',use_in_chat:body.use_in_chat,schema_version:FOUNDATION_VERSIONS.outcomes};
}
// Only server-loaded owned records enter here. Content stays data, not policy.
export function selectPatientContext(records,outcomes,query,owner,now=new Date().toISOString()){
  const words=new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]);
  const relevant=content=>[...words].some(w=>content.toLowerCase().includes(w));
  const valid=r=>r.patient_id===owner&&r.confirmation_status==='patient_confirmed'&&r.source==='patient_entry'&&r.use_in_chat===true&&(!r.valid_until||r.valid_until>now);
  const memories=records.filter(valid).filter(r=>MEMORY_TYPES.includes(r.memory_type)&&typeof r.content==='string'&&typeof r.last_updated_at==='string').filter(r=>['preferred_name','preferred_language','communication_preferences','declined_interventions'].includes(r.memory_type)||relevant(r.content)).sort((a,b)=>b.last_updated_at.localeCompare(a.last_updated_at)).slice(0,4).map(r=>({id:r.id,type:r.memory_type,content:r.content.slice(0,400),source:r.source}));
  const recent=outcomes.filter(valid).filter(r=>Object.hasOwn(INTERVENTIONS,r.intervention_id)&&typeof r.context==='string'&&typeof r.patient_feedback==='string'&&typeof r.completed_at==='string'&&OUTCOMES.includes(r.patient_reported_helpfulness)).filter(r=>relevant(r.context)||['worse','unhelpful'].includes(r.patient_reported_helpfulness)).sort((a,b)=>b.completed_at.localeCompare(a.completed_at));
  const declined=records.filter(valid).filter(r=>r.memory_type==='declined_interventions'&&Object.hasOwn(INTERVENTIONS,r.content)).map(r=>r.content);
  return {version:FOUNDATION_VERSIONS.context,memories,outcomes:recent.slice(0,1).map(r=>({id:r.id,intervention_id:r.intervention_id,helpfulness:r.patient_reported_helpfulness,feedback:r.patient_feedback.slice(0,300)})),declinedInterventions:[...new Set([...declined,...recent.filter(r=>['worse','unhelpful'].includes(r.patient_reported_helpfulness)).map(r=>r.intervention_id)])].slice(0,20)};
}
export function contextualCheckin(outcomes,owner,now=new Date().toISOString()){
  const due=outcomes.filter(r=>r.patient_id===owner&&r.confirmation_status==='patient_confirmed'&&r.followup_required&&r.followup_date<=now).sort((a,b)=>a.followup_date.localeCompare(b.followup_date))[0];
  return due?{record_id:due.id,message:'You wanted to check back on a practice. Want to record how it went?',route:'#memory'}:null;
}
