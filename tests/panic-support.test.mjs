import test from 'node:test';
import assert from 'node:assert/strict';
import {isCurrentPanic} from '../server/panic-support.js';
import {runConversationEngine} from '../server/conversation-engine.js';
import {newConversation} from '../src/conversation-model.js';
import {emptySafety} from '../server/engine-safety.js';
import {newMemory} from '../server/engine-memory.js';
import {fallbackPlan} from '../server/engine-router.js';
const fail=code=>async()=>{throw Object.assign(Error('synthetic failure'),{code});};
const outage=code=>({metrics:[],classifySafety:fail(code),planTurn:async()=>assert.fail('No planner after failed safety'),generateResponse:async()=>assert.fail('No generator after failed safety')});

test('current panic detection excludes history, negation, quotations and third-person messages',()=>{
  for(const s of ['i am having a panic attack',"I'm panicking",'help, I think I am having a panic attack','i am having panic attack'])assert.equal(isCurrentPanic(s),true,s);
  for(const s of ['What is a panic attack?','I am not having a panic attack','I had a panic attack yesterday','My friend is having a panic attack','She said "I am having a panic attack"','"I am having a panic attack"','I am having a panic attack in this example'])assert.equal(isCurrentPanic(s),false,s);
});
for(const code of ['timeout','rate_limit','upstream','request_rejected','invalid_output'])test('panic gets useful scripted support during '+code,async()=>{
  const r=await runConversationEngine({},newConversation(true,true),'i am having a panic attack',{provider:outage(code)});
  assert.equal(r.telemetry.responseSource,'panic-support');assert.equal(r.supportAvailable,true);
  assert.match(r.message,/safe person nearby/);assert.match(r.message,/urgent medical help/);
  assert.doesNotMatch(r.message,/try again|definitely safe|just anxiety|inhale|exhale/);
  assert.equal(r.action,null);assert.equal(r.telemetry.operationalSafety,'UNCERTAIN');
  assert.equal(r.telemetry.safetyAssessment.failureCode,code);assert.match(r.notice,/scripted/);
});
test('AI-off panic support does not call a provider or falsely promise an AI reply',async()=>{
  const r=await runConversationEngine({},newConversation(false,true),'I am panicking',{provider:outage('timeout')});
  assert.equal(r.telemetry.responseSource,'panic-support');assert.match(r.notice,/AI replies are off/);assert.equal(r.action,null);
});
test('panic fallback preserves no-exercise and no-advice preference',async()=>{
  const s=newConversation(true,true);s.engineMemory={...newMemory(),wantsAdvice:false,breathingRejected:true};
  const r=await runConversationEngine({},s,'I am having a panic attack. Just listen, no exercises',{provider:outage('timeout')});
  assert.match(r.message,/leave exercises out/);assert.equal(r.action,null);
});
test('panic never overwrites medical danger or self-harm clarification',async()=>{
  for(const message of ['I am having a panic attack. I have severe new chest pain','I am panicking and cannot stay safe','I am having a panic attack and thoughts of self harm']){
    const r=await runConversationEngine({},newConversation(true,true),message,{provider:outage('timeout')});
    assert.notEqual(r.telemetry.responseSource,'panic-support');assert.equal(r.supportAvailable,false);
    assert.ok(r.safety.needsEmergencyPath||r.safety.needsSafetyQuestion);
  }
});
test('unresolved context is never downgraded to panic support',async()=>{
  const s=newConversation(true,true);s.engineMemory={...newMemory(),safetyPending:true};
  const r=await runConversationEngine({},s,'I am having a panic attack',{provider:outage('timeout')});
  assert.equal(r.supportAvailable,false);assert.equal(r.telemetry.responseSource,'safety-fallback');
});
test('planner or wording failures also retain useful panic support',async()=>{
  for(const plannerFails of [true,false]){
    const provider={classifySafety:async()=>emptySafety(),planTurn:plannerFails?fail('upstream'):async()=>fallbackPlan('I am panicking',newMemory()),generateResponse:fail('invalid_output')};
    const r=await runConversationEngine({},newConversation(true,true),'I am panicking',{provider});
    assert.equal(r.telemetry.responseSource,'panic-support');
  }
});
test('unapproved generated grounding instructions fall back to bounded panic support',async()=>{
  const provider={classifySafety:async()=>emptySafety(),planTurn:async()=>fallbackPlan('I am panicking',newMemory()),generateResponse:async()=>({message:'Try gently noticing five things you can see while breathing slowly.'})};
  const r=await runConversationEngine({},newConversation(true,true),'I am panicking',{provider});
  assert.equal(r.telemetry.responseSource,'panic-support');assert.doesNotMatch(r.message,/noticing five|breathing slowly/);
});
