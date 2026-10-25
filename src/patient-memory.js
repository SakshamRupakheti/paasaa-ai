import {requireAccount,isGuest} from './auth.js';
import {apiFetch} from './api-client.js';
import {INTERVENTIONS} from './chat-interventions.js';
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
const types={preferred_name:'Preferred name',preferred_language:'Preferred language',communication_preferences:'How you prefer to talk',patient_confirmed_goals:'A goal you choose',known_triggers:'Something you find difficult',repeated_worries:'A recurring worry',declined_interventions:'Practices you prefer to avoid',relevant_patient_confirmed_history:'Context you want to remember'};
async function request(path,body){const r=await apiFetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();if(!r.ok)throw Error(data.error||'Could not save.');return data;}
function field(form,label,input){const l=el('label',label);l.append(input);form.append(l);return input;}
function select(options){const s=el('select');for(const [value,label]of Object.entries(options)){const o=el('option',label);o.value=value;s.append(o);}return s;}
function check(form,label){const input=el('input');input.type='checkbox';field(form,label,input);return input;}
export function createPatientMemory(){
  const root=document.getElementById('memory-screen');
  async function home(){
    if(!await requireAccount(root,home))return;
    root.replaceChildren(el('h1','What Paasaa remembers'),el('p','Save only what you choose. These entries are your own reports, not clinical findings.'));
    if(isGuest()){root.append(el('p','Guest sessions do not save memories or outcomes. Sign in with an account to use saved context.'));return;}
    const status=el('p');status.setAttribute('role','status');root.append(status);
    try{
      const [m,o]=await Promise.all([request('/api/memory'),request('/api/intervention-outcomes')]);
      if(o.followup)root.append(el('p',o.followup.message));
      const form=el('form');form.className='context-form';form.append(el('h2','Save a detail'));
      const type=field(form,'Type',select(types)),content=field(form,'Your words',el('textarea'));content.maxLength=600;content.required=true;
      const avoid=field(form,'Practice to avoid',select(Object.fromEntries(Object.values(INTERVENTIONS).map(i=>[i.id,i.title]))));avoid.parentElement.hidden=true;
      const updateType=()=>{const declines=type.value==='declined_interventions';avoid.parentElement.hidden=!declines;content.parentElement.hidden=declines;content.required=!declines;};type.onchange=updateType;
      const until=field(form,'Optional expiry date',el('input'));until.type='date';
      const use=check(form,'Use in chat: send this record to Groq when relevant. Off by default.');
      const submit=el('button','Confirm and save');submit.type='submit';form.append(submit);root.append(form);
      let editing=null;
      form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{await request('/api/memory',{...(editing?{id:editing.id,revision:editing.revision}:{}),memory_type:type.value,content:type.value==='declined_interventions'?avoid.value:content.value,confirmed:true,use_in_chat:use.checked,valid_until:until.value?new Date(until.value+'T23:59:59').toISOString():null});await home();}catch(e){status.textContent=e.message;submit.disabled=false;}};
      root.append(el('h2','Saved details'));
      if(!m.records.filter(r=>r.confirmation_status!=='revoked').length)root.append(el('p','No saved details yet.'));
      for(const record of m.records.filter(r=>r.confirmation_status!=='revoked')){
        const row=el('article');row.className='context-row';row.append(el('h3',types[record.memory_type]||'Saved detail'),el('p',record.content),el('small',record.use_in_chat?'Use in chat is on':'Use in chat is off'));
        const edit=el('button','Edit'),revoke=el('button','Remove from memory');edit.type=revoke.type='button';
        edit.onclick=()=>{editing=record;type.value=record.memory_type;content.value=record.content;avoid.value=record.content;updateType();use.checked=record.use_in_chat;until.value=record.valid_until?.slice(0,10)||'';submit.textContent='Confirm changes';(type.value==='declined_interventions'?avoid:content).focus();};
        revoke.onclick=async()=>{try{await request('/api/memory',{id:record.id,revision:record.revision,operation:'revoke'});await home();}catch(e){status.textContent=e.message;}};
        row.append(edit,revoke);root.append(row);
      }
      const outcomes=el('form');outcomes.className='context-form';outcomes.append(el('h2','Record a practice outcome'),el('p','A personal report, not proof that a treatment works. Follow-ups appear here; no reminder is sent.'));
      const practice=field(outcomes,'Practice',select(Object.fromEntries(Object.values(INTERVENTIONS).map(i=>[i.id,i.title]))));
      const started=field(outcomes,'Practice started (local time)',el('input')),completed=field(outcomes,'Practice ended (local time)',el('input'));for(const n of [started,completed]){n.type='datetime-local';n.required=true;}
      const context=field(outcomes,'What was happening?',el('input'));context.required=true;context.maxLength=600;
      const helpful=field(outcomes,'How was it?',select({unsure:'Not sure',helpful:'Helpful',unchanged:'No change',unhelpful:'Not helpful',worse:'Felt worse'}));
      const pre=field(outcomes,'Before (optional, 0–10)',el('input')),post=field(outcomes,'After (optional, 0–10)',el('input'));for(const n of [pre,post]){n.type='number';n.min=0;n.max=10;}
      const feedback=field(outcomes,'Anything to remember? (optional)',el('textarea'));feedback.maxLength=600;
      const follow=field(outcomes,'Optional follow-up date',el('input'));follow.type='date';
      const share=check(outcomes,'Use in chat: send this outcome to Groq when relevant. Off by default.');
      const save=el('button','Confirm outcome');save.type='submit';outcomes.append(save);root.append(outcomes);
      outcomes.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await request('/api/intervention-outcomes',{intervention_id:practice.value,context:context.value,started_at:new Date(started.value).toISOString(),completed_at:new Date(completed.value).toISOString(),pre_rating:pre.value===''?null:Number(pre.value),post_rating:post.value===''?null:Number(post.value),patient_reported_helpfulness:helpful.value,patient_feedback:feedback.value,followup_date:follow.value?new Date(follow.value+'T23:59:59').toISOString():null,use_in_chat:share.checked,confirmed:true});await home();}catch(e){status.textContent=e.message;save.disabled=false;}};
      root.append(el('h2','Reported outcomes'));if(!o.records.length)root.append(el('p','No outcomes recorded.'));
      for(const record of o.records){
        const row=el('article');row.className='context-row';row.append(el('h3',INTERVENTIONS[record.intervention_id]?.title||'Practice'),el('p',record.patient_reported_helpfulness),el('p',record.patient_feedback||'No extra note.'));
        const toggle=el('button',record.use_in_chat?'Turn off use in chat':'Allow this outcome in chat with Groq');toggle.type='button';
        toggle.onclick=async()=>{try{await request('/api/intervention-outcomes',{id:record.id,revision:record.revision,use_in_chat:!record.use_in_chat});await home();}catch(e){status.textContent=e.message;}};row.append(toggle);
        if(record.followup_required){const done=el('button','Mark follow-up complete');done.type='button';done.onclick=async()=>{try{await request('/api/intervention-outcomes',{id:record.id,revision:record.revision,use_in_chat:record.use_in_chat,followup_required:false});await home();}catch(e){status.textContent=e.message;}};row.append(done);}root.append(row);
      }
    }catch(e){status.textContent=e.message;}
  }
  return {home};
}
