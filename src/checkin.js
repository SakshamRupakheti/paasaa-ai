import { CheckInStore, newDraft, localDate, toggleChoice, EMOTIONS, SYMPTOMS, CONTEXTS, BEHAVIORS, AREAS } from './checkin-model.js';
import { mountVoice } from './voice.js';
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
const button = (text, action, cls) => { const b = el('button', text, cls); b.type = 'button'; b.addEventListener('click', action); return b; };
const titles = ['How anxious do you feel right now?', 'What are you feeling right now?', 'Are you noticing anything in your body?', 'What was happening around the time you noticed the anxiety?', 'What was going through your mind?', 'What did you do when you felt anxious?', 'How much did anxiety get in the way today?'];
export function createCheckIn(showScreen) {
  let storage; try { storage = localStorage; } catch { /* Session mode remains available. */ }
  const store = new CheckInStore(storage);
  const panel = document.getElementById('reflection-screen');
  const home = document.getElementById('checkin-home');
  let cleanupVoice = () => {}, started = null;
  const save = () => { store.persist(); const s = document.getElementById('save-status'); if (s) s.textContent = store.error || (store.mode === 'device' ? 'Saved on this browser · not shared' : 'Kept in this tab only'); };
  function leave() { cleanupVoice(); cleanupVoice = () => {}; if (started !== null && store.draft) store.draft.completionDuration += Math.round((performance.now() - started) / 1000); started = null; save(); }
  function weekly(target) {
    const week = el('div', null, 'week'); week.setAttribute('aria-label', 'Check-ins this week');
    const monday = new Date(); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    ['M','T','W','T','F','S','S'].forEach((day, i) => {
      const date = new Date(monday); date.setDate(monday.getDate() + i);
      const done = store.records.some(r => r.localDate === localDate(date));
      const n = el('div', null, done ? 'day logged' : 'day'); n.append(el('span', day), el('strong', done ? '✓' : String(date.getDate())));
      n.setAttribute('aria-label', `${date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}: ${done ? 'check-in recorded' : 'no check-in'}`); week.append(n);
    }); target.append(week);
  }
  function renderHome(completed = false) {
    leave(); home.replaceChildren();
    if (completed) { home.append(el('h2','Thanks for checking in.'), el('p','Each check-in helps you and your clinician understand patterns over time. Nothing is shared with a clinician in this preview.')); }
    weekly(home);
    const eligible = store.records.filter(r => r.anxietyIntensity !== null);
    if (new Set(eligible.map(r => r.localDate)).size >= 7) home.append(el('p',`Average recorded anxiety: ${(eligible.reduce((sum,r) => sum+r.anxietyIntensity,0)/eligible.length).toFixed(1)} / 10 across ${eligible.length} rated check-ins. This describes your entries; it does not explain their causes.`, 'subtle'));
    if (store.error) home.append(el('p',store.error,'privacy-note'));
    home.append(el('p',store.mode === 'device' ? 'Progress saves on this browser. Anyone using this browser profile may be able to read it.' : 'Choose where your progress stays. Session-only entries disappear when this page reloads or closes.', 'subtle'));
    const actions = el('div',null,'actions');
    const begin = mode => { store.mode = mode; store.draft ||= newDraft(); save(); renderStep(); showScreen('reflection-screen'); };
    if (store.draft || store.mode === 'device') actions.append(button(store.draft ? 'Resume check-in' : 'Start daily check-in', () => begin(store.mode), 'primary'));
    else { if (!store.blocked) actions.append(button('Save on this device', () => begin('device'), 'primary')); actions.append(button('Session only', () => begin('session'))); }
    home.append(actions);
  }
  function chips(root, field, options, exclusive) {
    const group = el('div',null,'chips'); group.setAttribute('role','group'); group.setAttribute('aria-label',field === 'interferenceAreas' ? 'Areas of interference' : titles[store.draft.step]);
    for (const option of options) {
      const b = button(option, () => { store.draft[field] = toggleChoice(store.draft[field],option,exclusive); for (const child of group.children) child.setAttribute('aria-pressed',String(store.draft[field].includes(child.textContent))); save(); });
      b.setAttribute('aria-pressed',String(store.draft[field].includes(option))); group.append(b);
    } root.append(group);
    if (options.includes('Something else')) {
      const detail = el('details'); detail.append(el('summary','Add a detail (optional)'));
      const label = el('label','Anything else you want to record?'); const input = el('textarea'); input.rows = 2; input.maxLength = 3000; input.value = store.draft.notes[field] || ''; input.addEventListener('input',()=>{store.draft.notes[field]=input.value;save();}); label.append(input); detail.append(label); root.append(detail);
    }
  }
  function slider(root, field, max, left, right, changed = () => {}) {
    const group = el('div',null,'rating'); const output = el('output',store.draft[field] === null ? '—' : String(store.draft[field]));
    const input = el('input'); input.type = 'range'; input.min = 0; input.max = max; input.step = 1; input.value = store.draft[field] ?? 0; input.setAttribute('aria-label', field === 'thoughtBeliefStrength' ? 'How strongly did this thought feel true?' : titles[store.draft.step]);
    const update = () => { input.setAttribute('aria-valuetext',store.draft[field] === null ? 'Not answered; use arrow keys to choose a number' : `${store.draft[field]} out of ${max}`); output.textContent = store.draft[field] === null ? '—' : String(store.draft[field]); };
    input.addEventListener('input',()=>{store.draft[field]=Number(input.value);update();changed();save();});
    const ends = el('div',null,'rating-labels'); ends.append(el('span',`0 · ${left}`),el('span',`${max} · ${right}`));
    group.append(output,input,ends,button('Choose 0',()=>{store.draft[field]=0;input.value=0;update();changed();save();},'text-button'),button('Leave unanswered',()=>{store.draft[field]=null;input.value=0;update();changed();save();},'text-button')); update(); root.append(group);
  }
  function textInput(root, field, labelText, placeholder) {
    const label = el('label',labelText); const input = el('textarea'); input.rows = 4; input.maxLength = 6000; input.placeholder = placeholder || ''; input.value = store.draft[field]; input.addEventListener('input',()=>{store.draft[field]=input.value;save();}); label.append(input); root.append(label);
    const voice = el('div',null,'voice'); root.append(voice);
    cleanupVoice = mountVoice(voice, approved => {
      store.draft[field] = approved; input.value = approved;
      store.draft.voice.used = true; store.draft.voice.patientApprovedVersion = approved;
      store.draft.voice.sources.push({field,transcription:null,patientApprovedVersion:approved,method:'manual-review',timestamp:new Date().toISOString()}); save();
    });
  }
  function renderStep() {
    leave(); if (!store.draft) return; started = performance.now();
    const d = store.draft; panel.replaceChildren();
    const top = el('div',null,'checkin-top'); top.append(el('span','DAILY CHECK-IN','eyebrow'),button('Save & come back',()=>{renderHome();showScreen('transition-screen');},'text-button'));
    const progress = el('progress'); progress.max = 7; progress.value = d.step; progress.setAttribute('aria-label','Check-in progress');
    const title = el('h1',titles[d.step]); title.tabIndex = -1;
    panel.append(top,progress,title,el('p',d.step===0 ? "Move the circle to what feels closest. There isn't a right answer." : d.step===6 ? 'Move the circle to what feels closest, or leave it unanswered.' : d.step===4 ? "You don't need to make it sound perfect. Write it the way it appeared in your head." : 'Select anything that fits, or continue without answering.','subtle'));
    if(d.step===0) slider(panel,'anxietyIntensity',10,'Not anxious at all','Extremely anxious');
    if(d.step===1) chips(panel,'emotions',EMOTIONS);
    if(d.step===2) {
      const body=el('div',null,'body-noticing');
      // Decorative diagram: observations are chosen explicitly, never inferred from regions.
      body.innerHTML='<svg viewBox="0 0 120 230" aria-hidden="true"><circle cx="60" cy="29" r="20"/><path d="M41 56 Q60 48 79 56 L96 120 Q97 133 87 129 L77 88 L78 148 L73 211 Q68 223 62 210 L60 155 L58 210 Q52 223 47 211 L42 148 L43 88 L33 129 Q23 133 24 120 Z"/><circle class="body-point" cx="60" cy="84" r="9"/><circle class="body-point" cx="60" cy="125" r="10"/></svg>';
      body.append(el('p','Notice your head, chest, stomach, and the rest of your body. Select only what you notice.','subtle'));panel.append(body);chips(panel,'physicalSymptoms',SYMPTOMS,'Nothing noticeable');
    }
    if(d.step===3) {chips(panel,'contextCategories',CONTEXTS);textInput(panel,'contextNarrative','Want to add what happened? (optional)','Write a little, if you want to.');}
    if(d.step===4) {textInput(panel,'automaticThought','Your thought (optional)',"For example: “I'm going to mess this up.”");const detail=el('details');detail.append(el('summary','How strongly did this thought feel true? (optional)'));slider(detail,'thoughtBeliefStrength',100,'Not at all','Completely');panel.append(detail);}
    if(d.step===5) chips(panel,'behaviors',BEHAVIORS);
    if(d.step===6) {const areas=el('div');const sync=()=>{areas.hidden=d.functionalImpact===null||d.functionalImpact<5;};slider(panel,'functionalImpact',10,'Not at all','Extremely',sync);areas.append(el('h2','What did it interfere with?'));chips(areas,'interferenceAreas',AREAS);sync();panel.append(areas);}
    const actions=el('div',null,'actions');if(d.step>0)actions.append(button('Back',()=>{leave();d.step--;save();renderStep();}));
    actions.append(button(d.step===6?'Save check-in':'Continue',()=>{leave();if(d.step===6){store.complete();renderHome(true);showScreen('transition-screen');}else{d.step++;save();renderStep();}},'primary'));panel.append(actions);
    const status=el('p',null,'subtle');status.id='save-status';status.setAttribute('role','status');panel.append(status);save();title.focus();window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();else if(!panel.hidden&&store.draft)started=performance.now();});
  window.addEventListener('pagehide',leave);
  return {hasDraft:()=>Boolean(store.draft),home:renderHome,clear(){leave();store.clear();renderHome();},leave};
}


