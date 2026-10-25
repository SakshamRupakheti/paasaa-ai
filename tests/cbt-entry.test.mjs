import test from 'node:test';
import assert from 'node:assert/strict';
import {isCbtEntryRequest} from '../server/cbt-entry.js';
import {runConversationEngine} from '../server/conversation-engine.js';
import {newConversation} from '../src/conversation-model.js';
import {conversationApi} from '../server/conversation-api.js';

test('CBT navigation is narrow and does not match mixed disclosures',()=>{
  for(const text of ['can you help me with CBT?','Can we try CBT please?','Help me start cognitive behavioural therapy.'])assert.equal(isCbtEntryRequest(text),true,text);
  for(const text of ['What is CBT?','Do not help me with CBT','"can you help me with CBT?"','can you help me with CBT? I cannot stay safe','Can you help me with CBT because my chest hurts?'])assert.equal(isCbtEntryRequest(text),false,text);
});
test('explicit CBT request offers existing worksheet without provider dependency or automatic answers',async()=>{
  const session=newConversation(true,true);
  session.transcript=[{role:'user',text:'What is CBT?'},{role:'assistant',text:'CBT explores thoughts, feelings, and actions.'}];
  const provider={classifySafety:()=>assert.fail('No remote assessment for pure navigation'),planTurn:()=>assert.fail('No remote plan'),generateResponse:()=>assert.fail('No generation')};
  const result=await runConversationEngine({},session,'can you help me with CBT?',{provider});
  assert.equal(result.telemetry.responseSource,'registry');
  assert.deepEqual(result.choices,[{id:'reflect',label:'Start CBT reflection'}]);
  assert.equal(result.action,null);assert.match(result.message,/here in the chat/);
  assert.deepEqual(session.answers,{});assert.equal(session.companion,true);
});
test('unresolved or recent risk prevents CBT navigation bypass',async()=>{
  for(const setup of [s=>{s.engineMemory={safetyPending:true};},s=>{s.chatSafety='clarify';},s=>{s.safetyState='needs-human-support';},s=>{s.transcript=[{role:'user',text:'I wish I were dead'}];}]){
    const s=newConversation(true,true);setup(s);
    const provider={classifySafety:async()=>{throw Object.assign(Error('synthetic failure'),{code:'timeout'});},planTurn:()=>assert.fail('No planning'),generateResponse:()=>assert.fail('No generation')};
    const r=await runConversationEngine({},s,'can you help me with CBT?',{provider});
    assert.notEqual(r.telemetry.responseSource,'registry');assert.deepEqual(r.choices,[]);
  }
});
test('explicit worksheet selection enters existing flow without filling an answer',async()=>{
  let s={...newConversation(false,true),kind:'conversation',revision:1};
  const store={get:async()=>structuredClone(s),put:async value=>(s={...value,revision:s.revision+1}),list:async()=>[]};
  const path='/api/conversations/'+s.id+'/turn';
  const req=new Request('http://localhost'+path,{method:'POST',body:JSON.stringify({revision:1,action:'reflect'})});
  const result=await conversationApi(req,path,store,{});
  assert.equal(result.session.companion,false);assert.equal(result.session.state,'WORK');
  assert.equal(result.session.field,'worry');assert.deepEqual(result.session.answers,{});
});
