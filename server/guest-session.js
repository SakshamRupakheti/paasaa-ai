import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {handleApi} from './api.js';
const MAX=700000;
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
function key(env){const value=env.PAASAA_GUEST_STATE_KEY?.trim();if(!/^[a-f0-9]{64}$/i.test(value||''))fail('Temporary guest mode is unavailable. Please try again later.',503);return Buffer.from(value,'hex');}
export function sealGuest(records,owner,env,now=Date.now()){
  const plain=JSON.stringify({owner,expires:now+4*60*60*1000,records});
  if(Buffer.byteLength(plain)>MAX)fail('This temporary session is full. End it before starting another.',413);
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(env),iv);
  cipher.setAAD(Buffer.from('paasaa-guest-v1'));
  const encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
}
export function openGuest(state,owner,env,now=Date.now()){
  key(env);if(state===null||state===undefined)return [];
  if(typeof state!=='string'||state.length>MAX*1.5)fail('Invalid temporary session.');
  try{const bytes=Buffer.from(state,'base64url'),decipher=createDecipheriv('aes-256-gcm',key(env),bytes.subarray(0,12));decipher.setAAD(Buffer.from('paasaa-guest-v1'));decipher.setAuthTag(bytes.subarray(12,28));const data=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString());if(data.owner!==owner||data.expires<now||!Array.isArray(data.records))throw Error();return data.records;}catch{fail('Temporary session expired or is invalid. Reload to start again.',409);}
}
// A fresh store for this request only. State leaves only as authenticated ciphertext;
// no transcript, worksheet, mood or telemetry is written to a database or cache.
export class GuestStore {
  constructor(records,quota){this.records=structuredClone(records);this.quota=quota;}
  async list(kind){return this.records.filter(r=>r.kind===kind).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  async get(id){return this.records.find(r=>r.id===id)||null;}
  async put(record,kind,expected){const old=await this.get(record.id);if((old?.revision||0)!==expected)fail('This temporary record changed. Please retry.',409);const next={...record,kind,revision:expected+1,updatedAt:new Date().toISOString()};this.records=this.records.filter(r=>r.id!==next.id);this.records.push(next);return next;}
  async limit(){return this.quota();}
}
export async function guestRequest(request,env,owner,quota){
  try{
    if(request.method!=='POST')fail('Method not allowed',405);
    const raw=await request.text();if(raw.length>1100000)fail('Temporary request is too large.',413);
    const body=JSON.parse(raw);
    if(!/^\/api\/(?:moods|worries|conversations)(?:\/[\w-]+)*$/.test(body.path||'')||!['GET','POST'].includes(body.method))fail('Invalid temporary request.');
    if(body.body!==undefined&&(typeof body.body!=='string'||body.body.length>100000))fail('Invalid request body.');
    const store=new GuestStore(openGuest(body.state,owner,env),quota),origin=new URL(request.url).origin;
    const inner=new Request(origin+body.path,{method:body.method,headers:{Origin:origin,'Content-Type':'application/json'},body:body.method==='POST'?body.body:undefined});
    const result=await handleApi(inner,env,{owner,store});
    return Response.json({data:await result.json(),state:sealGuest(store.records,owner,env)},{status:result.status,headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({data:{error:e.status?e.message:'Temporary request could not be processed.'}},{status:e.status||400,headers:{'Cache-Control':'no-store'}});}
}
