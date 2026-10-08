import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import {beginGoogleOAuth,oauthCallback} from '../src/oauth.js';
import {handleVercelApi} from '../server/vercel-api.js';
import {prototypeData} from '../server/admin-prototype.js';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
const config={supabaseUrl:'https://example.supabase.co'};
test('Google login binds a single-use callback to a random PKCE verifier',async()=>{
  const s=storage(),url=new URL(await beginGoogleOAuth(config,{storage:s,origin:'https://paasaa.test',cryptoApi:webcrypto,now:1000}));
  assert.equal(url.searchParams.get('redirect_to'),'https://paasaa.test/?auth=callback');
  assert.equal(url.searchParams.get('scopes'),'openid email profile');
  const body=oauthCallback('https://paasaa.test/?auth=callback&code=synthetic',s,2000);
  assert.equal(body.auth_code,'synthetic');
  assert.equal(url.searchParams.get('code_challenge'),createHash('sha256').update(body.code_verifier).digest('base64url'));
  assert.equal(url.href.includes(body.code_verifier),false);
  assert.throws(()=>oauthCallback('https://paasaa.test/?auth=callback&code=replay',s,2000),/expired/);
});
test('expired, future, absent and cancelled Google callbacks cannot exchange tokens',async()=>{
  for(const now of [0,602000]){const s=storage();await beginGoogleOAuth(config,{storage:s,origin:'https://paasaa.test',cryptoApi:webcrypto,now:1000});assert.throws(()=>oauthCallback('https://paasaa.test/?auth=callback&code=x',s,now),/expired/);}
  assert.throws(()=>oauthCallback('https://paasaa.test/?auth=callback&code=x',storage(),1000),/expired/);
  assert.throws(()=>oauthCallback('https://paasaa.test/?auth=callback&error=access_denied',storage(),1000),/cancelled/);
  assert.equal(oauthCallback('https://paasaa.test/#chat',storage()),null);
});
const env={SUPABASE_URL:config.supabaseUrl,SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',PAASAA_PROTOTYPE_OWNER_EMAIL:'owner@example.invalid'};
const user={id:'11111111-1111-4111-8111-111111111111',email:env.PAASAA_PROTOTYPE_OWNER_EMAIL,email_confirmed_at:'2026-10-01',is_anonymous:false};
const request=()=>new Request('https://paasaa.test/api/admin/prototype',{headers:{Authorization:'Bearer synthetic'}});
test('prototype rejects other accounts, unverified email, metadata spoofing and missing owner configuration',async()=>{
  for(const [u,e] of [[{...user,email:'other@example.invalid'},env],[{...user,email_confirmed_at:null},env],[{...user,email:'other@example.invalid',user_metadata:{email:user.email,role:'admin'}},env],[user,{...env,PAASAA_PROTOTYPE_OWNER_EMAIL:''}]]){
    const response=await handleVercelApi(request(),e,async()=>Response.json(u));assert.equal(response.status,403);
  }
});
test('owner receives only synthetic fixtures without querying any records',async()=>{
  let calls=0;const response=await handleVercelApi(request(),env,async url=>{calls++;assert.match(url,/auth\/v1\/user$/);return Response.json(user);});
  assert.equal(response.status,200);assert.equal((await response.json()).synthetic,true);assert.equal(calls,1);
});
test('consent removes withheld records and transcripts from the API payload',()=>{
  const {patients}=prototypeData();assert.equal(patients[0].transcript,null);assert.equal(patients[1].transcript.length,2);
  assert.deepEqual(patients[2].ratings,[]);assert.equal(patients[2].summary,null);assert.equal(patients[2].worksheet,null);assert.equal(patients[2].transcript,null);
  assert.equal(JSON.stringify(patients).includes('Synthetic private chat sample'),false);
  assert.equal(patients[0].ratings[2],null);assert.ok(patients[1].worksheet.after>patients[1].worksheet.before);
});
