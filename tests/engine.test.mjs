import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {localSafety,emptySafety,classifySafety} from '../server/engine-safety.js';
import {updateMemory,newMemory} from '../server/engine-memory.js';
import {routePlan,fallbackPlan} from '../server/engine-router.js';
import {runConversationEngine,validateResponse} from '../server/conversation-engine.js';
import {newConversation} from '../src/conversation-model.js';
import {engineTurn} from '../server/engine-api.js';
import {validate,planSchema} from '../server/engine-schemas.js';
const cases=JSON.parse(await readFile(new URL('../evals/cases.json',import.meta.url),'utf8'));
for(const c of cases)test('engine evaluation: '+c.id,()=>{
  let memory={...newMemory(),...c.memory};for(const turn of c.history||[])memory=updateMemory(memory,turn);
  memory=updateMemory(memory,c.message,c.activeId);const safety=localSafety(c.message,memory);const plan=routePlan(fallbackPlan(c.message,memory),safety,memory,c.message);
  if(c.risk)assert.equal(safety.riskLevel,c.risk);
  if(c.mode)assert.equal(plan.responseMode,c.mode);
  if(c.noIntervention)assert.equal(plan.interventionId,null);
  if(c.blocked)assert.notEqual(plan.interventionId,c.blocked);
  if(c.noQuestions)assert.equal(plan.shouldAskQuestion,false);
});
test('urgent result cannot be downgraded and topic changes cannot clear it',async()=>{const urgent=localSafety('I am planning to stab him tonight');assert.equal(urgent.riskLevel,'urgent');let calls=0;const result=await classifySafety({classifySafety(){calls++;return emptySafety();}},'tell me a joke',[],{unresolvedUrgent:urgent});assert.equal(result.safety.riskLevel,'urgent');assert.equal(calls,0);});
test('invalid classification fails closed for interventions, not an invented normal result',async()=>{const provider={classifySafety:async()=>({riskLevel:'none'}),metrics:[]};const result=await runConversationEngine({},newConversation(true,true),'my whole body is tight',{provider});assert.equal(result.action,null);assert.match(result.message,/cannot reliably assess/);});
test('malicious planner action is rejected, not executed',()=>{assert.throws(()=>validate(planSchema,{...fallbackPlan('hello',newMemory()),responseMode:'RUN_CODE'}));const p=routePlan({...fallbackPlan('hello',newMemory()),interventionId:'execute_code',shouldInterveneNow:true},emptySafety(),newMemory(),'hello');assert.equal(p.interventionId,null);});
test('listening and no-questions preferences override planner recommendation',()=>{const memory=updateMemory(newMemory(),'just talk to me, no exercises. Stop asking questions');const p=routePlan({...fallbackPlan('shoulders stuck',memory),shouldInterveneNow:true},emptySafety(),memory,'just talk');assert.equal(p.responseMode,'LISTEN_ONLY');assert.equal(p.interventionId,null);assert.equal(p.shouldAskQuestion,false);});
test('exact private thought content never enters saved engine turn',async()=>{let persisted;const store={limit:async()=>false,put:async s=>(persisted=structuredClone(s),{...s,revision:1})};const s=newConversation(false,true);await engineTurn(s,{revision:0,value:'I keep intrusive images of hurting my mother and do not want them'}, {},store);assert.ok(!JSON.stringify(persisted).includes('hurting my mother'));assert.equal(persisted.voice.length,0);});
test('raw private thought does not enter memory summary',()=>{const m=updateMemory(newMemory(),'I have an unwanted thought about stabbing my father');assert.equal(m.intrusiveThoughtPresent,true);assert.ok(!JSON.stringify(m).includes('father'));});
test('generated certainty, instructions, excess questions and dependency are rejected',()=>{const p={...fallbackPlan('hello',newMemory()),shouldAskQuestion:false};for(const message of ['You only need me.','You will never hurt anyone.','Take a deep breath.','What happened?','It is definitely just anxiety.'])assert.throws(()=>validateResponse({message},p));});
test('provider not called without consent',async()=>{let calls=0;const result=await runConversationEngine({},newConversation(false,true),'hello',{provider:{classifySafety(){calls++;}}});assert.equal(calls,0);assert.ok(result.message);});
test('failed exercise changes objective and is not repeated',async()=>{const s=newConversation(false,true);s.engineMemory={...newMemory(),event:'presentation',interventionsTried:['pmr_shoulders']};s.lastInterventionId='pmr_shoulders';const result=await runConversationEngine({},s,'still bad');assert.equal(result.action,null);assert.equal(result.telemetry.planner.responseMode,'PERFORMANCE_SUPPORT');assert.equal(result.memory.interventionHistory[0].outcome,'SAME');});
test('public environment never starts full-body PMR',()=>{const m={...newMemory(),environment:'public'};const p=routePlan({...fallbackPlan('body tight',m),interventionId:'pmr_full16',shouldInterveneNow:true},emptySafety(),m,'please full body PMR');assert.equal(p.interventionId,null);});

test('an unrelated topic is allowed after failed regulation',()=>{const m={...newMemory(),event:'presentation',interventionHistory:[{id:'pmr_shoulders',outcome:'SAME'}]};const p=routePlan(fallbackPlan('Tell me about music',m),emptySafety(),m,'Tell me about music');assert.equal(p.responseMode,'GENERAL_CONVERSATION');assert.equal(p.interventionId,null);});
test('unwanted-thought context prevents repeated certainty request being equated with intent',()=>{const s=localSafety('Promise I would never hurt my mother',{intrusiveThoughtPresent:true});assert.equal(s.riskLevel,'monitor');assert.equal(s.needsEmergencyPath,false);});
test('even selected exercises cannot receive invented model instructions',()=>{const p={...fallbackPlan('shoulders tight',newMemory()),interventionId:'pmr_shoulders'};assert.throws(()=>validateResponse({message:'Squeeze your fists, inhale for four, hold for two, then shake them out.'},p));});
test('chat pause rejects new messages until explicitly resumed',async()=>{await assert.rejects(()=>engineTurn({...newConversation(false,true),state:'CHAT_PAUSED'},{value:'hello',revision:0},{},{}),/Resume/);});

test('driving and recent injury remain constraints on later turns',()=>{for(const message of ['I am driving','My shoulder hurts from an injury']){const m=updateMemory(newMemory(),message);const p=routePlan({...fallbackPlan('please try an exercise',m),interventionId:'pmr_hands',shouldInterveneNow:true},emptySafety(),m,'please try an exercise');assert.equal(p.interventionId,null);}});

test('the first action already supplied is not requested again',async()=>{const s=newConversation(false,true);s.engineMemory={...newMemory(),event:'speech'};s.transcript=[{role:'assistant',text:'What is your first small action?'}];const r=await runConversationEngine({},s,'Good morning everyone');assert.equal(r.memory.firstAction,'Good morning everyone');assert.equal(r.telemetry.planner.responseMode,'REFLECTION');assert.ok(!r.message.includes('?'));});

test('selected exercise text comes from registry rather than unconstrained model prose',async()=>{let generated=0;const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async()=>({...fallbackPlan('shoulders tight',newMemory()),primaryState:'MUSCLE_TENSION',interventionId:'pmr_hands',shouldInterveneNow:true}),generateResponse:async()=>{generated++;return {message:'Make a loose fist and hold your breath.'};}};const r=await runConversationEngine({},newConversation(true,true),'My shoulders are tight',{provider});assert.equal(generated,0);assert.equal(r.telemetry.responseSource,'registry');assert.ok(!r.message.includes('fist'));});

test('physical instructions cannot bypass registry through a non-exercise response mode',()=>{const p=fallbackPlan('presentation soon',newMemory());assert.throws(()=>validateResponse({message:'Try a quick progressive muscle release: tense each muscle for a few seconds.'},p));});
