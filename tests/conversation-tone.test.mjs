import test from 'node:test';
import assert from 'node:assert/strict';
import {runConversationEngine,validateResponse} from '../server/conversation-engine.js';
import {newConversation} from '../src/conversation-model.js';
import {newMemory} from '../server/engine-memory.js';
import {fallbackPlan} from '../server/engine-router.js';
import {emptySafety,localSafety} from '../server/engine-safety.js';

test('consent off explains scripted mode without invoking external AI or a fake outage',async()=>{
  const provider={classifySafety(){assert.fail('Consent must gate all provider calls');}};
  const r=await runConversationEngine({},newConversation(false,true),'How do I choose a career?',{provider});
  assert.match(r.message,/AI replies are off/);assert.doesNotMatch(r.message,/trouble responding|couldn.t generate/i);assert.match(r.notice,/no conversation text was sent/);assert.equal(r.action,null);
});
test('direct profanity receives repair, without insults or forced CBT',async()=>{
  for(const message of ['fuck you','bot fuck you','you are useless']){
    const r=await runConversationEngine({},newConversation(false,true),message);
    assert.match(r.message,/didn.t land/);assert.equal(r.action,null);assert.equal(r.mode,'NORMAL');assert.doesNotMatch(r.message,/freak|calm down|worksheet|bro/i);
  }
});
test('repair respects no questions and does not override unresolved urgent risk',async()=>{
  const s=newConversation(false,true);s.engineMemory={...newMemory(),questionsAllowed:false};
  assert.doesNotMatch((await runConversationEngine({},s,'fuck you')).message,/\?/);
  s.engineMemory.unresolvedUrgent=localSafety('I will kill myself tonight');
  const r=await runConversationEngine({},s,'fuck you');assert.equal(r.mode,'SAFETY_ESCALATION');assert.doesNotMatch(r.message,/didn.t land/);
});
test('quoted abuse and profanity with urgent intent are not treated as banter',async()=>{
  const quoted=await runConversationEngine({},newConversation(false,true),'My friend said fuck you to me');assert.doesNotMatch(quoted.message,/Was my reply off/);
  const urgent=await runConversationEngine({},newConversation(false,true),'fuck you, I will kill myself tonight');assert.equal(urgent.mode,'SAFETY_ESCALATION');
});
test('listen-only reply survives NORMAL mode and preserves refusal',async()=>{
  const r=await runConversationEngine({},newConversation(false,true),'just listen, no advice, no questions');
  assert.equal(r.action,null);assert.doesNotMatch(r.message,/trouble responding|AI replies are off|\?/);assert.equal(r.memory.questionsAllowed,false);
});
test('ordinary AI conversation remains normal and receives revised tone instructions',async()=>{
  let prompt;const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async()=>fallbackPlan('music',newMemory()),generateResponse:async p=>{prompt=p;return {message:'Sure, we can talk about music. What have you been listening to?'};}};
  const r=await runConversationEngine({},newConversation(true,true),'Can we talk about music?',{provider});assert.equal(r.telemetry.responseSource,'model');assert.equal(r.mode,'NORMAL');assert.equal(r.action,null);assert.match(prompt,/CBT handoff/);assert.match(prompt,/question is optional/);
});
test('provider outage remains distinct from consent off and judgmental replies are rejected',async()=>{
  const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async()=>fallbackPlan('music',newMemory()),generateResponse:async()=>{throw Error('offline');}};
  const r=await runConversationEngine({},newConversation(true,true),'music',{provider});assert.match(r.message,/couldn.t generate/);assert.doesNotMatch(r.message,/AI replies are off/);
  const plan=fallbackPlan('hello',newMemory());assert.throws(()=>validateResponse({message:"Don't be a freak bro."},plan));
});
