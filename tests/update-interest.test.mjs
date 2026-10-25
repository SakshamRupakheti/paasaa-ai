import test from 'node:test';
import assert from 'node:assert/strict';
import {registerUpdateInterest} from '../server/update-interest.js';
const config={supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'sb_publishable_test'};
const request=(body,method='POST')=>new Request('https://paasaa.test/api/updates',{method,body:method==='POST'?JSON.stringify(body):undefined});
test('updates opt-in validates before database calls',async()=>{
 for(const body of [{email:'invalid'},{email:'x\ny@example.com'},{email:'x'.repeat(255)+'@a.co'},null]){
  const response=await registerUpdateInterest(request(body),{config,limit:()=>assert.fail('should not call quota'),fetcher:()=>assert.fail('should not call database')});
  assert.equal(response.status,400);
 }
});
test('updates opt-in sends only email, consent, time, and verified owner',async()=>{
 let sent;
 const response=await registerUpdateInterest(request({email:' Test@Example.com ',owner:'attacker',chat:'private text'}),{config,token:'test-token',owner:'verified-user',limit:async()=>true,fetcher:async(url,options)=>{sent=JSON.parse(options.body);assert.match(url,/paasaa_update_interest/);return new Response(null,{status:201});}});
 assert.equal(response.status,200);assert.equal(sent.owner,'verified-user');assert.equal(sent.email,'test@example.com');assert.equal(sent.chat,undefined);assert.deepEqual(Object.keys(sent).sort(),['consent_version','email','owner','updated_at']);
});
test('updates opt-in fails closed on quota and database failure',async()=>{
 const blocked=await registerUpdateInterest(request({email:'a@example.com'}),{config,limit:async()=>false,fetcher:()=>assert.fail('must not insert')});assert.equal(blocked.status,429);
 const failed=await registerUpdateInterest(request({email:'a@example.com'}),{config,limit:async()=>true,fetcher:async()=>new Response(null,{status:500})});assert.equal(failed.status,503);
 assert.equal((await registerUpdateInterest(request(null,'GET'),{})).status,405);
});
