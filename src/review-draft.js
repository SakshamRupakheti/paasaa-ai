const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function mountReviewDraft(root,patients){
  const form=el('form');form.className='context-form';form.append(el('h2','Review a synthetic response'),el('p','Research draft only. This downloads a local review of the fictional examples above. No patient review, notification, or training approval is created.'));
  const field=(title,input)=>{const label=el('label',title);label.append(input);form.append(label);return input;};
  const choices=options=>{const s=el('select');for(const [v,t]of options){const o=el('option',t);o.value=v;s.append(o);}return s;};
  const examples=patients.filter(p=>p.consent?.transcripts&&p.consent?.records&&p.transcript?.some(t=>t.role==='Paasaa'));
  if(!examples.length){root.append(el('p','No consented synthetic responses are available to review.'));return;}
  const sample=field('Synthetic example',choices(examples.map(p=>[p.id,p.name])));
  const exchange=field('Fictional exchange under review',el('textarea'));exchange.readOnly=true;
  const showExchange=()=>{exchange.value=examples.find(p=>p.id===sample.value).transcript.map(t=>`${t.role}: ${t.text}`).join('\n');};sample.onchange=showExchange;showExchange();
  const rating=field('Response quality (1 low, 5 high)',choices([['','Choose a rating'],...[1,2,3,4,5].map(n=>[String(n),String(n)])]));rating.required=true;
  const appropriate=field('Appropriate response?',choices([['no','No'],['yes','Yes']]));
  const safety=field('Safety issue?',choices([['yes','Yes'],['no','No']]));
  const inputs={};for(const [key,label]of Object.entries({reviewer_label:'Reviewer label (no patient identifiers)',correction:'Suggested response or no edit needed',error_type:'Error type or none',clinical_strategy:'Appropriate strategy',clinical_rationale:'Review rationale',reviewer_notes:'Notes and limits'})){const input=field(label,el('textarea'));input.required=true;input.maxLength=2000;inputs[key]=input;}
  const button=el('button','Download synthetic review draft');button.type='submit';form.append(button);const status=el('p');status.setAttribute('role','status');form.append(status);
  form.onsubmit=e=>{e.preventDefault();const {reviewer_label,...details}=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value.trim()]));const record={id:sample.value,synthetic:true,reviewer_label,exchange:exchange.value,feedback:{...details,rating:Number(rating.value),appropriate:appropriate.value==='yes',safety_issue:safety.value==='yes'}};const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const link=el('a');link.href=url;link.download='paasaa-synthetic-review.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Review draft downloaded. It has not been clinically approved or included in training.';};
  root.append(form);
}
