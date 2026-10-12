import test from 'node:test';
import assert from 'node:assert/strict';
import {exerciseRequest} from '../server/conversation-intent.js';
import {runConversationEngine} from '../server/conversation-engine.js';
import {fallbackPlan} from '../server/engine-router.js';
import {newMemory} from '../server/engine-memory.js';
import {emptySafety} from '../server/engine-safety.js';
import {newConversation} from '../src/conversation-model.js';
const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async()=>({...fallbackPlan('hello',newMemory()),primaryState:'ACUTE_ANXIETY',interventionId:'paced_breathing',shouldInterveneNow:true}),generateResponse:async()=>({message:'Is something specific on your mind, or is it more of an uneasy feeling?'})};
test('anxiety alone cannot open a planner-selected breathing card',async()=>{
  const r=await runConversationEngine({},newConversation(true,true),'I’m feeling anxious.',{provider});
  assert.equal(r.action,null);assert.equal(r.telemetry.planner.responseMode,'CONNECT_AND_EXPLORE');
  assert.doesNotMatch(r.message,/available below/);
});
test('specific request and contextual acceptance allow a card, unrelated yes does not',async()=>{
  assert.equal(exerciseRequest('yes','Is it about school?'),null);
  assert.equal(exerciseRequest('No, I do not want breathing'),null);
  assert.equal(exerciseRequest('yes','Would you like to try comfortable breathing?'),'breathing');
  const s=newConversation(true,true);
  s.transcript=[{role:'assistant',text:'Would you like to try comfortable breathing?'}];
  assert.equal((await runConversationEngine({},s,'yes',{provider})).action.interventionId,'paced_breathing');
  assert.equal((await runConversationEngine({},newConversation(true,true),'Please guide me through breathing',{provider})).action.interventionId,'paced_breathing');
});
test('two questions lead to synthesis and tried advice leads to repair',async()=>{
  const s=newConversation(true,true);
  s.transcript=[{role:'assistant',text:'What happened?'},{role:'user',text:'My friend has not replied.'},{role:'assistant',text:'Have you sent a message?'}];
  const p={...provider,planTurn:async()=>fallbackPlan('hello',newMemory()),generateResponse:async(_prompt,context)=>{
    assert.equal(context.plan.shouldAskQuestion,false);
    assert.equal(context.memory.approachRejected,true);
    return {message:'You already reached out, so another message may not add clarity. For now, return to one thing you planned to do today while leaving room for a reply.'};
  }};
  const r=await runConversationEngine({},s,'I already sent a message, that did not help',{provider:p});
  assert.equal(r.action,null);assert.doesNotMatch(r.message,/\?/);assert.equal(r.telemetry.responseSource,'model');
});
