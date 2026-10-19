import test from 'node:test';
import assert from 'node:assert/strict';
import {GroqProvider} from '../server/ai-provider.js';
import {responseSchema} from '../server/engine-schemas.js';
const good=()=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({message:'Synthetic reply'})}}],usage:{total_tokens:12}});
function provider(sequence){let calls=0;const p=new GroqProvider({GROQ_API_KEY:'synthetic-key'},async()=>{const next=sequence[calls++];if(next instanceof Error)throw next;return next();});return {p,count:()=>calls};}
const run=p=>p.generateResponse('synthetic prompt',{message:'synthetic private input'},responseSchema);
for(const [name,first]of [
  ['server error',()=>new Response('',{status:503})],
  ['network error',new TypeError('network')],
  ['schema HTTP error',()=>Response.json({error:{code:'json_validate_failed'}},{status:400})],
  ['invalid schema',()=>Response.json({choices:[{finish_reason:'stop',message:{content:'{"wrong":true}'}}]})],
  ['short rate limit',()=>new Response('',{status:429,headers:{'retry-after':'0'}})]
])test('bounded retry recovers '+name,async()=>{
  const {p,count}=provider([first,good]);assert.equal((await run(p)).message,'Synthetic reply');assert.equal(count(),2);
  assert.deepEqual(p.metrics.map(m=>m.attempt),[1,2]);assert.doesNotMatch(JSON.stringify(p.metrics),/synthetic-key|private input|Synthetic reply/);
});
for(const [name,first]of [
  ['authentication',()=>new Response('',{status:401})],
  ['long rate limit',()=>new Response('',{status:429,headers:{'retry-after':'20'}})],
  ['unknown rate limit',()=>new Response('',{status:429})],
  ['refusal',()=>Response.json({choices:[{finish_reason:'stop',message:{refusal:'refused',content:'{}'}}]})],
  ['truncation',()=>Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]})]
])test('does not retry '+name,async()=>{const {p,count}=provider([first,good]);await assert.rejects(run(p));assert.equal(count(),1);});
test('repeated failure stops after one retry',async()=>{const {p,count}=provider([()=>new Response('',{status:503}),()=>new Response('',{status:503}),good]);await assert.rejects(run(p),{code:'upstream'});assert.equal(count(),2);});
