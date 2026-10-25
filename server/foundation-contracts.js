export const FOUNDATION_VERSIONS=Object.freeze({architecture:'1.0.0',memory:'1.0.0',outcomes:'1.0.0',review:'1.0.0',corpus:'0.2.0',context:'1.0.0'});
export const MEMORY_TYPES=['preferred_name','preferred_language','communication_preferences','patient_confirmed_goals','known_triggers','repeated_worries','declined_interventions','relevant_patient_confirmed_history'];
export const OUTCOMES=['helpful','unchanged','unhelpful','worse','unsure'];
export const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
export function text(value,max=600){if(typeof value!=='string'||!value.trim()||value.length>max)fail('Use a nonempty, shorter text value.');return value.trim();}
export function date(value){if(value===null||value===undefined||value==='')return null;if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))fail('Use a valid date.');return new Date(value).toISOString();}
export function rating(value){if(value==null)return null;if(!Number.isInteger(value)||value<0||value>10)fail('Use a rating from 0 to 10, or leave it blank.');return value;}
export function exact(body,allowed){if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!allowed.includes(k)))fail('Unsupported fields.');}
