import test from 'node:test';
import assert from 'node:assert/strict';
import {sealGuest,openGuest} from '../server/guest-session.js';
import {handleVercelApi} from '../server/vercel-api.js';
const owner='11111111-1111-4111-8111-111111111111';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',PAASAA_GUEST_STATE_KEY:'ab'.repeat(32)};
test('temporary state is encrypted, identity-bound, authenticated and expires',()=>{
  const token=sealGuest([{note:'Synthetic private words'}],owner,env,1000);
  assert.ok(!Buffer.from(token,'base64url').toString().includes('Synthetic private words'));
  assert.equal(openGuest(token,owner,env,1001)[0].note,'Synthetic private words');
  assert.throws(()=>openGuest(token,'different-owner',env,1001));
  const tampered=Buffer.from(token,'base64url');tampered[30]^=1;
  assert.throws(()=>openGuest(tampered.toString('base64url'),owner,env,1001));
  assert.throws(()=>openGuest(token,owner,env,1000+5*3600000));
  assert.throws(()=>sealGuest([],owner,{}));
});
test('guest chat and moods work without any record database request; refresh starts empty',async()=>{
  let state=null;
  const fetcher=async url=>{assert.match(url,/\/auth\/v1\/user$/);return Response.json({id:owner,is_anonymous:true});};
  async function run(path,body){
    const response=await handleVercelApi(new Request('https://paasaa.test/api/guest',{method:'POST',headers:{Origin:'https://paasaa.test',Authorization:'Bearer synthetic','Content-Type':'application/json'},body:JSON.stringify({path,method:body===undefined?'GET':'POST',body:body===undefined?undefined:JSON.stringify(body),state})}),env,fetcher);
    const result=await response.json();assert.equal(response.status,200,JSON.stringify(result.data));state=result.state;return result.data;
  }
  await run('/api/moods',{day:'2026-10-11',mood:'okay',note:'Synthetic note',revision:0});
  assert.equal((await run('/api/moods')).records.length,1);
  let chat=await run('/api/conversations',{aiConsent:false,companion:true});
  chat=await run(`/api/conversations/${chat.session.id}/turn`,{revision:chat.session.revision,value:'Hello'});
  assert.ok(chat.session.transcript.length>=2);
  state=null;assert.equal((await run('/api/moods')).records.length,0);
  assert.equal((await run('/api/conversations')).records.length,0);
  for(const path of ['moods','worries','conversations']){
    const response=await handleVercelApi(new Request('https://paasaa.test/api/'+path,{headers:{Authorization:'Bearer synthetic'}}),env,fetcher);
    assert.equal(response.status,403);
  }
});
