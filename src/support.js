import {REASONS,REGIONS,DISCREET,URGES,SOCIAL_ACTIONS,muscleGroups,targetedGroups,discreetGroups} from './support-content.js';
import {GuidedTimer,pmrPlan,breathingPlan,groundingPlan,thoughtDestination,newSupportSession,saveSupportSummary,SUPPORT_KEY} from './support-model.js';
import {node,action,choices,evidence,rating,bodyHighlight,CalmAudio} from './support-ui.js';

export function createSupport() {
 const root=document.getElementById('support-screen');
 const audio=new CalmAudio();
 let session=newSupportSession(),timer=null,frame=null,lastIndex=-1,awareness=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let currentType='',afterGuide=null,pausedButton=null,guideNodes=null,socialAction='';
 const stopLoop=()=>{cancelAnimationFrame(frame);audio.cancel();};
 function pause(){stopLoop();timer?.pause();if(pausedButton){pausedButton.textContent='Resume';if(guideNodes){guideNodes.state.textContent='Paused.';guideNodes.cue.textContent='Let any muscle tension go. Breathe normally while paused.';}}}
 function collectTime(){if(timer){timer.pause();session.durationSeconds+=timer.durationSeconds;timer=null;}stopLoop();pausedButton=null;guideNodes=null;}
 function page(title,copy){
  stopLoop();root.replaceChildren();
  const top=node('div',null,'support-top');top.append(node('span','HERE WITH YOU','eyebrow'),action('Choose another approach',()=>{collectTime();session.endedEarly=true;entry(true);},'text-button'));
  const h=node('h1',title);h.tabIndex=-1;root.append(top,h);if(copy)root.append(node('p',copy,'intro'));h.focus();window.scrollTo({top:0,behavior:'instant'});
 }
 function footer(key='grounding'){
  const row=node('div',null,'support-footer');row.append(action("I might not be safe",()=>safety(),'text-button'));root.append(row);evidence(root,key);
  root.append(node('p','No account or check-in needed. Choices stay in this tab unless you explicitly save a summary. This page is not monitored.','subtle'));
 }
 function entry(fresh=false){
  if(timer&&!fresh){pause();page('Your support is paused.','You can continue or choose something else.');choices(root,[['Resume support',()=>renderGuide()],['Choose a different approach',()=>{collectTime();entry(true);}]]);footer();return;}
  collectTime();session=newSupportSession();currentType='';afterGuide=null;awareness=false;
  page('What feels strongest right now?',"You don't have to explain everything.");
  choices(root,REASONS.map(([id,label])=>[label,()=>{session.entryReason=id;if(id==='tension')environment();else if(id==='breathing')breathingIntro();else if(id==='performance')performanceIntro();else if(id==='social')socialIntro();else if(id==='thought')thoughtScreen();else if(id==='safety')safety();else overwhelm();}]));
  footer();
 }
 function environment(){page('Where are you right now?','This only helps us keep movements comfortable. No location access.');choices(root,[['Somewhere private',()=>{session.environmentMode='private';regionSelector();}],["I'm around other people",()=>{session.environmentMode='public';discreetSelector();}]]);footer('pmr');}
 function regionSelector(){
  page('Where do you notice it most?','Choose an area. You can skip any muscle.');
  const layout=node('div',null,'body-selector');const body=bodyHighlight();layout.append(body);const list=node('div',null,'region-buttons');
  const choose=region=>pmrOptions(targetedGroups(region),region);
  for(const region of REGIONS)list.append(action(region[0].toUpperCase()+region.slice(1),()=>choose(region)));
  // Button hotspots give the body the same keyboard and touch behavior as the list.
  const spots=[['face',50,10],['arms',22,33],['hands',12,53],['stomach',50,48],['thighs',40,69],['feet',65,92]];
  for(const [label,x,y]of spots){const b=action('',()=>choose(label),'body-hotspot');b.setAttribute('aria-label',`Select ${label}`);b.title=label;b.style.left=`${x}%`;b.style.top=`${y}%`;body.append(b);}layout.append(list);root.append(layout);footer('pmr');
 }
 function discreetSelector(){
  page('What can you comfortably move without drawing attention?','Discreet mode · choose up to four areas.');const selected=[];const group=node('div',null,'chips');const status=node('p','Choose an area, or use awareness without moving.','subtle');status.setAttribute('role','status');
  const begin=action('Begin discreet release',()=>{const gs=discreetGroups(selected);pmrOptions(gs,'Discreet mode',true);},'primary');begin.disabled=true;
  for(const item of DISCREET){const b=action(item,()=>{const i=selected.indexOf(item);if(i>=0)selected.splice(i,1);else if(selected.length<4)selected.push(item);else{status.textContent='Up to four areas keeps this short. Deselect one to choose another.';return;}b.setAttribute('aria-pressed',String(selected.includes(item)));begin.disabled=!selected.length;status.textContent=`${selected.length} selected · about ${Math.max(50,selected.length*25)} seconds`;});b.setAttribute('aria-pressed','false');group.append(b);}root.append(group,status,begin,action('Awareness without movement',()=>{awareness=true;pmrOptions(discreetGroups(['Hands','Feet']),'Discreet mode',true);},'text-button'));footer('pmr');
 }
 function comfortControls(){
  const label=node('label',null,'motion');const input=node('input');input.type='checkbox';input.checked=awareness;input.addEventListener('change',()=>{awareness=input.checked;});label.append(input,document.createTextNode('Awareness only — no tensing'));root.append(label);
  root.append(node('p','Keep breathing normally. Never tense to pain or use maximal force. Skip injured or recently operated areas. If you notice pain, cramping, dizziness or significant discomfort, stop tensing.','support-caution'));
 }
 function pmrOptions(groups,region,discreet=false){
  page(discreet?'Discreet mode':`A little release for ${region}.`,'Stay with what feels comfortable.');root.append(bodyHighlight(groups[0])); for (const note of new Set(groups.map(g=>g.contraindicationNote))) root.append(node('p',note,'support-caution'));comfortControls();rating(root,'How intense does this feel right now?',v=>session.distressBefore=v);
  const minRounds=groups.length===1?3:1;const actual=discreet&&groups.length===1?2:minRounds;
  root.append(action(`Release this area · ${groups.length*actual*25} seconds`,()=>beginPMR(groups,actual),'primary'));
  if(!discreet)root.append(action('Full body relaxation · about 13 minutes',()=>dominance(),'text-button'));
  footer('pmr');
 }
 function dominance(){page('Which hand do you usually write with?','16 muscle groups · two gentle rounds per group · about 13 minutes. You can pause, repeat or skip.');choices(root,[['Right',()=>beginPMR(muscleGroups('right'),2)],['Left',()=>beginPMR(muscleGroups('left'),2)]]);footer('pmr');}
 function beginPMR(groups,rounds=1){session.muscleGroups=groups.map(g=>g.id);session.interventionType=session.environmentMode==='public'?'discreet-pmr':'pmr';run(pmrPlan(groups,{awareness,rounds}),'pmr');}
 function breathingIntro(){
  page('A comfortable breath comes first.','Breathe gently. No holds, no large or forced breaths.');
  root.append(node('p','New or severe chest pain, fainting, or severe breathing difficulty needs urgent medical care. Do not assume it is anxiety.','support-caution'));
  root.append(action('I may need urgent medical help',()=>safety(true),'text-button'));
  rating(root,'How intense does this feel right now?',v=>session.distressBefore=v);
  choices(root,[['Start one minute · 4 seconds in, 6 out',()=>{session.breathingMode='4/6-no-hold';run(breathingPlan(),'breathing');}],['My own pace',()=>ownPace()],['Ground myself instead',()=>ground()]]);footer('breathing');
 }
 function ownPace(){collectTime();session.breathingMode='own-pace';page('Return to your normal breathing.',"Don't force the count. A comfortable breath is more important than matching a timer.");choices(root,[['Ground myself',()=>ground()],['Finish for now',()=>finish(false)]]);footer('breathing');}
 function ground(){run(groundingPlan(),'grounding');}
 function overwhelm(){page("Let's make the next minute simpler.",'You can start with the grounding prompt below; no choice is required.');choices(root,[['Release tension',()=>environment()],['Slow things down',()=>breathingIntro()],['Ground myself',()=>ground()]]);root.append(node('div','For now, notice one object near you and the surface supporting you. Let your breathing be ordinary.','privacy-note'));footer();}
 function performanceIntro(){page("Let's get you ready to begin.","You don't have to remove every anxious feeling before you begin.");root.append(action('Begin · about 50 seconds',()=>performanceSequence(),'primary'));root.append(action('Skip breathing; release and refocus',()=>performanceSequence(true),'text-button'));footer('breathing');}
 function performanceSequence(skipBreaths=false){
  const plan=[...(skipBreaths?[]:breathingPlan(3)),{kind:'release',seconds:7,title:'Let your shoulders settle.',cue:'No need to push them down.',group:{displayName:'Shoulders',bodyRegion:'shoulders'}},{kind:'release',seconds:7,title:'Release your hands.',cue:'Let your fingers rest comfortably.',group:{displayName:'Hands',bodyRegion:'forearm'}},{kind:'ground',seconds:6,title:'Look toward what comes next.',cue:'Notice one thing outside yourself.'}];
  run(plan,'performance',()=>nextAction(['Walk to the front','Open your first slide','Say your first sentence','Join the call','Walk into the room']));
 }
 function socialIntro(){page('What are you trying to do?','A small next step can be enough.');choices(root,Object.keys(SOCIAL_ACTIONS).map(label=>[label,()=>{socialAction=SOCIAL_ACTIONS[label];page('Let your body settle a little.',"You don't have to be completely calm to continue.");choices(root,[['Discreet release · 50 seconds',()=>{session.environmentMode='public';run(pmrPlan(discreetGroups(['Hands','Thighs']),{awareness:true}),'social',()=>nextAction([socialAction,'Return your attention to the conversation']));}],['Go straight to one next step',()=>nextAction([socialAction,'Return your attention to the conversation'])]]);footer('pmr');}]));footer();}
 function nextAction(options){page('One next action.',"You can take the anxiety with you. What's the smallest next action?");choices(root,options.map(text=>[text,()=>{page('Take the next step when you’re ready.',text);root.append(action('Finish for now',()=>finish(true),'primary'));footer();}]));root.append(action('Stop for now',()=>finish(false),'text-button'));footer();}
 function thoughtScreen(){page('Which feels closer?',"You don't need to tell Paasaa what the thought is.");choices(root,[['It’s an unwanted thought. I don’t want to act on it.',()=>thoughtBranch('unwanted')],["I'm worried I might act on it or I don't feel safe.",()=>thoughtBranch('might-act')],["I'm not sure.",()=>thoughtBranch('unsure')]]);footer('thought');}
 function thoughtBranch(choice){if(thoughtDestination(choice)==='safety'){safety();return;}page("You don't have to solve the thought right now.",'See if you can notice that the thought is here without answering it. Let uncertainty sit beside you for a moment.');
  const d=node('details');d.append(node('summary','Is it pushing you to do something? (optional)'));const list=node('div',null,'chips');for(const urge of URGES){const b=action(urge,()=>{for(const c of list.children)c.setAttribute('aria-pressed','false');b.setAttribute('aria-pressed','true');});b.setAttribute('aria-pressed','false');list.append(b);}d.append(list);root.append(d);
  root.append(action('Delay the response for 2 minutes',()=>run([{kind:'ground',seconds:40,title:'Let the thought be here.',cue:'You do not have to answer or neutralize it.'},{kind:'ground',seconds:40,title:'Notice your surroundings.',cue:'Allow normal breathing. Notice what is around you without checking for certainty.'},{kind:'ground',seconds:40,title:'Return to an ordinary activity, if safe.',cue:'There is no need to check whether the thought has gone away.'}],'thought'),'primary'));
  root.append(node('p','This is not an exposure exercise or a substitute for an ERP plan with your clinician. Do not delay an action needed for immediate physical safety.','subtle'));footer('thought');
 }
 function run(steps,type,onDone=null){collectTime();currentType=type;afterGuide=onDone;session.interventionType=type;session.completed=false;session.endedEarly=false;timer=new GuidedTimer(steps);renderGuide();}
 function renderGuide(){
  if(!timer||timer.done)return; if(!timer.clock.running && ['tense','notice'].includes(timer.step.kind)) timer.clock.reset(); page('Stay with what feels comfortable.');lastIndex=-1;
  const layout=node('div',null,'support-guide');const visual=node('div',null,'support-visual');const content=node('div',null,'support-instruction');
  const region=node('p',null,'eyebrow');const state=node('h2');state.setAttribute('role','status');state.setAttribute('aria-live','polite');state.setAttribute('aria-atomic','true');
  const count=node('div',null,'support-count');count.setAttribute('aria-hidden','true');const cue=node('p',null,'support-cue');const caution=node('p',null,'support-caution');const progress=node('progress');progress.max=1;progress.setAttribute('aria-label','Current step time');const position=node('p',null,'subtle');
  content.append(region,state,count,cue,caution,progress,position);layout.append(visual,content);root.append(layout);
  const controls=node('div',null,'actions');pausedButton=action('Pause',()=>{if(timer.clock.running)pause();else{if(['tense','notice'].includes(timer.step.kind)){timer.clock.reset();}timer.start();pausedButton.textContent='Pause';lastIndex=-1;tick();}},'primary');
  controls.append(pausedButton,action('Skip this muscle',()=>{if(timer.step.groupId)session.skippedMuscleGroups.push(timer.step.groupId);timer.skipGroup();lastIndex=-1;tick();}),action('Repeat this group',()=>{timer.repeatGroup();lastIndex=-1;tick();}),action('Stop now',()=>finish(false)));root.append(controls);
  if(!timer.step.groupId){controls.children[1].textContent='Skip this step';controls.children[2].textContent='Repeat this step';}
  const motion=node('label',null,'motion');const toggle=node('input');toggle.type='checkbox';toggle.checked=reduced;toggle.addEventListener('change',()=>{reduced=toggle.checked;updateVisual(timer.read());});motion.append(toggle,document.createTextNode('Reduce movement'));root.append(motion);
  const voice=action(audio.enabled?'Voice guidance: On':'Voice guidance: Off',()=>{if(audio.enabled){audio.enabled=false;audio.cancel();voice.textContent='Voice guidance: Off';}else if(audio.available()){audio.enabled=true;voice.textContent='Voice guidance: On';audio.speak(state.textContent);}else{audioNote.textContent='No on-device English voice is available. The guide works fully without audio.';}},'text-button');const audioNote=node('p',null,'subtle');audioNote.setAttribute('role','status');root.append(voice,audioNote);
  if(['breathing','performance'].includes(currentType))root.append(action('Breathing feels uncomfortable — stop and ground',()=>{collectTime();page('Return to your normal breathing.','If the exercise brings dizziness, tingling, breathlessness or more discomfort, stop following the count.');choices(root,[['Ground myself instead',()=>ground()],['I may need urgent medical help',()=>safety(true)],['Finish for now',()=>finish(false)]]);footer('breathing');},'text-button'));
  if(currentType==='breathing')root.append(action('My own pace',()=>ownPace(),'text-button'));
  if(currentType==='pmr')root.append(node('p','Enough to notice tension. Never enough to hurt. Keep breathing normally. Skip or stop for pain, cramping, dizziness, injury, recent surgery or significant discomfort.','subtle'));
  footer(currentType==='pmr'||currentType==='social'?'pmr':currentType==='thought'?'thought':currentType==='breathing'||currentType==='performance'?'breathing':'grounding');
  guideNodes={visual,region,state,count,cue,caution,progress,position};timer.start();tick();
 }
 function updateVisual(s){if(!s||s.done||!guideNodes)return;const v=guideNodes.visual;v.dataset.reduced=String(reduced);const highlight=v.querySelector('.support-highlight');if(highlight){highlight.style.opacity=String(reduced ? .55 : s.step.kind==='tense' ? .65 : s.step.kind==='release' ? .65-s.progress*.4 : .45);highlight.style.transform=reduced?'none':`scale(${s.step.kind==='tense'?1-s.progress*.025:1})`;}
  const orb=v.querySelector('.support-breath-orb');if(orb){const expand=s.step.kind==='inhale'?s.progress:s.step.kind==='exhale'?1-s.progress:0;orb.style.transform=reduced?'none':`scale(${.88+expand*.12})`;orb.dataset.phase=s.step.kind;}
 }
 function tick(){
  cancelAnimationFrame(frame);if(!timer)return;const s=timer.read();if(s.done){const done=afterGuide;collectTime();if(done){afterGuide=null;done();}else finish(true);return;}
  const n=guideNodes;if(!n)return; if(pausedButton)pausedButton.textContent=s.running?'Pause':'Resume';
  if(lastIndex!==s.index){lastIndex=s.index;n.state.replaceChildren(node('span',s.step.group ? `${s.step.group.displayName}. ` : '','sr-only'),document.createTextNode(s.step.title));n.cue.textContent=s.step.cue;n.region.textContent=s.step.group?.displayName||'IN YOUR OWN TIME';n.caution.textContent=s.step.group?.contraindicationNote||'';n.visual.replaceChildren();
   if(s.step.group)n.visual.append(bodyHighlight(s.step.group));else if(['inhale','exhale'].includes(s.step.kind)){const orb=node('div',null,'support-breath-orb');orb.innerHTML='<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 25V85 M100 78L72 109 M100 78L128 109"/><path d="M85 80 Q53 67 36 133 Q30 167 75 157 Q90 150 86 125Z M115 80 Q147 67 164 133 Q170 167 125 157 Q110 150 114 125Z"/></svg>';n.visual.append(orb);}else n.visual.append(node('div','◌','ground-symbol'));
   audio.speak(s.step.title);
  }
  n.count.textContent=s.remaining;n.progress.value=reduced?Math.floor(s.progress*4)/4:s.progress;n.position.textContent=s.step.groupId?`${s.step.group.displayName} · round ${s.step.round+1}`:`${s.index+1} of ${timer.steps.length} gentle steps`;
  updateVisual(s);if(timer.clock.running)frame=requestAnimationFrame(tick);
 }
 function finish(completed){collectTime();session.completed=completed;session.endedEarly=!completed;page(completed?'Take a moment to notice.':'You can stop here.','Thanks for noticing. You can stop, switch approaches, or return to your normal activity.');rating(root,'How does it feel now?',v=>session.distressAfter=v);
  if(currentType==='breathing'&&completed)root.append(action('Continue for another minute?',()=>run(breathingPlan(),'breathing'),'primary'));
  root.append(action('Try another approach',()=>entry(true)),node('p','Nothing is shared with a clinician. Saving is optional and stores only the session type, timing, selected areas and optional ratings on this browser. Anyone using this browser profile may read it.','privacy-note'));
  const status=node('p',null,'subtle');status.setAttribute('role','status');root.append(action('Save this minimal summary on this device',()=>{try{saveSupportSummary(localStorage,session);status.textContent='Summary saved on this browser only. No thought content or narrative was collected.';}catch{status.textContent='This browser could not save the summary. You can finish without saving.';}}),status);footer(currentType==='pmr'?'pmr':currentType==='thought'?'thought':'grounding');
 }
 function safety(medical=false){
  collectTime();session.crisisEscalationShown=true;session.endedEarly=true;page("Let's get you connected to immediate support.",medical?'New or severe symptoms may need urgent medical care. Do not assume they are anxiety.':'If you might act on thoughts of harming yourself or someone else, or cannot stay safe, reach a person who can help now.');
  root.append(node('p','If there is immediate physical danger, a medical emergency, new/severe chest pain, fainting or severe breathing difficulty, contact your local emergency service now.','support-caution'));
  const label=node('label','Choose your country or region');const select=node('select');for(const [value,text]of [['','Choose a region'],['US','United States'],['UK','United Kingdom'],['IE','Ireland'],['other','Other country']]){const o=node('option',text);o.value=value;select.append(o);}label.append(select);root.append(label);
  const resources=node('div',null,'crisis-resources');const link=(text,href)=>{const a=node('a',text,'resource-action');a.href=href;if(href.startsWith('https')){a.target='_blank';a.rel='noopener noreferrer';}return a;};
  function draw(){resources.replaceChildren();if(select.value==='US')resources.append(link('Call 988','tel:988'),link('Text 988','sms:988'),link('Immediate danger or medical emergency: call 911','tel:911'),link('988 Lifeline website','https://988lifeline.org/'));else if(['UK','IE'].includes(select.value))resources.append(link('Call Samaritans: 116 123','tel:116123'),link(select.value==='UK'?'Immediate danger: call 999':'Immediate danger: call 112','tel:'+(select.value==='UK'?'999':'112')),link('Samaritans website','https://www.samaritans.org/how-we-can-help/contact-samaritan/'));else resources.append(link('Find a verified helpline for your country','https://findahelpline.com/'));}
  select.addEventListener('change',draw);draw();root.append(resources);
  root.append(action('Contact someone I trust',()=>{trusted.hidden=false;}));const trusted=node('div',"Call or message someone you trust and say: “I don't feel safe alone right now. Can you stay with me while I get support?” If you are a young person, contact a trusted adult nearby. Paasaa cannot send this message for you.",'privacy-note');trusted.hidden=true;root.append(trusted);
  root.append(node('p','Paasaa has not contacted anyone. This page is not monitored and cannot assess your risk. If safe to do so, move away from anything you might use to harm yourself or someone else and stay near another person.','subtle'));
  root.append(action('Back to support choices',()=>entry(true),'text-button'));
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{reduced=e.matches;if(timer){pause();renderGuide();pause();}});
 window.addEventListener('pagehide',pause);
 return {entry,pause,leave:pause,clear(){collectTime();session=newSupportSession();try{localStorage.removeItem(SUPPORT_KEY);}catch{return 'Could not remove support summaries. Clear this site’s data in browser settings.';}}};
}



