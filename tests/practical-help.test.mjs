import test from 'node:test';
import assert from 'node:assert/strict';
import {newMemory,updateMemory} from '../server/engine-memory.js';
import {fallbackPlan,routePlan} from '../server/engine-router.js';
import {emptySafety,localSafety} from '../server/engine-safety.js';
import {runConversationEngine} from '../server/conversation-engine.js';
import {newConversation} from '../src/conversation-model.js';

test('a direct help request overrides stale listening, without allowing more questions',()=>{
  const old=updateMemory(newMemory(),'just listen, no questions');
  const m=updateMemory(old,'just give me a solution');
  const p=routePlan({...fallbackPlan('hello',m),userNeed:'TALK_WITHOUT_ADVICE'},emptySafety(),m,'just give me a solution');
  assert.equal(p.conversationIntent,'provide_practical_clarity');
  assert.equal(p.shouldAskQuestion,false);
  assert.equal(m.questionsAllowed,false);
  assert.equal(updateMemory(m,'thanks').practicalHelpRequested,false);
  assert.equal(updateMemory(m,"I don't want advice, just listen").wantsAdvice,false);
});
test('practical help preserves urgent safety and rejected interventions',()=>{
  const m=updateMemory({...newMemory(),breathingRejected:true,interventionsRejected:['paced_breathing']},'what should I do');
  const p=routePlan(fallbackPlan('what should I do',m),emptySafety(),m,'what should I do');
  assert.equal(p.interventionId,null);
  assert.equal(m.breathingRejected,true);
  const emergency=localSafety('I am planning to stab him tonight');
  assert.equal(routePlan(p,emergency,m,'what should I do').responseMode,'CRISIS_ESCALATION');
});
test('a repetitive model invitation falls back to practical support',async()=>{
  const s=newConversation(true,true);
  s.engineMemory=updateMemory(newMemory(),'just listen');
  s.transcript=[{role:'user',text:'My friend has not replied.'},{role:'assistant',text:'What do you think happened?'}];
  const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async()=>({...fallbackPlan('hello',newMemory()),userNeed:'TALK_WITHOUT_ADVICE'}),generateResponse:async(_prompt,context)=>{
    assert.equal(context.replyTo,'What do you think happened?');
    assert.equal(context.plan.shouldAskQuestion,false);
    return {message:'You can share more when you’re ready.'};
  }};
  const r=await runConversationEngine({},s,'just give me a solution',{provider});
  assert.equal(r.telemetry.responseSource,'fallback');
  assert.match(r.message,/reversible action/);
  assert.doesNotMatch(r.message,/share more|\?/);
});
