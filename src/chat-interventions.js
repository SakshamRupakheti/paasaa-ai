import {muscleGroups,discreetGroups,EVIDENCE} from './support-content.js';
import {pmrPlan,breathingPlan,groundingPlan} from './support-model.js';
const pmr=(id,title,groups,publicFriendly=true,rounds=1)=>({id,title,family:'pmr',allowedStates:['MUSCLE_TENSION','PERFORMANCE_ANXIETY','SLEEP_TENSION','ACUTE_ANXIETY'],prohibitedWhen:['pain','injury','recent surgery','driving'],environmentSupport:publicFriendly?['private','public','unknown']:['private'],estimatedDuration:groups.length*25*rounds,instructions:pmrPlan(groups,{rounds}),evidenceNotes:EVIDENCE.pmr.explanation,version:'1.0.0',clinicalReviewStatus:'pending'});
export const INTERVENTIONS=Object.freeze({
  pmr_shoulders:pmr('pmr_shoulders','Shoulder release',muscleGroups().filter(g=>g.id==='shoulders'),false),
  pmr_hands:pmr('pmr_hands','Discreet hand release',discreetGroups(['Hands'])),
  pmr_forearms:pmr('pmr_forearms','Forearm release',discreetGroups(['Forearms'])),
  pmr_thighs:pmr('pmr_thighs','Thigh release',discreetGroups(['Thighs'])),
  pmr_feet:pmr('pmr_feet','Foot release',discreetGroups(['Feet'])),
  pmr_full16:pmr('pmr_full16','Full body relaxation',muscleGroups(),false,2),
  paced_breathing:{id:'paced_breathing',title:'Comfortable breathing',family:'breathing',allowedStates:['ACUTE_ANXIETY','GENERAL_DISTRESS'],prohibitedWhen:['dizziness','breathlessness','driving'],environmentSupport:['public','private','unknown'],estimatedDuration:60,instructions:breathingPlan(),evidenceNotes:EVIDENCE.breathing.explanation,version:'1.0.0',clinicalReviewStatus:'pending'},
  grounding_orientation:{id:'grounding_orientation',title:'Notice your surroundings',family:'grounding',allowedStates:['ACUTE_ANXIETY','GENERAL_DISTRESS'],prohibitedWhen:['driving'],environmentSupport:['public','private','unknown'],estimatedDuration:20,instructions:groundingPlan().slice(0,1),evidenceNotes:EVIDENCE.grounding.explanation,version:'1.0.0',clinicalReviewStatus:'pending'},
});
export function interventionAction(id){const item=INTERVENTIONS[id];return item?{type:item.family==='pmr'?'START_PMR_STEP':item.family==='breathing'?'START_BREATHING':'START_GROUNDING',interventionId:id,version:item.version}:null;}
