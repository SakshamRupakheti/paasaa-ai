import {runConversationEngine} from './conversation-engine.js';
import {newMemory} from './engine-memory.js';
import {INTERVENTIONS} from '../src/chat-interventions.js';
const fail=message=>{throw Object.assign(Error(message),{status:400});};
export async function engineTurn(session,body,env,store){
  const s=structuredClone(session);let action=body.action;
  if(!action&&typeof body.value==='string'){
    const command=body.value.trim().toLowerCase().replace(/[’]/g,"'").replace(/[.!]+$/,'');
    if(/^(stop|pause|i don't want to do this)$/.test(command))action='pause';
    if(/^(start over|restart|start again)$/.test(command))action='restart';
  }
  if(!s.engineMemory){s.engineMemory=newMemory();if(s.declined?.includes('breathing')){s.engineMemory.breathingRejected=true;s.engineMemory.interventionsRejected.push('paced_breathing');}}
  if(s.safetyState==='needs-human-support'&&!s.engineMemory.unresolvedUrgent)s.engineMemory.unresolvedUrgent={riskLevel:'urgent',category:'unclear',needsEmergencyPath:true};
  if(body.voice&&(typeof body.voice.rawTranscript!=='string'||body.voice.rawTranscript.length>6000||body.voice.cleanedTranscript!==null||body.voice.patientApprovedText!==body.value))fail('Approve the transcript before sending.');
  if(['CHAT_PAUSED','CHAT_ENDED'].includes(s.state)&&!['resume','end','restart','chat'].includes(action))fail('Resume this conversation before sending a message.');
  if(body.value!==undefined&&(typeof body.value!=='string'||body.value.length>6000))fail('Please send a text message.');
  if(action&&!['pause','end','restart','resume','another','chat','listen','exerciseDone','exerciseStop','exerciseSkip','BETTER','SAME','WORSE','UNKNOWN'].includes(action))fail('This chat action is not available.');
  if(['exerciseDone','exerciseStop','exerciseSkip'].includes(action)&&!s.chatAction)fail('No exercise is active.');
  if(['BETTER','SAME','WORSE','UNKNOWN'].includes(action)&&!s.lastInterventionId)fail('No exercise is awaiting feedback.');
  let message=body.value?.trim()||'';
  if(!action&&!message)fail('Write a message before sending.');
  if(['pause','end','restart','resume','chat','listen'].includes(action)){
    if(action==='pause'||action==='end'){s.state=action==='pause'?'CHAT_PAUSED':'CHAT_ENDED';s.status=action==='pause'?'paused':'ended';s.aiMessage='We can stop here. You can return when you want.';}
    else {s.state='CHAT';s.status='active';s.aiMessage=s.engineMemory?.unresolvedUrgent?'Please use human support for the safety concern we discussed. Paasaa cannot establish your safety.':'You can talk in your own words. What is on your mind?';}
    s.chatAction=null;s.draftText='';s.companion=true;
    s.chatChoices=[];
    if(action==='listen'){s.engineMemory.wantsAdvice=false;if(!s.engineMemory.unresolvedUrgent)s.aiMessage='Okay, no exercises. Tell me what’s on your mind, in your own way.';}
    if(action==='restart'){s.engineMemory={...s.engineMemory,event:null,summary:''};}
  }else if(action==='exerciseDone'){
    s.lastInterventionId=s.chatAction.interventionId;s.chatAction=null;s.aiMessage='How was that: a little easier, the same, or worse?';s.awaitingFeedback=true;
  }else{
    const currentId=s.chatAction?.interventionId||s.lastInterventionId;
    const label=currentId?INTERVENTIONS[currentId]?.title:'that approach';
    if(action)message=action==='another'?'That is not helping. I want a different approach.':action==='exerciseStop'?'Stop the exercise.':action==='exerciseSkip'?'I cannot do that exercise.':`${action==='BETTER'?'A little better':action==='SAME'?'Same, still bad':action==='WORSE'?'Worse':'Not sure'} after ${label}.`;
    let allowAI=false;
    if(s.aiConsent&&env.GROQ_API_KEY)allowAI=await store.limit();
    const result=await runConversationEngine(env,s,message,{allowAI,localContext:body.localContext});
    s.mode=result.mode;s.chatChoices=result.choices;s.hasGreetedThisSession=result.hasGreetedThisSession;
    s.companion=true;s.state='CHAT';s.status='active';s.aiMessage=result.message;s.engineMemory=result.memory;s.chatAction=result.action;s.awaitingFeedback=false;s.draftText='';
    s.lastInterventionId=result.action?.interventionId||null;
    s.chatSafety=result.safety.needsEmergencyPath?'urgent':result.safety.needsSafetyQuestion?'clarify':'none';
    s.turnDecisions=[...(s.turnDecisions||[]),result.telemetry].slice(-30);
    const at=new Date().toISOString();s.transcript.push({role:'user',text:result.storedUserText,at},{role:'assistant',text:result.redacted?'We discussed support without retaining the exact thought content.':s.aiMessage,at});s.transcript=s.transcript.slice(-60);
    // Do not persist model quotations of intimate thought content, raw voice, or drafts.
    const saved=await store.put({...s,aiMessage:result.redacted?s.transcript.at(-1).text:s.aiMessage},'conversation',body.revision);
    return {session:{...saved,aiMessage:s.aiMessage},notice:result.notice||(!allowAI&&s.aiConsent?'AI is unavailable or its limit is reached. You can keep using basic support.':'')};
  }
  s.transcript.push({role:'user',text:({exerciseDone:'Finished the exercise',pause:'Pause',end:'End for now',restart:'Start again',resume:'Continue chatting',chat:'Chat freely'})[action]||action,at:new Date().toISOString()},{role:'assistant',text:s.aiMessage,at:new Date().toISOString()});s.transcript=s.transcript.slice(-60);
  return {session:await store.put(s,'conversation',body.revision),notice:''};
}
