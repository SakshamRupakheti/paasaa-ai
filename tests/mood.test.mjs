import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {RecordStore} from '../server/store.js';
import {handleApi} from '../server/api.js';
import {validateMood,moodWeek,weekDays} from '../src/mood-model.js';
function db(){const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE records (owner TEXT,id TEXT,kind TEXT,payload TEXT,revision INTEGER,updated_at TEXT,PRIMARY KEY(owner,id))');return {prepare(s){return {bind(...v){const q=sql.prepare(s);return {all:async()=>({results:q.all(...v)}),first:async()=>q.get(...v),run:async()=>({meta:{changes:q.run(...v).changes}})};}};}};}
test('mood check-ins persist per owner, correct one day, deduplicate retries, reject stale edits',async()=>{
 const d=db();const send=(owner,body,path='/api/moods',origin='https://paasaa.test')=>handleApi(new Request('https://paasaa.test'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),{},owner?{owner,store:new RecordStore(d,owner)}:undefined);
 const entry={day:'2026-10-10',mood:'okay',note:'Synthetic entry',revision:0};
 assert.equal((await send(null,entry)).status,401);assert.equal((await send('a',entry,'/api/moods','https://other.test')).status,403);
 let r=await send('a',entry);assert.equal(r.status,200);const saved=await r.json();assert.equal(saved.revision,1);
 assert.equal((await (await send('a',entry)).json()).revision,1);
 assert.equal((await (await send('b')).json()).records.length,0);
 assert.equal((await send('b',undefined,'/api/worries/'+saved.id)).status,404);
 assert.equal((await send('a',undefined,'/api/worries/'+saved.id)).status,404);
 assert.equal((await send('a',{...entry,mood:'low'})).status,409);
 assert.equal((await send('a',{...entry,mood:'good',revision:1})).status,200);
 const list=await (await send('a')).json();assert.equal(list.records.length,1);assert.equal(list.records[0].mood,'good');assert.equal(list.records[0].revision,2);
});
test('mood input rejects bad values and never accepts caller ownership',()=>{
 const b={day:'2026-10-10',mood:'good',note:'',revision:0};for(const bad of [{mood:'diagnosed'},{day:'2026-02-30'},{day:'bad'},{note:'x'.repeat(2001)},{revision:-1}])assert.throws(()=>validateMood({...b,...bad}));assert.equal(validateMood({...b,owner:'someone'}).owner,undefined);
});
test('seven local calendar days include missing entries without inferred scores',()=>{
 const date=new Date(2026,0,3,12);assert.deepEqual(weekDays(date),['2025-12-28','2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03']);const week=moodWeek([{day:'2026-01-02',mood:'unsure'}],date);assert.equal(week.filter(x=>x.record).length,1);assert.equal(week[0].record,null);assert.equal(week[5].record.mood,'unsure');assert.equal(week[5].score,undefined);
});
