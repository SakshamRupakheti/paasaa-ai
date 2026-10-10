import test from 'node:test';
import assert from 'node:assert/strict';
import {publicServiceStatus,clinicalEligibility,aiEnabled} from '../server/service-policy.js';
import {assertNoHumanServiceClaim} from '../server/response-policy.js';
import {safetyRoute} from '../server/safety-routing.js';
import {handleVercelApi} from '../server/vercel-api.js';
import {handleApi} from '../server/api.js';
import {GroqProvider} from '../server/ai-provider.js';
import {transcribe} from '../server/ai.js';
import {runConversationEngine} from '../server/conversation-engine.js';
import {emptySafety} from '../server/engine-safety.js';
import {fallbackPlan} from '../server/engine-router.js';
import {newMemory} from '../server/engine-memory.js';
import {newConversation} from '../src/conversation-model.js';

const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',GROQ_API_KEY:'synthetic'};
const owner='11111111-1111-4111-8111-111111111111';
test('service status survives auth and database configuration outages without external calls or secrets',async()=>{
  for(const config of [{},env,{...env,PAASAA_AI_ENABLED:'false',PAASAA_ON_CALL_ENABLED:'true'}]){
    const r=await handleVercelApi(new Request('https://paasaa.test/api/service-status'),config,()=>assert.fail('No external call'));
    assert.equal(r.status,200);const body=await r.json();
    assert.equal(body.onCallEnabled,false);assert.equal(body.notificationsEnabled,false);assert.equal(body.humanReview.configured,false);
    assert.equal(body.ai.availabilityGuaranteed,false);assert.equal(body.help.requiresAccount,false);
    assert.equal(JSON.stringify(body).includes('synthetic'),false);
  }
  const local=await handleApi(new Request('http://localhost/api/service-status'),{});assert.equal(local.status,200);
});
test('service status is read only and respects adapter origin checks',async()=>{
  const local=await handleApi(new Request('http://localhost/api/service-status',{method:'POST'}),{});assert.equal(local.status,405);
  const r=await handleVercelApi(new Request('https://paasaa.test/api/service-status',{method:'POST',headers:{Origin:'https://elsewhere.test'}}),env);assert.equal(r.status,403);
});
test('incomplete clinician APIs cannot be enabled by role spoofing or environment switches',async()=>{
  for(const path of ['clinical','clinical/profile','clinician/patients']){
    const anon=await handleVercelApi(new Request('https://paasaa.test/api/'+path),env);assert.equal(anon.status,401);
    let calls=0;
    const r=await handleVercelApi(new Request('https://paasaa.test/api/'+path,{headers:{Authorization:'Bearer synthetic'}}),{...env,PAASAA_CLINICAL_ENABLED:'true'},async()=>{
      calls++;return Response.json({id:owner,user_metadata:{role:'clinician',age:30,clinicalApproved:true}});
    });
    assert.equal(r.status,503);assert.equal((await r.json()).code,'CLINICAL_SERVICE_NOT_IMPLEMENTED');assert.equal(calls,1);
  }
});
test('age jurisdiction consent and assignment gates deny absent or insufficient evidence',()=>{
  assert.equal(clinicalEligibility({ageBand:'under13'}).reason,'UNDER_13');
  assert.equal(clinicalEligibility({}).reason,'AGE_NOT_ESTABLISHED');
  assert.equal(clinicalEligibility({ageBand:'18+'}).reason,'JURISDICTION_NOT_ESTABLISHED');
  const subject={ageBand:'13-17',jurisdiction:'US-IA'};
  assert.equal(clinicalEligibility(subject).reason,'JURISDICTION_NOT_APPROVED');
  const policy={jurisdictions:{'US-IA':{legalApproved:true,clinicalApproved:true}}};
  assert.equal(clinicalEligibility(subject,policy).reason,'ADOLESCENT_REVIEW_REQUIRED');
  policy.jurisdictions['US-IA'].adolescentApproved=true;subject.adolescentPolicySatisfied=true;
  assert.equal(clinicalEligibility(subject,policy).reason,'CURRENT_CONSENT_REQUIRED');
  subject.consentCurrent=true;assert.equal(clinicalEligibility(subject,policy).reason,'VERIFIED_ASSIGNMENT_REQUIRED');
  subject.assignmentVerified=true;assert.deepEqual(clinicalEligibility(subject,policy).allowed,false);
  assert.equal(clinicalEligibility(subject,policy).reason,'CLINICAL_SERVICE_NOT_IMPLEMENTED');
  assert.equal(clinicalEligibility({...subject,ageBand:'18+'},policy).allowed,false);
});
test('AI kill switch blocks generation transcription and injected engines without requests',async()=>{
  const off={...env,PAASAA_AI_ENABLED:'false'};const never=()=>assert.fail('Network must not run');
  assert.equal(aiEnabled(off),false);assert.equal(publicServiceStatus(off).ai.configured,false);
  await assert.rejects(()=>new GroqProvider(off,never).generateResponse('',{},{}),{status:503});
  await assert.rejects(()=>transcribe(off,new Blob(['synthetic']),never),{status:503});
  const result=await runConversationEngine(off,newConversation(true,true),'what is a cloud?',{provider:{classifySafety:never,planTurn:never,generateResponse:never}});
  assert.equal(result.telemetry.responseSource,'fallback');assert.equal(result.telemetry.operationalSafety,'UNCERTAIN');
});
const claims=["I've notified your therapist.",'We will contact your family.',"I've sent an alert to the team.",'Your clinician has been alerted.','Your doctor is reviewing this now.','Your therapist has reviewed your message.','Help is on the way.',"I'm your licensed therapist.",'He avisado a tu terapeuta.','Tu médico está revisando tu mensaje.','मैंने आपके चिकित्सक को सूचित कर दिया है।','मैले तपाईंको चिकित्सकलाई खबर दिएको छु।'];
for(const message of claims)test('reject unconfirmed service claim: '+message,()=>assert.throws(()=>assertNoHumanServiceClaim(message),/Unconfirmed/));
test('truthful limits and patient-directed support remain permitted',()=>{
  for(const text of ['Paasaa has not contacted anyone.','I cannot contact your therapist.','You can call a safe trusted person.','Chats are not continuously monitored.','Paasaa no ha contactado a nadie.'])assert.equal(assertNoHumanServiceClaim(text),text);
});
test('generated contact numbers cannot bypass the static resource registry',()=>{
  for(const text of ['Call 555-123-4567 now.','Text 988.','Llama 12345.','कॉल १२३४५','फोन १२३४५'])assert.throws(()=>assertNoHumanServiceClaim(text),/Unverified contact/);
});
test('generated false monitoring claim falls back before display or storage',async()=>{
  const provider={metrics:[],classifySafety:async()=>emptySafety(),planTurn:async()=>fallbackPlan('what is a cloud?',newMemory()),generateResponse:async()=>({message:"I've notified your therapist."})};
  const result=await runConversationEngine({},newConversation(true,true),'what is a cloud?',{provider});
  assert.equal(result.telemetry.responseSource,'fallback');assert.doesNotMatch(result.message,/notified/);
});
test('operational routing preserves urgent guidance and labels unavailable assessment uncertain',()=>{
  assert.equal(safetyRoute({safety:{riskLevel:'urgent',category:'medical'},failed:true}),'POSSIBLE_MEDICAL_EMERGENCY');
  assert.equal(safetyRoute({safety:{needsEmergencyPath:true}}),'POSSIBLE_URGENT_RISK');
  assert.equal(safetyRoute({safety:emptySafety(),source:'local'}),'UNCERTAIN');
  assert.equal(safetyRoute({safety:emptySafety(),failed:true}),'UNCERTAIN');
  assert.equal(safetyRoute({safety:{riskLevel:'monitor'},source:'model'}),'NEEDS_CLINICAL_REVIEW');
  assert.equal(safetyRoute({safety:emptySafety(),source:'model'}),'ROUTINE');
});
