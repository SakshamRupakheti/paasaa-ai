import {makeMemory,makeOutcome,contextualCheckin} from './patient-context.js';
import {fail,exact} from './foundation-contracts.js';
const kinds={'/api/memory':'memory','/api/intervention-outcomes':'intervention_outcome'};
export async function foundationApi(request,path,store){
  const kind=kinds[path];if(!kind)fail('Not found.',404);
  if(store.durableContext!==true)fail('Saved context needs a signed-in account. Guests remain temporary.',403);
  if(request.method==='GET'){const records=await store.list(kind);return {records,followup:kind==='intervention_outcome'?contextualCheckin(records,store.owner):null};}
  if(request.method!=='POST')fail('Method not allowed.',405);
  const raw=await request.text();if(raw.length>5000)fail('This entry is too long.',413);
  let body;try{body=JSON.parse(raw);}catch{fail('Invalid request.');}
  if(!body||typeof body!=='object'||Array.isArray(body))fail('Invalid request.');
  let previous=null;
  if(body.id){previous=await store.get(body.id);if(!previous||previous.kind!==kind)fail('Record not found.',404);if(body.revision!==previous.revision)fail('This entry changed. Reload before editing.',409);}
  let record;
  if(kind==='intervention_outcome'&&previous){
    exact(body,['id','revision','use_in_chat','followup_required']);
    if(typeof body.use_in_chat!=='boolean'||body.followup_required!==undefined&&body.followup_required!==false)fail('Confirm your sharing preference.');
    record={...previous,use_in_chat:body.use_in_chat,...(body.followup_required===false?{followup_required:false}:{})};
  }else record=kind==='memory'?makeMemory(body,store.owner,previous):makeOutcome(body,store.owner);
  return {record:await store.put(record,kind,previous?.revision||0)};
}
