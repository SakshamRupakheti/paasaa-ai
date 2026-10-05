import {overwhelmed} from '../src/conversation-model.js';
export function conversationMode(session,plan,safety,message=''){
  if(safety?.needsEmergencyPath||safety?.needsSafetyQuestion||session.safetyState==='needs-human-support')return 'SAFETY_ESCALATION';
  if(overwhelmed(message)||['ACUTE_ANXIETY','MUSCLE_TENSION','PHYSICAL_DISCOMFORT'].includes(plan?.primaryState))return 'ACUTE_ANXIETY';
  if(!session.companion||['WORRY','PERFORMANCE_ANXIETY','SOCIAL_ANXIETY','INTRUSIVE_THOUGHT','POSSIBLE_OCD_REASSURANCE_LOOP'].includes(plan?.primaryState))return 'CBT_SUPPORT';
  return 'NORMAL';
}
export function modeChoices(mode,memory){
  if(!memory.wantsAdvice||!memory.questionsAllowed)return [];
  if(mode==='ACUTE_ANXIETY')return [{id:'settle',label:'Help me get unstuck'},{id:'listen',label:'Let me talk'},{id:'reflect',label:'I can work through it'}];
  if(mode==='CBT_SUPPORT')return [{id:'reflect',label:'Work through this worry'},{id:'listen',label:'Just talk'}];
  return [];
}
