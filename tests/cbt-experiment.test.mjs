import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleForCBTExperiment,experimentProvider,CBT_EXPERIMENT_PROMPT} from '../evals/cbt-experiment.js';
test('CBT experiment requires opt-in and never overrides safety, exercises, or casual chat',()=>{
  const c={plan:{responseMode:'WORRY_CLARIFICATION',interventionId:null}};
  assert.equal(eligibleForCBTExperiment(c,true),true);
  assert.equal(eligibleForCBTExperiment(c,false),false);
  for(const mode of ['SAFETY_CHECK','CRISIS_ESCALATION','MEDICAL_ESCALATION','GENERAL_CONVERSATION','OCD_NON_REASSURANCE'])assert.equal(eligibleForCBTExperiment({plan:{...c.plan,responseMode:mode}},true),false);
  assert.equal(eligibleForCBTExperiment({...c,safety:{needsEmergencyPath:true}},true),false);
  assert.equal(eligibleForCBTExperiment({plan:{...c.plan,interventionId:'paced_breathing'}},true),false);
});
test('wrapper changes only eligible generation prompts and forwards safety and planner unchanged',async()=>{
  const calls=[];const base={metrics:[],classifySafety:(...a)=>calls.push(['safety',...a]),planTurn:(...a)=>calls.push(['plan',...a]),generateResponse:(...a)=>calls.push(['response',...a])};
  const p=experimentProvider(base,true);
  await p.classifySafety('safety-prompt');await p.planTurn('planner-prompt');
  await p.generateResponse('base',{plan:{responseMode:'REFLECTION'}},{});
  await p.generateResponse('base',{plan:{responseMode:'GENERAL_CONVERSATION'}},{});
  assert.equal(calls[0][1],'safety-prompt');assert.equal(calls[1][1],'planner-prompt');
  assert.ok(calls[2][1].endsWith(CBT_EXPERIMENT_PROMPT));assert.equal(calls[3][1],'base');
});
