import test from 'node:test';
import assert from 'node:assert/strict';
import {newConversation,conversationView,advanceConversation} from '../src/conversation-model.js';
import {validateLocalContext,greeting} from '../src/chat-context.js';
import {runConversationEngine} from '../server/conversation-engine.js';
import {conversationApi} from '../server/conversation-api.js';
import {emptySafety} from '../server/engine-safety.js';
import {fallbackPlan} from '../server/engine-router.js';
import {newMemory} from '../server/engine-memory.js';
import {retrieveKnowledge} from '../server/knowledge.js';
import {aiConfig} from '../server/ai-config.js';
import {engineTurn} from '../server/engine-api.js';
const localContext={localTime:'09:14',localDate:'2026-10-04',dayPeriod:'morning',timezone:'America/Chicago'};
test('device context rejects invalid times and computes period instead of trusting claimed period',()=>{
  assert.equal(validateLocalContext({...localContext,localTime:'25:00'}),null);
  assert.equal(validateLocalContext({...localContext,timezone:'Not/AZone'}),null);
  for(const [time,period] of [['09:14','morning'],['15:00','afternoon'],['20:00','evening'],['01:00','night']])assert.equal(validateLocalContext({...localContext,localTime:time}).dayPeriod,period);
  assert.match(greeting(null),/Hey/);
});
test('first greeting uses provided time; subsequent greeting never repeats it',async()=>{
  const s=newConversation(false,true);const first=await runConversationEngine({},s,'hi',{localContext});assert.match(first.message,/Good morning/);assert.equal(first.hasGreetedThisSession,true);
  const next=await runConversationEngine({},{...s,hasGreetedThisSession:true},'yo',{localContext});assert.doesNotMatch(next.message,/Good morning/);
});
test('ordinary questions use model answer without a therapy pivot or fake offline facts',async()=>{
  const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async()=>({...fallbackPlan('hello',newMemory()),shouldAskQuestion:false}),generateResponse:async()=>({message:'Kathmandu.'})};
  const r=await runConversationEngine({},newConversation(true,true),'capital of Nepal?',{provider});assert.equal(r.message,'Kathmandu.');assert.equal(r.mode,'NORMAL');assert.deepEqual(r.choices,[]);
  const unavailable=await runConversationEngine({},newConversation(false,true),'capital of Japan?');assert.match(unavailable.message,/AI replies are off/);
});
test('acute flow offers choice; no-question request overrides offers',async()=>{
  const r=await runConversationEngine({},newConversation(false,true),'I can’t think right now');assert.equal(r.mode,'ACUTE_ANXIETY');assert.ok(r.choices.some(c=>c.id==='reflect'));
  const no=await runConversationEngine({},newConversation(false,true),'I don’t want to answer questions');assert.deepEqual(no.choices,[]);
});
test('urgent risk overrides greeting and normal conversation',async()=>{
  const memory={...newMemory(),unresolvedUrgent:{...emptySafety(),riskLevel:'urgent',category:'self_harm',needsEmergencyPath:true}};
  const r=await runConversationEngine({},{...newConversation(false,true),engineMemory:memory},'hi',{localContext});assert.equal(r.mode,'SAFETY_ESCALATION');assert.doesNotMatch(r.message,/Good morning/);
});
test('explicit chat-to-CBT handoff preserves transcript, confirmation and refusals',async()=>{
  let s={...newConversation(false,true),engineMemory:{...newMemory(),breathingRejected:true}};
  const store={get:async()=>s,put:async next=>(s={...next,revision:s.revision+1}),list:async()=>[],limit:async()=>false};
  const req=action=>new Request(`https://example.test/api/conversations/${s.id}/turn`,{method:'POST',body:JSON.stringify({action,revision:s.revision})});
  await conversationApi(req('reflect'),`/api/conversations/${s.id}/turn`,store,{});
  assert.equal(s.companion,false);assert.equal(s.field,'worry');assert.ok(s.declined.includes('breathing'));
  s=advanceConversation(s,{value:'Tomorrow I give a presentation'});s=advanceConversation(s,{value:'I might freeze during my presentation'});assert.equal(s.state,'CONFIRM');assert.equal(s.answers.prediction,undefined);
  await conversationApi(req('chat'),`/api/conversations/${s.id}/turn`,store,{});assert.equal(s.companion,true);
  await conversationApi(req('reflect'),`/api/conversations/${s.id}/turn`,store,{});assert.equal(s.state,'CONFIRM');
});
test('safety pending cannot be bypassed by selecting CBT',async()=>{
  for(const concern of [{chatSafety:'clarify'},{safetyState:'needs-human-support'}]){
  const s={...newConversation(false,true),...concern};const store={get:async()=>s};const req=new Request('https://example.test',{method:'POST',body:JSON.stringify({action:'reflect',revision:0})});
  await assert.rejects(()=>conversationApi(req,`/api/conversations/${s.id}/turn`,store,{}),/human support/);
  }
});
test('knowledge retrieval excludes unreviewed and unrelated material and bounds context',()=>{
  const d={id:'synthetic-test-only',title:'Synthetic fixture',category:'worry',source:'https://example.test/fixture',reviewedBy:'Synthetic test reviewer',reviewedAt:'2026-10-04',content:'Synthetic fixture only.',tags:['uncertainty']};
  assert.deepEqual(retrieveKnowledge('worry'),[]);
  assert.equal(retrieveKnowledge('worry',{documents:[d,{...d,reviewedBy:''}]}).length,1);
  assert.deepEqual(retrieveKnowledge('photosynthesis',{documents:[d]}),[]);
});
test('GROQ_MODEL selects replies while preserving dedicated safety model',()=>{
  const c=aiConfig({GROQ_MODEL:'synthetic-model'});assert.equal(c.conversationModel,'synthetic-model');assert.equal(c.legacyModel,'synthetic-model');assert.notEqual(c.safetyModel,'synthetic-model');
});
test('typed stop pauses and typed restart resumes without clearing unresolved safety',async()=>{
  let s={...newConversation(false,true),engineMemory:{...newMemory(),unresolvedUrgent:{...emptySafety(),needsEmergencyPath:true,riskLevel:'urgent'}}};
  const store={put:async next=>(s={...next,revision:s.revision+1})};
  await engineTurn(s,{value:'stop',revision:s.revision},{},store);assert.equal(s.state,'CHAT_PAUSED');
  await engineTurn(s,{value:'start over',revision:s.revision},{},store);assert.equal(s.state,'CHAT');assert.match(s.aiMessage,/human support/);assert.ok(s.engineMemory.unresolvedUrgent);
  await engineTurn(s,{action:'listen',revision:s.revision},{},store);assert.match(s.aiMessage,/human support/);
});
test('physical caution and rejected grounding survive the handoff',async()=>{
  let s={...newConversation(false,true),engineMemory:{...newMemory(),physicalCaution:true,interventionsRejected:['grounding_orientation']}};
  const store={get:async()=>s,put:async next=>(s={...next,revision:1})};
  const req=new Request('https://example.test',{method:'POST',body:JSON.stringify({action:'settle',revision:0})});
  await conversationApi(req,`/api/conversations/${s.id}/turn`,store,{});
  for(const id of ['release','grounding','orientation'])assert.ok(s.declined.includes(id));
});
test('returning from a safety-escalated worksheet preserves urgency in existing chat memory',async()=>{
  const s={...newConversation(false,true),safetyState:'needs-human-support',engineMemory:newMemory()};
  const store={put:async next=>next};
  const result=await engineTurn(s,{action:'chat',revision:s.revision},{},store);
  assert.ok(result.session.engineMemory.unresolvedUrgent);
  assert.match(result.session.aiMessage,/human support/);
});
