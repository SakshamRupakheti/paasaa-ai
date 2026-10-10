import test from 'node:test';
import assert from 'node:assert/strict';
import {runConversationEngine} from '../server/conversation-engine.js';
import {newConversation} from '../src/conversation-model.js';
import {newMemory} from '../server/engine-memory.js';
import {emptySafety,localSafety} from '../server/engine-safety.js';
import {fallbackPlan} from '../server/engine-router.js';

function unavailable(code='timeout'){
  return {metrics:[],classifySafety:async()=>{throw Object.assign(Error('synthetic outage'),{code});},
    planTurn:async()=>assert.fail('No planning after failed assessment'),
    generateResponse:async()=>assert.fail('No generation after failed assessment')};
}
for(const text of ['hello','Hey!','What is the capital of Nepal?','I am nervous about my exam','I cannot think right now','मलाई परीक्षाको चिन्ता छ','Estoy nervioso por mi examen']){
  test('ordinary message avoids crisis warning during outage: '+text,async()=>{
    const r=await runConversationEngine({},newConversation(true,true),text,{provider:unavailable()});
    assert.doesNotMatch(r.message,/unsafe|severe|human support|assess this message/);
    assert.equal(r.action,null);assert.equal(r.telemetry.operationalSafety,'UNCERTAIN');
    assert.equal(r.telemetry.safetyAssessment.failureCode,'timeout');
    if(/hello|Hey/.test(text))assert.equal(r.telemetry.responseSource,'registry');
    else assert.equal(r.telemetry.responseSource,'unavailable');
  });
}
for(const code of ['rate_limit','upstream','request_rejected','invalid_output'])test('technical error is not a safety trigger: '+code,async()=>{
  const r=await runConversationEngine({},newConversation(true,true),'How are you?',{provider:unavailable(code)});
  assert.match(r.message,/trouble responding/);assert.equal(r.telemetry.safetyAssessment.failureCode,code);
});
test('clear danger bypasses the provider and keeps urgent guidance',async()=>{
  for(const text of ['I will kill myself tonight','I cannot stay safe','I have severe new chest pain']){
    const r=await runConversationEngine({},newConversation(true,true),text,{provider:unavailable()});
    assert.match(r.message,/now/);assert.equal(r.safety.needsEmergencyPath,true);assert.equal(r.action,null);
  }
});
test('local safety clarification is not overwritten by the outage notice',async()=>{
  const r=await runConversationEngine({},newConversation(true,true),'I have thoughts of self harm',{provider:unavailable()});
  assert.equal(r.safety.needsSafetyQuestion,true);assert.match(r.message,/might act/);
  assert.doesNotMatch(r.message,/trouble responding/);assert.equal(r.memory.safetyPending,true);
});
test('context and unresolved concerns survive an ordinary follow-up during outage',async()=>{
  for(const setup of [
    s=>{s.engineMemory={...newMemory(),safetyPending:true};},
    s=>{s.transcript=[{role:'user',text:'I wish I were dead'}];},
    s=>{s.safetyState='needs-human-support';},
    s=>{s.engineMemory={...newMemory(),unresolvedUrgent:localSafety('I cannot stay safe')};}
  ]){
    const s=newConversation(true,true);setup(s);
    const r=await runConversationEngine({},s,'hello',{provider:unavailable()});
    assert.match(r.message,/human support|stay safe/);assert.notEqual(r.telemetry.responseSource,'registry');
    if(s.engineMemory?.safetyPending)assert.equal(r.memory.safetyPending,true);
  }
});
test('assistant help wording does not itself trigger a crisis warning',async()=>{
  const s=newConversation(true,true);s.transcript=[{role:'assistant',text:'If you cannot stay safe, use human support.'}];
  const r=await runConversationEngine({},s,'hello',{provider:unavailable()});
  assert.equal(r.telemetry.responseSource,'registry');
});
test('successful contextual assessment still routes indirect concern',async()=>{
  const provider={classifySafety:async()=>({...emptySafety(),riskLevel:'clarify',category:'unclear',needsSafetyQuestion:true}),planTurn:async()=>assert.fail('No planner for safety clarification')};
  const r=await runConversationEngine({},newConversation(true,true),'Everyone would be better without me',{provider});
  assert.equal(r.mode,'SAFETY_ESCALATION');assert.equal(r.action,null);
});
test('healthy provider still answers an ordinary question normally',async()=>{
  const provider={classifySafety:async()=>emptySafety(),planTurn:async()=>fallbackPlan('What is the capital of Nepal?',newMemory()),generateResponse:async()=>({message:'Kathmandu.'})};
  const r=await runConversationEngine({},newConversation(true,true),'What is the capital of Nepal?',{provider});
  assert.equal(r.message,'Kathmandu.');assert.equal(r.telemetry.responseSource,'model');
});
