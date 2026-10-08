import {requireAccount} from './auth.js';
import {apiFetch} from './api-client.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function table(headers,rows){const t=el('table');const caption=el('caption','Synthetic examples only');t.append(caption);const head=el('thead'),tr=el('tr');headers.forEach(h=>tr.append(el('th',h)));head.append(tr);t.append(head);const body=el('tbody');for(const row of rows){const line=el('tr');row.forEach(v=>line.append(el('td',String(v??'Not recorded'))));body.append(line);}t.append(body);return t;}
export function createDashboard(){
  const root=document.getElementById('dashboard-screen');let data,selected,query='';
  function render(){
    root.replaceChildren(el('p','OWNER WORKSPACE · SYNTHETIC DATA','eyebrow'),el('h1','A clearer picture, one entry at a time.'),el('p','Internal prototype. Every person, rating and event below is fictional. No real patient data is loaded, and no diagnosis is generated.','prototype-banner'));
    const stats=el('div',undefined,'dashboard-stats');for(const [value,label] of [[data.patients.length,'Sample accounts'],[data.patients.filter(p=>p.consent.records).length,'Record-sharing examples'],[data.patients.filter(p=>p.consent.transcripts).length,'Transcript-consent examples']]){const card=el('div',undefined,'dashboard-card');card.append(el('strong',String(value)),el('span',label));stats.append(card);}root.append(stats);
    const layout=el('div',undefined,'dashboard-layout'),aside=el('aside'),detail=el('article',undefined,'dashboard-card');const label=el('label','Find a sample patient');const search=el('input');search.type='search';search.value=query;search.placeholder='Name or demo ID';label.append(search);aside.append(label);const list=el('div',undefined,'dashboard-patients');aside.append(list);
    function drawList(){list.replaceChildren();for(const p of data.patients.filter(p=>(p.name+' '+p.id).toLowerCase().includes(query.toLowerCase()))){const b=el('button',p.name+' · '+p.id);b.type='button';b.setAttribute('aria-pressed',String(p.id===selected));b.onclick=()=>{selected=p.id;drawList();drawDetail();};list.append(b);}if(!list.childElementCount)list.append(el('p','No matching sample accounts.'));}
    search.oninput=()=>{query=search.value;drawList();};
    function drawDetail(){const p=data.patients.find(p=>p.id===selected);detail.replaceChildren(el('h2',p.name),el('p',p.id+' · '+p.email),el('p','Sample sign-in: '+new Date(p.lastSignIn).toLocaleString()+' · '+p.provider));
      detail.append(el('h3','Consent snapshot'),el('p','Records: '+(p.consent.records?'Shared in this example':'Not shared')+' · Chat transcript: '+(p.consent.transcripts?'Separately approved in this example':'Not approved')));
      if(!p.consent.records){detail.append(el('p','Clinical entries are hidden because this sample patient has not shared them.'));return;}
      detail.append(el('h3','Recorded anxiety · 0–10'),el('p','Self-reported sample ratings. Gaps mean no entry; scores are not diagnoses.'));
      const bars=el('div',undefined,'dashboard-bars');p.ratings.forEach((value,i)=>{const column=el('div');column.append(el('span',value===null?'—':String(value)));const bar=el('div',undefined,'dashboard-bar');bar.style.height=value===null?'2px':`${value*9}px`;bar.setAttribute('aria-label',`October ${i+1}: ${value===null?'no entry':value+' out of 10'}`);column.append(bar,el('small',`Oct ${i+1}`));bars.append(column);});detail.append(bars,el('h3','Review summary'),el('p',p.summary),el('h3','CBT worksheet'));
      if(p.worksheet)detail.append(el('p',p.worksheet.prediction),table(['First estimate','Later estimate','Outcome'],[[p.worksheet.before+'%',p.worksheet.after+'%',p.worksheet.outcome]]));
      detail.append(el('h3','Chat transcript'));
      if(!p.transcript)detail.append(el('p','Hidden. Sharing check-ins or worksheets does not grant access to chat transcripts.'));
      else for(const turn of p.transcript)detail.append(el('p',turn.role+': '+turn.text));
    }
    drawList();drawDetail();layout.append(aside,detail);root.append(layout,el('h2','Sample activity'),el('p',data.monitoring),table(['Time','Sample account','Event'],data.events.map(e=>[new Date(e.at).toLocaleString(),e.patient,e.event])));
    const back=el('a','Back to Paasaa');back.href='#chat';root.append(back);
  }
  async function home(){if(!await requireAccount(root,home))return;root.replaceChildren(el('p','Opening your internal workspace…'));try{const r=await apiFetch('/api/admin/prototype');const d=await r.json();if(!r.ok)throw Error(d.error||'Workspace unavailable');if(d.synthetic!==true)throw Error('This prototype accepts only synthetic data.');data=d;selected=data.patients[0]?.id;render();}catch(e){root.replaceChildren(el('h1','Internal workspace'),el('p',e.message));}}
  return {home};
}
