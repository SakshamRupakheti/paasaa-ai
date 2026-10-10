import {EMOTIONS,SYMPTOMS,CONTEXTS,BEHAVIORS,AREAS} from './checkin-model.js';
// Same fields and scales as the existing daily check-in; no model extraction.
export const checkinQuestions=[
  {field:'anxietyIntensity',question:'How anxious do you feel right now?',type:'rating',max:10},
  {field:'emotions',question:'What emotions are you noticing?',type:'multi',choices:EMOTIONS},
  {field:'physicalSymptoms',question:'What are you noticing in your body?',type:'multi',choices:SYMPTOMS,exclusive:'Nothing noticeable'},
  {field:'contextCategories',question:'What was happening around that time?',type:'multi',choices:CONTEXTS},
  {field:'contextNarrative',question:'Would you like to describe what happened?',type:'text'},
  {field:'automaticThought',question:'What was going through your mind?',type:'text'},
  {field:'thoughtBeliefStrength',question:'How strongly did that thought feel true?',type:'rating',max:100},
  {field:'behaviors',question:'What did you do when you felt anxious?',type:'multi',choices:BEHAVIORS},
  {field:'functionalImpact',question:'How much did anxiety get in the way today?',type:'rating',max:10},
  {field:'interferenceAreas',question:'Which parts of your day did it affect?',type:'multi',choices:AREAS},
];
export function validateCheckinAnswer(q,value){
  if(q.type==='rating')return value===null||Number.isInteger(value)&&value>=0&&value<=q.max;
  if(q.type==='multi')return Array.isArray(value)&&value.every(v=>q.choices.includes(v))&&(!q.exclusive||!value.includes(q.exclusive)||value.length===1);
  return typeof value==='string'&&value.length<=6000;
}
