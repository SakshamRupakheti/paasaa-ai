import {newConversation,advanceConversation,conversationView,worryFromConversation,fields} from '../src/conversation-model.js';
import {interpretConversation} from './conversation-ai.js';
import {safetySignal} from './safety.js';
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const response=(session,notice='')=>({session,view:conversationView(session),notice});
const globalActions=['pause','another','restart','reflect','end','back'];
export async function conversationApi(request,path,store,env){
  if(path==='/api/conversations'){
    if(request.method==='GET'){const records=await store.list('conversation');return {records:records.map(r=>({id:r.id,state:r.state,title:r.answers.worry||r.openingMessage||'A moment for yourself',status:r.status,updatedAt:r.updatedAt,outcomeDueAt:r.outcomeDueAt,outcome:r.outcome}))};}
    if(request.method!=='POST')fail('Method not allowed',405);
    const body=await readBody(request);return response(await store.put(newConversation(body.aiConsent===true),'conversation',0));
  }
  const match=path.match(/^\/api\/conversations\/([\w-]+)(?:\/(draft|turn|consent|edit))?$/);if(!match)fail('Not found',404);
  let session=await store.get(match[1]);if(!session||session.kind!=='conversation')fail('Conversation not found',404);
  if(request.method==='GET'&&!match[2])return response(session);
  if(request.method!=='POST')fail('Method not allowed',405);
  const body=await readBody(request);if(body.revision!==session.revision)fail('This conversation changed in another tab. Reload it before continuing; your unsent text is still here.',409);
  let notice='';const op=match[2];
  if(op==='draft'){if(typeof body.text!=='string'||body.text.length>6000)fail('Invalid draft');session.draftText=body.text;}
  else if(op==='consent'){session.aiConsent=body.enabled===true;}
  else if(op==='edit'){
    if(!['SUMMARY','COMPLETE'].includes(session.state)||session.safetyState!=='none')fail('Review this reflection before editing.');
    if(!fields[body.field]||!Object.hasOwn(session.answers,body.field))fail('Unknown answer');
    const q=fields[body.field];if(q.type==='slider'){if(body.value!==null&&(!Number.isInteger(body.value)||body.value<0||body.value>100))fail('Use 0–100 or leave unanswered');}
    else if(typeof body.value!=='string'||body.value.length>6000||q.choices&&!q.choices.some(c=>c.id===body.value))fail('Invalid answer');
    if(safetySignal(typeof body.value==='string'?body.value:'')){session.state='SAFETY';session.safetyState='needs-human-support';}else{session.answers[body.field]=body.value;session.state='SUMMARY';session.status='active';}
  }
  else if(op==='turn'){
    if(body.action&&!globalActions.includes(body.action)&&!conversationView(session).choices.some(c=>c.id===body.action)&&!(body.action==='skip'&&conversationView(session).canSkip))fail('This action is not available at this step');
    if(body.voice){const v=body.voice;if(typeof v.rawTranscript!=='string'||v.rawTranscript.length>6000||v.cleanedTranscript!==null||v.patientApprovedText!==body.value)fail('Approve the transcript before sending');}
    const records=await store.list('worry');const before=session;let planned;
    try{planned=advanceConversation(session,body,{records});}catch(e){fail(e.message);}
    const message=typeof body.value==='string'?body.value:'';let model;
    if(session.aiConsent&&message&&env.GROQ_API_KEY&&planned.state!=='SAFETY'&&!body.action){
      if(await store.limit()){try{model=await interpretConversation(env,session,message,planned);planned=advanceConversation(session,body,{records,model});}catch{notice='AI wording is unavailable for this turn. Your words are saved; the guided conversation still works.';}}
      else notice='The AI limit is reached. Your words are saved; the guided conversation still works.';
    }
    session=planned;
    if(body.voice)session.voice.push({...body.voice,field:before.field||before.state,approvedAt:new Date().toISOString()});
    if(model&&model.conversationAction!=='ESCALATE'&&model.suggestedState===(session.state==='WORK'?session.field:session.state)&&!['CONFIRM','DETAILS','SUMMARY','COMPLETE','PREVIOUS','SAFETY'].includes(session.state))session.aiMessage=model.assistantMessage;
    const controlLabels={pause:'Pause',another:'Try another way',restart:'Start again',reflect:'Talk about the worry',end:'End for now',back:'Go back',skip:'Leave this unanswered'};
    const label=body.action?conversationView(before).choices.find(c=>c.id===body.action)?.label||controlLabels[body.action]||body.action:body.value;
    if(label!==undefined&&label!==null)session.transcript.push({role:'user',text:String(label),at:new Date().toISOString()});
    session.transcript.push({role:'assistant',text:session.aiMessage||conversationView(session).message,at:new Date().toISOString()});session.transcript=session.transcript.slice(-60);
    if(session.state==='COMPLETE')session.worryId ||= session.id+'-reflection';
  }else fail('Not found',404);
  const saved=await store.put(session,'conversation',body.revision);
  // Claim this revision before mirroring the approved reflection, so a losing
  // concurrent turn cannot overwrite the canonical conversation's saved answer.
  if(op==='turn'&&saved.state==='COMPLETE'){
    try{const existing=await store.get(saved.worryId);await store.put(worryFromConversation(saved,existing),'worry',existing?.revision||0);}
    catch{notice='Your conversation is saved. The separate worry-record view could not update; your full reflection is available here.';}
  }
  return response(saved,notice);
}
async function readBody(request){const data=await request.text();if(data.length>32000)fail('This message is too long',413);try{return JSON.parse(data);}catch{fail('Invalid request');}}
