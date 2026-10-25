import {fail} from './foundation-contracts.js';
export const EVALUATION_DIMENSIONS=['naturalness','reflection_accuracy','empathy','therapeutic_alliance','appropriate_next_question','clinical_fidelity','patient_autonomy','boundary_adherence','false_reassurance','premature_advice','safety','hallucination','memory_accuracy','multilingual_quality'];
function valid(rule,value){
  if(rule.enum&&!rule.enum.includes(value))return false;
  if(rule.type==='string')return typeof value==='string'&&value.length<=rule.maxLength;
  if(rule.type==='array')return Array.isArray(value)&&value.length<=rule.maxItems&&value.every(v=>valid(rule.items,v));
  if(rule.type==='object')return !!value&&typeof value==='object'&&!Array.isArray(value)&&rule.required.every(k=>Object.hasOwn(value,k))&&Object.keys(value).every(k=>Object.hasOwn(rule.properties,k)&&valid(rule.properties[k],value[k]));
  return true;
}
export function validateCorpus(schema,record){
  if(!record||typeof record!=='object'||Array.isArray(record))fail('Invalid corpus record.');
  if(schema.required.some(k=>!Object.hasOwn(record,k))||Object.keys(record).some(k=>!Object.hasOwn(schema.properties,k)))fail('Missing or unexpected corpus fields.');
  for(const [key,rule]of Object.entries(schema.properties)){
    const value=record[key];
    if(!valid(rule,value))fail('Invalid '+key);
  }
  if(!record.scenario_id.trim()||!record.current_patient_message.trim()||!record.dataset_version.trim())fail('Corpus identity, message and version are required.');
  return record;
}
export function corpusCandidate(record,governance){
  if(record.clinician_review_status!=='approved_candidate'||governance?.source_rights!==true||governance?.clinical_review!==true||governance?.research_consent!==true||governance?.deidentified!==true||!governance?.approval_id)fail('Corpus governance is incomplete.');
  return {scenario_id:record.scenario_id,dataset_version:record.dataset_version,approval_id:governance.approval_id,state:'research_candidate',training_allowed:false};
}
export function evaluationReport(runs){
  for(const run of runs){if(!run.case_id||!run.model||!run.prompt_version||!run.policy_version||!['en','hi','ne','es'].includes(run.language))fail('Evaluation provenance is incomplete.');for(const dim of EVALUATION_DIMENSIONS){const value=run.ratings?.[dim];if(value!==null&&(!Number.isInteger(value)||value<1||value>5))fail('Each dimension needs a 1–5 rating or null.');}}
  return {version:'1.0.0',clinical_validation:false,cases:runs.length,dimensions:Object.fromEntries(EVALUATION_DIMENSIONS.map(dim=>{const scores=runs.map(r=>r.ratings[dim]).filter(v=>v!==null);return [dim,{rated:scores.length,unrated:runs.length-scores.length,mean:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null}];})),note:'Descriptive reviewer ratings only. Not clinical efficacy, diagnostic accuracy, or evidence of safe deployment.'};
}
