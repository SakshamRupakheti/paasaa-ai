import {newWorry,currentStep,answer,steps,clinicianSummary} from '../src/worry-model.js';
import {safetySignal,SAFE_PAUSE} from './safety.js';
import {RecordStore} from './store.js';
import {question,transcribe} from './ai.js';
import {chatReply,validateChat} from './chat.js';
import {conversationApi} from './conversation-api.js';
import {prototypeData} from './admin-prototype.js';
import {aiEnabled,publicServiceStatus,isClinicalPath} from './service-policy.js';
import {moodApi} from './mood-api.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
// Only server adapters may supply this context. The Sites worker continues to use
// its authenticated gateway header; public adapters must verify their own identity.
export async function handleApi(request,env,trustedContext){
  try{
    const url=new URL(request.url),path=url.pathname;
    if(path==='/api/service-status')return request.method==='GET'?json(publicServiceStatus(env)):json({error:'Method not allowed'},405);
    const owner=trustedContext?trustedContext.owner:request.headers.get('oai-authenticated-user-id');if(!owner)return json({error:'Sign in to use saved records.'},401);
    if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==url.origin)return json({error:'This request must come from Paasaa.'},403);
    if(isClinicalPath(path))return json({error:'Clinical services are not enabled.',code:'CLINICAL_SERVICE_NOT_IMPLEMENTED'},503);
    if(!aiEnabled(env))env={...env,GROQ_API_KEY:''};
    if(path==='/api/admin/prototype'&&request.method==='GET'&&env.LOCAL_SYNTHETIC_PREVIEW===true&&owner==='local-synthetic-preview')return json(prototypeData());
    if(path==='/api/status')return json({ai:!!env.GROQ_API_KEY,persistence:!!(trustedContext?.store||env.DB),preview:true,clinicalReview:'pending'});
    if(!trustedContext?.store&&!env.DB)return json({error:'Saved records are unavailable. Your input remains on screen.'},503);
    const store=trustedContext?.store||new RecordStore(env.DB,owner);
    if(path==='/api/moods')return json(await moodApi(request,store));
    if(path==='/api/conversations'||path.startsWith('/api/conversations/'))return json(await conversationApi(request,path,store,env));
    if(path==='/api/chat'&&request.method==='POST'){
      const raw=await request.text();if(raw.length>48000)fail('Message is too long',413);
      const body=JSON.parse(raw);validateChat(body);
      if(!(await store.limit()))fail('The hourly AI limit has been reached. Your message is kept; worksheets still work.',429);
      return json(await chatReply(env,body));
    }
    if(path==='/api/worries'&&request.method==='GET')return json({records:await store.list('worry')});
    if(path==='/api/worries'&&request.method==='POST'){const s=newWorry();return json(await store.put(s,'worry',0),201);}
    if(path==='/api/transcribe'&&request.method==='POST'){
      if(!(await store.limit()))return json({error:'The hourly voice/AI limit has been reached. You can keep typing.'},429);
      const length=Number(request.headers.get('Content-Length'));if(length>8*1024*1024)fail('Recording is too large',413);
      const data=await request.formData();if(data.get('consent')!=='true')fail('Approve sending this recording first');const audio=data.get('audio');if(!(audio instanceof Blob)||!audio.size||audio.size>8*1024*1024||!/^audio\/(webm|mp4|ogg|wav|mpeg)/.test(audio.type))fail('Unsupported audio recording');return json(await transcribe(env,audio));
    }
    const match=path.match(/^\/api\/worries\/([\w-]+)(?:\/(answer|draft|back|complete|outcome|question|summary|related|consent|outcome-draft))?$/);
    if(!match)return json({error:'Not found'},404);
    let s=await store.get(match[1]);if(!s||s.kind==='conversation'||s.kind==='mood')return json({error:'Record not found'},404);
    const op=match[2];if(request.method==='GET'){if(op==='summary'&&s.status!=='complete')fail('Review and save this reflection first');return json(op==='summary'?clinicianSummary(s):s);}
    if(request.method!=='POST')return json({error:'Method not allowed'},405);
    const raw=await request.text();if(raw.length>24000)fail('Request is too large',413);const body=JSON.parse(raw);
    if(op==='question'){
      if(!s.aiConsent)fail('AI wording is off');if(s.safetyPaused)fail('Worry exploration is paused');if(!(await store.limit()))fail('AI limit reached; the standard question remains available',429);
      const proposal=await question(env,s);if(proposal.safetyConcern){s.safetyPaused=true;await store.put(s,'worry',s.revision);return json({safety:true,message:SAFE_PAUSE});}return json(proposal);
    }
    if(body.revision!==s.revision)fail('This record changed in another tab. Reload before continuing.',409);
    if(op==='draft'){if(typeof body.text!=='string'||body.text.length>6000)fail('Invalid draft');s.draftText=body.text;}
    else if(op==='consent'){s.aiConsent=body.enabled===true;}
    else if(op==='related'){if(!Array.isArray(body.ids)||body.ids.length>100)fail('Invalid history');const available=await store.list('worry');s.relatedIds=[...new Set(body.ids)].filter(id=>id!==s.id&&available.some(r=>r.id===id&&r.status==='complete'));}
    else if(op==='back'){if(s.status==='complete')s.status='draft';s.completedAt=null;s.cursor=Number.isInteger(body.cursor)?Math.max(0,Math.min(body.cursor,steps(s).length-1)):Math.max(0,s.cursor-1);s.draftText='';}
    else if(op==='answer'){
      if(s.safetyPaused)fail('This exercise is paused. Open safety support.');if(s.status==='complete')fail('Edit this record first');
      if(typeof body.value==='string'&&safetySignal(body.value)){s.safetyPaused=true;s.draftText=body.value;const saved=await store.put(s,'worry',s.revision);return json({session:saved,safety:true,message:SAFE_PAUSE});}
      const field=currentStep(s).field;s=answer(s,body.value);
      if(body.voice){const v=body.voice;if(typeof v.rawTranscript!=='string'||v.rawTranscript.length>6000||v.patientApprovedText!==body.value||v.cleanedTranscript!==null)fail('Approve the transcript before continuing');s.voice.push({field,rawTranscript:v.rawTranscript,cleanedTranscript:null,patientApprovedText:body.value,approvedAt:new Date().toISOString()});}
    }
    else if(op==='complete'){if(currentStep(s).type!=='summary'||s.safetyPaused)fail('Review your answers first');s.status='complete';s.completedAt=new Date().toISOString();}
    else if(op==='outcome-draft'){if(s.status!=='complete')fail('Complete the reflection first');if(typeof body.draft!=='object'||!body.draft)fail('Invalid draft');const d=body.draft;if(!['Did not happen','Partly happened','Happened','Still unclear'].includes(d.result))fail('Invalid outcome');for(const f of ['actualSeverity','actualCoping'])if(d[f]!==null&&(!Number.isInteger(d[f])||d[f]<0||d[f]>100))fail('Invalid rating');if(typeof d.learning!=='string'||d.learning.length>6000)fail('Invalid reflection');s.outcomeDraft={result:d.result,actualSeverity:d.actualSeverity,actualCoping:d.actualCoping,learning:d.learning};}
    else if(op==='outcome'){if(s.status!=='complete'||s.answers.testable!=='Yes')fail('Only completed testable predictions can have outcomes');if(!['Did not happen','Partly happened','Happened','Still unclear'].includes(body.result))fail('Choose an outcome');for(const field of ['actualSeverity','actualCoping'])if(body[field]!==null&&(!Number.isInteger(body[field])||body[field]<0||body[field]>100))fail('Invalid rating');if(typeof body.learning!=='string'||body.learning.length>6000)fail('Invalid reflection');s.outcomeDraft=null;s.outcome={result:body.result,actualSeverity:['Happened','Partly happened'].includes(body.result)?body.actualSeverity:null,actualCoping:body.actualCoping,learning:body.learning,recordedAt:new Date().toISOString()};}
    else fail('Unknown operation',404);
    return json(await store.put(s,'worry',body.revision));
  }catch(error){return json({error:error.status?error.message:'This request could not be completed. Your current input remains available.'},error.status||500);}
}
