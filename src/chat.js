import {currentStep,steps} from './worry-model.js';
import {checkinQuestions} from './chat-checkin.js';
import {toggleChoice} from './checkin-model.js';
import {safetySignal} from './safety-signals.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action,cls)=>{const b=el('button',text,cls);b.type='button';b.onclick=action;return b;};
const api=async(path,body)=>{const r=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'Please try again.');return data;};
const printable=value=>value===null||value===undefined||value===''?'Not answered':Array.isArray(value)?value.join(', ')||'Not answered':String(value);

export function createChat(checkin,openSafety){
  const root=document.getElementById('chat-screen');
  let sheet=null,checkCursor=0,busy=false,consent=false,conversation=[],composerDraft='',answerDraft,answerDirty=false,available=false,initialized=false,requestNumber=0,paused=false;
  let log,worksheet,status,input,send,controls,allow,saveTimer;
  function notice(text){status.textContent=text;}
  function setBusy(value){busy=value;send.disabled=value||!consent||!available;input.disabled=value;controls.querySelectorAll('button').forEach(b=>b.disabled=value);worksheet.querySelectorAll('button,input,textarea,select').forEach(n=>n.disabled=value);allow.disabled=value;}
  function bubble(role,text){const b=el('article',undefined,'chat-bubble '+role);b.append(el('span',role==='user'?'YOU':'PAASAA GUIDE','eyebrow'),el('p',text));log.append(b);return b;}
  function action(id){if(busy)return;if(id==='worry')return chooseWorry();if(id==='checkin')return chooseCheckin();if(id==='safety')return openSafety();location.hash=id==='breathe'?'#breathe':'#support';}
  function actions(parent,items){const row=el('div',undefined,'actions');for(const item of items)row.append(button(item.label,()=>action(item.id)));parent.append(row);}
  function sourceLinks(parent,sources){if(!sources.length)return;const refs=el('div',undefined,'chat-sources');refs.append(el('span','Learn about the approach: '));for(const source of sources){const a=el('a',source.label);a.href=source.href;a.target='_blank';a.rel='noopener noreferrer';refs.append(a);}parent.append(refs);}
  function context(){if(!sheet)return '';const data=sheet.kind==='worry'?sheet.record.answers:checkin.chatRead().draft;if(!data)return '';const fields=sheet.kind==='worry'?steps(sheet.record):checkinQuestions;return JSON.stringify({worksheet:sheet.kind,currentQuestion:sheet.kind==='worry'?currentStep(sheet.record).question:checkinQuestions[checkCursor]?.question,approvedAnswers:Object.fromEntries(fields.filter(q=>q.field in data).map(q=>[q.field,data[q.field]]))}).slice(0,8000);}
  async function ask(event){
    event.preventDefault();const message=input.value.trim();if(busy||!message||!consent)return;
    const ticket=++requestNumber;const candidate=[...conversation,{role:'user',content:message}].slice(-12);
    setBusy(true);notice('Paasaa is thinking…');
    try{const result=await api('chat',{consent:true,messages:candidate,context:context()});if(ticket!==requestNumber)return;
      conversation=[...candidate,{role:'assistant',content:result.message}];bubble('user',message);const reply=bubble('assistant',result.message);actions(reply,result.actions);sourceLinks(reply,result.sources);
      input.value='';composerDraft='';if(result.safety){sheet=null;answerDirty=false;renderSheet();}notice(result.safety?'Exercise paused. Human support is available below.':'Reply ready.');reply.scrollIntoView({block:'nearest',behavior:'instant'});
    }catch(error){notice(error.message+' Your message is still in the box.');}finally{if(ticket===requestNumber){setBusy(false);input.focus();}}
  }
  async function flush(){
    clearTimeout(saveTimer);if(!sheet||!answerDirty)return;
    if(sheet.kind==='checkin'){checkin.chatSaveDraft(checkinQuestions[checkCursor].field,answerDraft,checkCursor);answerDirty=false;return;}
    const value=answerDraft,record=sheet.record;const saved=await api('worries/'+record.id+'/draft',{revision:record.revision,text:typeof value==='string'?value:JSON.stringify(value)});
    if(sheet?.record?.id===record.id){sheet.record=saved;if(answerDraft===value)answerDirty=false;}
  }
  async function chooseWorry(){
    if(busy)return;setBusy(true);
    try{await flush();const {records}=await api('worries');worksheet.replaceChildren(el('h2','Work through a worry'),el('p','Answers save to your private account. They are shared with Groq only if you ask the AI guide about them.'));
      worksheet.append(button('Start a new worry in chat',()=>startWorry(), 'primary'));
      for(const r of records.filter(r=>r.status!=='complete'))worksheet.append(button('Resume: '+(r.answers.worry||'Untitled worry').slice(0,90),()=>startWorry(r.id)));
      worksheet.append(button('Back to current conversation',renderSheet));
    }catch(e){notice(e.message);}finally{setBusy(false);}
  }
  async function startWorry(id){
    if(busy)return;setBusy(true);try{const record=await api(id?'worries/'+id:'worries',id?undefined:{});sheet={kind:'worry',record};answerDraft=undefined;answerDirty=false;renderSheet();notice('Worry worksheet ready.');}catch(e){notice(e.message);}finally{setBusy(false);}
  }
  async function chooseCheckin(){
    if(busy)return;setBusy(true);try{await flush();worksheet.replaceChildren(el('h2','Daily check-in'),el('p','Use the same check-in as the worksheet page. Choose where it stays. AI questions are separate and optional.'));
      const current=checkin.chatRead();
      const start=mode=>{const draft=checkin.chatStart(mode);sheet={kind:'checkin'};checkCursor=draft.chatCursor||0;answerDraft=draft.chatDraft?.field===checkinQuestions[checkCursor]?.field?draft.chatDraft.value:undefined;answerDirty=false;renderSheet();};
      if(current.draft)worksheet.append(button('Resume check-in in chat',()=>start(current.mode),'primary'));
      else {worksheet.append(button('Keep in this tab only',()=>start('session'),'primary'));if(!current.blocked)worksheet.append(button('Save on this browser',()=>start('device')));}
      worksheet.append(button('Back to current conversation',renderSheet));
    }catch(e){notice(e.message);}finally{setBusy(false);}
  }
  async function worryUpdate(op,body={}){sheet.record=await api('worries/'+sheet.record.id+'/'+op,{revision:sheet.record.revision,...body});}
  async function submitAnswer(q,value){
    if(busy)return;setBusy(true);
    try{if(sheet.kind==='checkin'&&typeof value==='string'&&safetySignal(value)){paused=true;renderSheet();notice('Exercise paused. Human support is available.');return;}
      await flush();if(sheet.kind==='worry'){const r=await api('worries/'+sheet.record.id+'/answer',{revision:sheet.record.revision,value});sheet.record=r.session||r;if(r.safety){answerDraft=undefined;answerDirty=false;renderSheet();notice(r.message);return;}}
      else {checkin.chatAnswer(q.field,value);checkCursor++;}
      answerDraft=undefined;answerDirty=false;renderSheet();notice('Answer confirmed.');
    }catch(e){notice(e.message+' Your answer is still here.');}finally{setBusy(false);}
  }
  async function edit(index){if(busy)return;setBusy(true);try{await flush();if(sheet.kind==='worry')await worryUpdate('back',{cursor:index});else checkCursor=index;answerDraft=undefined;answerDirty=false;renderSheet();}catch(e){notice(e.message);}finally{setBusy(false);}}
  async function complete(){if(busy)return;setBusy(true);try{await flush();const kind=sheet.kind;if(kind==='worry')await worryUpdate('complete');else checkin.chatComplete();sheet=null;answerDirty=false;answerDraft=undefined;renderSheet();bubble('assistant',kind==='worry'?'Your worry reflection is saved. You can review it and record what happened in Work through a worry.':'Your daily check-in is complete. You can find it from Daily check-in in this tab, or on this browser if you chose device saving.');notice('Worksheet complete.');}catch(e){notice(e.message);}finally{setBusy(false);}}
  function renderSheet(){
    worksheet.replaceChildren();if(!sheet){worksheet.append(el('p','Choose an exercise above, or ask a question below.','subtle'));return;}
    const isWorry=sheet.kind==='worry';const record=isWorry?sheet.record:checkin.chatRead().draft;
    if(!record){sheet=null;renderSheet();return;}
    worksheet.append(el('span',isWorry?'WORKING THROUGH A WORRY':'DAILY CHECK-IN','eyebrow'));
    if(paused||isWorry&&record.safetyPaused){worksheet.append(el('h2','Let’s pause this exercise.'),el('p','Human support may be more helpful right now. This chat is not monitored.'),button('Find human support',openSafety,'primary'));return;}
    const list=isWorry?steps(record):checkinQuestions;const cursor=isWorry?record.cursor:checkCursor;const data=isWorry?record.answers:record;
    const summary=isWorry?currentStep(record).type==='summary':cursor>=list.length;
    const history=el('details',undefined,'chat-answers');history.open=summary;history.append(el('summary',summary?'Review your answers':'Your confirmed answers'));
    list.forEach((q,index)=>{if(q.type==='summary'||!(q.field in data)||!summary&&index>=cursor)return;const item=el('div',undefined,'chat-answer');item.append(el('strong',q.question),el('p',printable(data[q.field])),button('Edit answer',()=>edit(index)));history.append(item);});worksheet.append(history);
    if(summary){worksheet.append(el('h2','Do these words reflect what you mean?'),el('p','You can edit any answer before completing. Ratings do not have to go down.'),button('Confirm & complete worksheet',complete,'primary'));return;}
    const q=list[cursor];const heading=el('h2',q.question);heading.tabIndex=-1;worksheet.append(heading);
    worksheet.append(el('p',`Question ${cursor+1} · ${q.type==='rating'?`0–${q.max||100}; leave blank if you’re unsure.`:'Use your own words. You can skip optional questions.'}`,'subtle'));
    const form=el('form');let savedDraft=isWorry?record.draftText:'';
    if(savedDraft&&q.type==='rating'){try{savedDraft=JSON.parse(savedDraft);}catch{savedDraft=null;}}
    let value=answerDraft===undefined?(isWorry&&record.draftText?savedDraft:data[q.field]??(q.type==='multi'?[]:q.type==='rating'?null:'')):answerDraft;
    const saveValue=next=>{value=next;answerDraft=next;answerDirty=true;};
    if(q.type==='multi'){
      const group=el('div',undefined,'chips');for(const choice of q.choices){const b=button(choice,()=>{saveValue(toggleChoice(value,choice,q.exclusive));for(const child of group.children)child.setAttribute('aria-pressed',String(value.includes(child.textContent)));});b.setAttribute('aria-pressed',String(value.includes(choice)));group.append(b);}form.append(group);
    }else if(q.type==='choice'){
      const select=el('select');select.setAttribute('aria-label',q.question);const empty=el('option','Choose an option');empty.value='';select.append(empty);q.choices.forEach(c=>{const option=el('option',c);option.value=c;select.append(option);});select.value=value;select.required=true;select.onchange=()=>saveValue(select.value);form.append(select);
    }else{
      const field=el(q.type==='rating'?'input':'textarea');field.setAttribute('aria-label',q.question);if(q.type==='rating'){field.type='number';field.min=0;field.max=q.max||100;field.step=1;}else{field.rows=3;field.maxLength=6000;}
      field.value=value??'';field.oninput=()=>saveValue(q.type==='rating'?(field.value===''?null:Number(field.value)):field.value);form.append(field);
    }
    const buttons=el('div',undefined,'actions');if(cursor>0)buttons.append(button('Back',()=>edit(cursor-1)));const submit=el('button','Confirm answer','primary');submit.type='submit';buttons.append(submit);if(q.type!=='choice')buttons.append(button('Skip this question',()=>submitAnswer(q,q.type==='multi'?[]:q.type==='rating'?null:'')));form.append(buttons);form.onsubmit=e=>{e.preventDefault();submitAnswer(q,value);};worksheet.append(form);
    const storage=isWorry?'Confirmed answers save to your private account.':checkin.chatRead().mode==='device'?'Saved on this browser. Anyone using this profile could read it.':'Kept in this tab only; reloading clears this check-in.';worksheet.append(el('p',storage,'subtle'));
  }
  async function home(){
    if(initialized){renderSheet();return;}initialized=true;
    root.append(el('span','A LITTLE SUPPORT, ONE STEP AT A TIME','eyebrow'));const title=el('h1','Let’s work through it together.');title.tabIndex=-1;root.append(title,el('p','Ask a question, find an exercise, or complete a worksheet here.','intro'),el('p','Paasaa is an AI self-help guide, not a therapist. It can be wrong. This preview is not monitored; clinical review is pending.','subtle'));
    controls=el('div',undefined,'chat-tools');controls.append(button('Work through a worry',chooseWorry),button('Daily check-in',chooseCheckin),button('Breathing practice',()=>action('breathe')),button('Immediate support',()=>action('support')));root.append(controls);
    log=el('div',undefined,'chat-log');log.setAttribute('role','log');log.setAttribute('aria-label','Conversation');log.setAttribute('aria-live','polite');root.append(log);
    worksheet=el('div',undefined,'chat-worksheet');root.append(worksheet);renderSheet();
    const form=el('form',undefined,'chat-composer');const label=el('label','Ask the guide (this does not change worksheet answers)');input=el('textarea');input.rows=3;input.maxLength=3000;input.placeholder='For example: What is a prediction, and how can I work through one?';input.value=composerDraft;input.oninput=()=>composerDraft=input.value;label.append(input);form.append(label);
    const consentLabel=el('label',undefined,'chat-consent');allow=el('input');allow.type='checkbox';allow.checked=consent;allow.onchange=()=>{consent=allow.checked;setBusy(busy);};consentLabel.append(allow,document.createTextNode('Allow sending this conversation and the active worksheet’s confirmed answers to Groq when I ask the guide.'));form.append(consentLabel);
    send=el('button','Ask Paasaa','primary');send.type='submit';send.disabled=true;form.append(send);form.onsubmit=ask;root.append(form);
    status=el('p','Connecting…','save-status');status.setAttribute('role','status');root.append(status);
    root.append(el('p','Chat stays in this tab and clears on reload. Saved worksheet answers follow the storage choice shown above. No automatic sharing with a clinician.','subtle'));
    const footer=el('div',undefined,'actions');footer.append(button('Clear conversation',()=>{if(busy)return;conversation=[];composerDraft='';input.value='';log.replaceChildren();notice('Conversation cleared. Saved worksheet answers are unchanged.');}),button('Find human support',openSafety));root.append(footer);
    try{available=(await api('status')).ai;notice(available?'Ready when you are. AI questions are optional.':'AI is not connected here yet. You can still complete worksheets.');}catch{notice('AI is unavailable. The daily check-in still works in this tab.');}setBusy(false);
  }
  window.addEventListener('beforeunload',event=>{if(answerDirty||composerDraft){event.preventDefault();event.returnValue='';}});
  return {home,leave(){if(!busy)flush().catch(e=>notice(e.message));},clear(){conversation=[];sheet=null;composerDraft='';answerDraft=undefined;answerDirty=false;if(initialized){input.value='';log.replaceChildren();renderSheet();}}};
}
