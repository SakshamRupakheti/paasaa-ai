import {INTERVENTIONS} from './chat-interventions.js';
import {bodyHighlight,evidence} from './support-ui.js';
import {GuidedTimer} from './support-model.js';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export function mountChatExercise(root,action,onAction){
  const item=INTERVENTIONS[action.interventionId];
  if(!item||!['START_PMR_STEP','START_BREATHING','START_GROUNDING'].includes(action.type))return ()=>{};
  const timer=new GuidedTimer(item.instructions);let frame,disposed=false,started=false,last=-1;
  root.className='chat-exercise';
  const title=el('h3',item.title),cue=el('p','Go at your own pace. You can pause, skip, or stop.'),clock=el('output'),progress=el('progress');progress.max=1;progress.value=0;progress.setAttribute('aria-label','Exercise progress');
  const body=el('div',item.instructions[0].group?.displayName||item.title);body.className='exercise-body-region';body.setAttribute('aria-hidden','true');
  const controls=el('div');const make=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;controls.append(b);return b;};
  const toggle=make('Begin',()=>{if(timer.clock.running){timer.pause();cue.textContent='Paused. Let any tension go; breathe at your own pace.';toggle.textContent='Continue';}else{started=true;timer.start();last=-1;toggle.textContent='Pause';tick();}});
  const finish=type=>{timer.pause();disposed=true;cancelAnimationFrame(frame);onAction({action:type});};
  make('Skip',()=>finish('exerciseSkip'));make('Stop',()=>finish('exerciseStop'));
  const illustration=item.family==='pmr'?bodyHighlight(item.instructions[0].group):el('div');illustration.classList.add('chat-exercise-figure');root.append(title,illustration,body,cue,clock,progress,controls,el('p',item.family==='pmr'?'Gently, never enough to hurt. Skip painful or injured areas; stop for dizziness or discomfort. Keep breathing normally.':'Stop if this feels uncomfortable or makes symptoms worse. You do not need to match the timer.'));
  evidence(root,item.family==='pmr'?'pmr':item.family==='breathing'?'breathing':'grounding');
  function tick(){if(disposed)return;const state=timer.read();if(state.done){finish('exerciseDone');return;}if(last!==state.index){cue.textContent=state.step.cue;last=state.index;body.textContent=state.step.group?.displayName||item.title;if(state.step.group){illustration.replaceChildren(...bodyHighlight(state.step.group).childNodes);}}clock.textContent=state.remaining+' seconds';progress.value=state.progress;if(state.running)frame=requestAnimationFrame(tick);}
  // No visual animation is needed to follow the exercise; the progress indicator
  // has no CSS transition and works with reduced-motion preferences.
  const hide=()=>{if(document.hidden&&started){timer.pause();cancelAnimationFrame(frame);cue.textContent='Paused. Let any tension go.';toggle.textContent='Continue';}};document.addEventListener('visibilitychange',hide);
  return ()=>{disposed=true;timer.pause();cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hide);};
}
