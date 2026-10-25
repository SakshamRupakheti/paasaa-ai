import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeMemory,makeOutcome,selectPatientContext,contextualCheckin} from '../server/patient-context.js';
import {foundationApi} from '../server/foundation-api.js';
import {newReview,transitionReview,advanceSafetyReview,datasetCandidate} from '../server/review-workflow.js';
import {conditionModules,allowedModuleInterventions} from '../server/condition-modules.js';
import {clinicalInterventions,eligibleInterventions} from '../server/intervention-registry.js';
import {AIProvider} from '../server/ai-provider.js';
import {aiConfig} from '../server/ai-config.js';
import {EVALUATION_DIMENSIONS,evaluationReport,validateCorpus,corpusCandidate} from '../server/corpus-pipeline.js';
import {handleVercelApi} from '../server/vercel-api.js';
import {handleApi} from '../server/api.js';
import {TRUST_PAGES,renderTrustPage} from '../src/trust-content.js';
import {runConversationEngine} from '../server/conversation-engine.js';
import {newConversation} from '../src/conversation-model.js';
import {emptySafety} from '../server/engine-safety.js';
import {fallbackPlan} from '../server/engine-router.js';
import {newMemory} from '../server/engine-memory.js';
const now='2026-10-24T18:00:00.000Z';
const input={memory_type:'patient_confirmed_goals',content:'Practice a presentation',confirmed:true,use_in_chat:false};
test('memory requires confirmation, rejects asserted clinician facts, binds owner and respects revocation',()=>{
  assert.throws(()=>makeMemory({...input,confirmed:false},'one'));
  assert.throws(()=>makeMemory({...input,clinician_verified:true},'one'));
  assert.throws(()=>makeMemory({...input,memory_type:'clinician_care_plan'},'one'));
  const r=makeMemory(input,'one',null,now);assert.equal(r.patient_id,'one');assert.equal(r.clinician_verified,false);
  const revoked=makeMemory({operation:'revoke'},'one',r,now);assert.equal(revoked.content,'');assert.equal(revoked.use_in_chat,false);
});
test('context excludes unconsented, expired, wrong-owner, speculative and revoked entries',()=>{
  const base=makeMemory({...input,use_in_chat:true},'one',null,now);
  const records=[base,{...base,id:'no',use_in_chat:false},{...base,id:'other',patient_id:'two'},{...base,id:'old',valid_until:'2026-01-01'},{...base,id:'guess',source:'model'},{...base,id:'revoked',confirmation_status:'revoked'},{...base,id:'care',memory_type:'clinician_care_plan'}];
  const c=selectPatientContext(records,[],'presentation','one',now);assert.deepEqual(c.memories.map(r=>r.id),[base.id]);
  assert.equal(selectPatientContext([base],[],'unrelated topic','one',now).memories.length,0);
});
test('outcomes preserve missing ratings and explicit declines constrain offers',()=>{
  const r=makeOutcome({intervention_id:'paced_breathing',context:'presentation',started_at:now,completed_at:now,pre_rating:null,post_rating:null,patient_reported_helpfulness:'worse',use_in_chat:true,confirmed:true},'one',now);
  assert.equal(r.pre_rating,null);assert.equal(r.followup_required,false);
  assert.deepEqual(selectPatientContext([], [r], 'hello','one',now).declinedInterventions,['paced_breathing']);
  const m=makeMemory({memory_type:'declined_interventions',content:'paced_breathing',confirmed:true,use_in_chat:true},'one',null,now);
  assert.deepEqual(selectPatientContext([m],[], 'hello','one',now).declinedInterventions,['paced_breathing']);
  assert.deepEqual(selectPatientContext([], [{...r,use_in_chat:false}], 'hello','one',now).declinedInterventions,[]);
});
test('opted-in context reaches the provider without surviving opt-out in session memory',async()=>{
  const m=makeMemory({memory_type:'declined_interventions',content:'paced_breathing',confirmed:true,use_in_chat:true},'one',null,now);
  const goal=makeMemory({...input,use_in_chat:true},'one',null,now);
  const seen=[];
  const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async(_,context)=>{seen.push(structuredClone(context));return {...fallbackPlan('hello',newMemory()),shouldAskQuestion:false};},generateResponse:async()=>({message:'We can talk about your presentation.'})};
  const first=await runConversationEngine({},newConversation(true,true),'presentation',{provider,patientContext:selectPatientContext([m,goal],[],'presentation','one',now)});
  assert.ok(seen[0].memory.interventionsRejected.includes('paced_breathing'));
  assert.equal(seen[0].patientConfirmedContext.memories.length,2);
  assert.ok(!first.memory.interventionsRejected.includes('paced_breathing'));
  assert.ok(!JSON.stringify(first.telemetry).includes(goal.content));
  await runConversationEngine({},{...newConversation(true,true),engineMemory:first.memory},'presentation',{provider,patientContext:selectPatientContext([{...m,use_in_chat:false},{...goal,use_in_chat:false}],[],'presentation','one',now)});
  assert.deepEqual(seen[1].patientConfirmedContext.memories,[]);
  assert.ok(!seen[1].memory.interventionsRejected.includes('paced_breathing'));
});
test('memory API edits require current revision and explicit sharing confirmation',async()=>{
  const rows=new Map();const store={durableContext:true,owner:'one',get:async id=>rows.get(id),list:async kind=>[...rows.values()].filter(r=>r.kind===kind),put:async(r,kind,revision)=>{const saved={...r,kind,revision:revision+1};rows.set(r.id,saved);return saved;}};
  const request=body=>foundationApi(new Request('https://test.local/api/memory',{method:'POST',body:JSON.stringify(body)}),'/api/memory',store);
  const {record}=await request(input);assert.equal(record.use_in_chat,false);
  const {record:edited}=await request({...input,id:record.id,revision:record.revision,use_in_chat:true});assert.equal(edited.use_in_chat,true);
  await assert.rejects(request({...input,id:record.id,revision:record.revision}),{status:409});
  const {record:revoked}=await request({id:record.id,revision:edited.revision,operation:'revoke'});assert.equal(revoked.content,'');assert.equal(revoked.use_in_chat,false);
});
test('follow-up only uses an existing owned due confirmed record',()=>{
  assert.equal(contextualCheckin([], 'one',now),null);
  const r={id:'test',patient_id:'one',confirmation_status:'patient_confirmed',followup_required:true,followup_date:'2026-10-20'};
  assert.equal(contextualCheckin([r],'one',now).record_id,'test');assert.equal(contextualCheckin([r],'two',now),null);
});
test('foundation endpoints deny guests and reject forged ownership',async()=>{
  const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
  for(const path of ['/api/memory','/api/intervention-outcomes']){
    const r=await handleVercelApi(new Request('https://test.local'+path,{headers:{Authorization:'Bearer test'}}),env,async()=>Response.json({id:'11111111-1111-4111-8111-111111111111',is_anonymous:true}));assert.equal(r.status,403);
  }
  const req=new Request('https://test.local/api/memory',{method:'POST',body:JSON.stringify({...input,patient_id:'someone-else'})});
  await assert.rejects(foundationApi(req,'/api/memory',{durableContext:true,owner:'one'}),/Unsupported/);
});
test('legacy worry endpoints cannot mutate a memory',async()=>{
  const r=await handleApi(new Request('https://test.local/api/worries/mem/consent',{method:'POST',headers:{Origin:'https://test.local'},body:JSON.stringify({revision:1,enabled:true})}),{},{owner:'one',store:{get:async()=>({kind:'memory',id:'mem',revision:1}),put:()=>assert.fail('No cross-kind write')}});assert.equal(r.status,404);
});
test('unreviewed clinical modules and interventions remain inactive',()=>{
  assert.equal(conditionModules.size,0);assert.deepEqual(eligibleInterventions(clinicalInterventions,{}),[]);
  const module={id:'synthetic',version:'test',active:true,identifyEligibleState:()=>true,getAllowedInterventions:()=>['test'],validateTransition:()=>true,getClinicalContext:()=>({}),getEvaluationCriteria:()=>[]};
  assert.deepEqual(allowedModuleInterventions(module,{}),[]);
});
test('notification delivery never implies human acknowledgment',()=>{
  assert.throws(()=>advanceSafetyReview({state:'NOTIFICATION_SENT'},'ACKNOWLEDGED',{delivery_id:'sent'}));
  assert.equal(advanceSafetyReview({state:'NOTIFICATION_SENT'},'ACKNOWLEDGED',{reviewer_ack_id:'ack'}).state,'ACKNOWLEDGED');
  assert.throws(()=>newReview({id:'real',synthetic:false}));
  const r=newReview({id:'synthetic',synthetic:true});assert.throws(()=>transitionReview(r,'QUEUED_FOR_REVIEW',{role:'reviewer',verified:false}));
  assert.throws(()=>datasetCandidate(r,{}));
});
test('provider interface and model role configuration do not require a vendor rewrite',async()=>{
  const c=aiConfig({PRIMARY_MODEL:'primary',FAST_MODEL:'fast',SAFETY_MODEL:'safety',EMBEDDING_MODEL:'embed'});assert.equal(c.conversationModel,'primary');assert.equal(c.plannerModel,'fast');assert.equal(c.safetyModel,'safety');assert.equal(c.embeddingModel,'embed');
  await assert.rejects(new AIProvider().embed(),{code:'unsupported_capability'});
});
test('corpus cannot collapse to question/answer or automatically become training data',async()=>{
  const schema=JSON.parse(await readFile('research/paasaa-model/schemas/clinical-corpus.schema.json','utf8'));
  assert.throws(()=>validateCorpus(schema,{question:'hello',answer:'hello'}));assert.throws(()=>corpusCandidate({clinician_review_status:'approved_candidate'},{}));
  const result=evaluationReport([{case_id:'synthetic',model:'not-run',prompt_version:'test',policy_version:'test',language:'en',ratings:Object.fromEntries(EVALUATION_DIMENSIONS.map(d=>[d,null]))}]);
  assert.equal(result.dimensions.safety.mean,null);assert.equal(result.clinical_validation,false);
});
test('trust pages are standalone, truthful and do not require authentication',()=>{
  for(const slug of Object.keys(TRUST_PAGES)){const page=renderTrustPage(slug);assert.match(page,/<html lang="en"/);assert.match(page,/favicon/);assert.doesNotMatch(page,/<script|clinicians are watching|10,000/);}
  assert.match(renderTrustPage('privacy'),/Use in chat defaults to off/);assert.match(renderTrustPage('about'),/not a service currently offered/);
});
