import test from 'node:test';
import assert from 'node:assert/strict';
import {notifyTeam} from '../server/team-notification.js';
import {registerUpdateInterest} from '../server/update-interest.js';
const env={RESEND_API_KEY:'synthetic-secret',PAASAA_TEAM_EMAIL_FROM:'Paasaa <onboarding@resend.dev>'};
const config={supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'sb_publishable_test'};
const submissionId='12345678-1234-4123-8123-123456789abc';
const input={email:'person@example.com',owner:'synthetic-owner',submissionId,env};
const request=(extra={})=>new Request('https://paasaa.test/api/updates',{method:'POST',body:JSON.stringify({email:input.email,submissionId,...extra})});

test('saved submissions notify only the fixed owner inbox with no wellness data',async()=>{
  const calls=[];
  const response=await registerUpdateInterest(request({to:'attacker@example.com',chat:'private chat',name:'private name'}),{
    config,env,owner:input.owner,token:'synthetic-jwt',limit:async()=>true,
    fetcher:async(url,options)=>{calls.push({url,options});return url.includes('supabase')?new Response(null,{status:201}):Response.json({id:'email-id'});}
  });
  assert.deepEqual(await response.json(),{registered:true,notified:true});
  assert.equal(calls.length,2);assert.match(calls[0].url,/paasaa_update_interest/);
  assert.equal(calls[1].url,'https://api.resend.com/emails');
  const {headers,body}=calls[1].options,payload=JSON.parse(body);
  assert.equal(headers.Authorization,'Bearer synthetic-secret');
  assert.deepEqual(payload.to,['sakshamrupakheti23@gmail.com']);
  assert.match(payload.text,/person@example.com/);
  for(const excluded of ['private chat','private name','synthetic-owner','synthetic-jwt','attacker@example.com'])assert.ok(!body.includes(excluded));
  assert.ok(!headers['Idempotency-Key'].includes(input.email));
});

test('database failure and rate limits never send an email',async()=>{
  for(const allowed of [false,true]){
    const response=await registerUpdateInterest(request(),{config,env,limit:async()=>allowed,fetcher:async url=>{assert.match(url,/supabase/);return new Response(null,{status:500});}});
    assert.equal(response.status,allowed?503:429);
  }
});

test('transient email failures retry once with identical payload and idempotency key',async()=>{
  const calls=[];
  assert.deepEqual(await notifyTeam({...input,fetcher:async(url,options)=>{calls.push(options);if(calls.length===1)throw Error('timeout');return Response.json({id:'accepted'});}}),{notified:true});
  assert.equal(calls.length,2);
  assert.equal(calls[0].body,calls[1].body);
  assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);
});

test('repeated HTTP submissions share a key; new submissions use new keys',async()=>{
  const keys=[];const fetcher=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);return Response.json({id:'accepted'});};
  await notifyTeam({...input,fetcher});await notifyTeam({...input,fetcher});
  await notifyTeam({...input,submissionId:crypto.randomUUID(),fetcher});
  assert.equal(keys[0],keys[1]);assert.notEqual(keys[0],keys[2]);
});

test('missing email setup preserves saved contact and reports incomplete notification',async()=>{
  const response=await registerUpdateInterest(request(),{config,limit:async()=>true,fetcher:async url=>{assert.match(url,/supabase/);return new Response(null,{status:201});}});
  assert.deepEqual(await response.json(),{registered:true,notified:false});
});

test('provider rejection never leaks its error or claims delivery',async()=>{
  for(const code of [401,429,500]){
    let mailCalls=0;
    const response=await registerUpdateInterest(request(),{config,env,owner:input.owner,limit:async()=>true,fetcher:async url=>{
      if(url.includes('supabase'))return new Response(null,{status:201});
      mailCalls++;return Response.json({error:'sensitive provider detail'},{status:code});
    }});
    assert.deepEqual(await response.json(),{registered:true,notified:false});
    assert.equal(mailCalls,code===500?2:1);
  }
});

test('invalid submission IDs are rejected before any quota, save or mail call',async()=>{
  const response=await registerUpdateInterest(request({submissionId:'bad\r\nkey'}),{config,env,limit:()=>assert.fail(),fetcher:()=>assert.fail()});
  assert.equal(response.status,400);
});

test('a malformed provider success does not claim notification',async()=>{
  assert.deepEqual(await notifyTeam({...input,fetcher:async()=>Response.json({})}),{notified:false});
});
