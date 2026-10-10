import test from 'node:test';
import assert from 'node:assert/strict';
import {newConversation,advanceConversation as advance,conversationView,modelContext} from '../src/conversation-model.js';
import {compactContext,newMemory} from '../server/engine-memory.js';
const start=()=>({...newConversation(),state:'WORK',field:'whatNext',path:['coping','copingConfidence'],answers:{prediction:'I might lose my place in a presentation',initialSeverity:60}});
test('short consequences answers are clarified before being stored or advancing',()=>{
  for(const value of ['nothing','Nothing!','no','none','idk','I don’t know','not sure']){
    const s=advance(start(),{value});assert.equal(s.state,'NEXT_MEANING');assert.equal(s.answers.whatNext,undefined);assert.match(conversationView(s).message,/do you mean/);assert.equal(s.followupAnswer,value);
  }
});
test('confirmed no further consequence stops the chain without fabricated coping or ratings',()=>{
  let s=advance(start(),{value:'nothing'});s=advance(s,{action:'nothingFurther'});
  assert.equal(s.state,'RERATE');assert.equal(s.answers.whatNext,'nothing');assert.equal(s.answers.coping,undefined);assert.equal(s.answers.copingConfidence,undefined);assert.equal(s.answers.initialSeverity,60);assert.match(s.notice,/leave that chain/);
});
test('uncertainty and skipping do not become an invented consequence',()=>{
  for(const action of ['notSureNext','leaveNext']){let s=advance(start(),{value:'nothing'});s=advance(s,{action});assert.equal(s.state,'RERATE');assert.equal(s.answers.coping,undefined);assert.match(s.notice,/uncertain/);}
});
test('clarification can be corrected in free text and coping refers to original worry',()=>{
  let s=advance(start(),{value:'nothing'});s=advance(s,{value:'Actually I might need to use my notes'});assert.equal(s.answers.whatNext,'Actually I might need to use my notes');assert.equal(s.field,'coping');assert.match(conversationView(s).message,/original worry/);
});
test('rephrase, pause, resume, back and urgent safety preserve their meanings',()=>{
  const pending=advance(start(),{value:'nothing'});const rephrase=advance(pending,{action:'rephraseNext'});assert.equal(rephrase.field,'whatNext');assert.equal(rephrase.draftText,'nothing');
  assert.equal(advance(advance(pending,{action:'pause'}),{action:'resume'}).state,'NEXT_MEANING');
  assert.equal(advance(pending,{action:'back'}).field,'whatNext');
  assert.equal(advance(pending,{value:'I cannot stay safe'}).state,'SAFETY');
});
test('nothing remains a valid field-specific answer outside the consequences question',()=>{
  const s=advance({...start(),field:'evidenceAgainst',path:[]},{value:'nothing'});assert.equal(s.answers.evidenceAgainst,'nothing');assert.notEqual(s.state,'NEXT_MEANING');
});
test('AI context names the previous assistant question and preserves follow-up meaning',()=>{
  const s=start();s.transcript=[{role:'assistant',text:'What do you think would happen next?'}];
  assert.equal(compactContext(s,'nothing',newMemory()).replyTo,s.transcript[0].text);
  const c=modelContext(s,'nothing');assert.equal(c.followupContext.questionAsked,s.transcript[0].text);assert.equal(c.lastPatientMessage,'nothing');
});

import {runConversationEngine} from '../server/conversation-engine.js';
import {emptySafety} from '../server/engine-safety.js';
import {fallbackPlan} from '../server/engine-router.js';
test('free chat repairs a short consequences reply even when model repeats its question',async()=>{
  const s=newConversation(true,true);s.transcript=[{role:'assistant',text:'What do you think would happen next?'}];
  const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async()=>fallbackPlan('nothing',newMemory()),generateResponse:async()=>({message:'What if that happened?'})};
  const r=await runConversationEngine({},s,'nothing',{provider});assert.match(r.message,/Do you mean nothing else/);assert.equal(r.action,null);
  s.engineMemory={...newMemory(),questionsAllowed:false};assert.doesNotMatch((await runConversationEngine({},s,'nothing',{provider})).message,/\?/);
  assert.equal((await runConversationEngine({},s,'I cannot stay safe',{provider})).mode,'SAFETY_ESCALATION');
});
