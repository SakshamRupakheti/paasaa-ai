import { BreathClock } from './breathing.js';
export function pmrPlan(groups,{awareness=false,rounds=1}={}) {
 return groups.flatMap(g=>Array.from({length:rounds},(_,round)=>[
  {groupId:g.id,group:g,round,kind:awareness?'notice':'tense',seconds:awareness?5:g.tenseSeconds,title:awareness?'Notice this area':'Gently tense',cue:awareness?'Notice this area and allow it to soften if comfortable.':g.instruction},
  {groupId:g.id,group:g,round,kind:'release',seconds:g.releaseSeconds,title:'Let go.',cue:'Notice the difference. You do not need to force relaxation.'}
 ]).flat());
}
export function breathingPlan(cycles=6) {return Array.from({length:cycles},()=>[
 {kind:'inhale',seconds:4,title:'Breathe in gently.',cue:'A comfortable breath matters more than matching the timer.'},
 {kind:'exhale',seconds:6,title:'Let it out slowly.',cue:'No breath hold. No need to take a large breath.'}
]).flat();}
export const groundingPlan=()=>[
 {kind:'ground',seconds:20,title:'Notice your surroundings.',cue:'Look for three shapes or colors around you. Keep your eyes open if comfortable.'},
 {kind:'ground',seconds:20,title:'Notice what supports you.',cue:'Feel the chair or floor supporting you. No need to change your breathing.'},
 {kind:'ground',seconds:20,title:'Choose one small next step.',cue:'You can return to an ordinary activity without checking whether you are completely calm.'}
];
export const thoughtDestination = choice => choice === 'unwanted' ? 'thought-support' : 'safety';
export class GuidedTimer {
 constructor(steps,now=()=>performance.now()){this.steps=steps;this.index=0;this.clock=new BreathClock(now);this.totalMs=0;this.done=!steps.length;}
 get step(){return this.steps[this.index];}
 start(){if(!this.done)this.clock.start();}
 pause(){this.clock.pause();}
 read(){
  if(this.done)return {done:true};
  const ms=this.clock.read(),duration=this.step.seconds*1000;
  if(ms>=duration){this.totalMs+=duration;this.clock.reset();this.index++;this.done=this.index>=this.steps.length;if(this.done)return {done:true};this.clock.start();return this.read();}
  return {done:false,step:this.step,index:this.index,remaining:Math.ceil((duration-ms)/1000),progress:ms/duration,running:this.clock.running};
 }
 skipGroup(){if(this.done)return;this.totalMs+=this.clock.read();const id=this.step.groupId;this.clock.reset();do{this.index++;}while(id&&this.index<this.steps.length&&this.steps[this.index].groupId===id);this.done=this.index>=this.steps.length;if(!this.done)this.clock.start();}
 repeatGroup(){if(this.done)return;this.totalMs+=this.clock.read();const id=this.step.groupId;while(this.index>0&&id&&this.steps[this.index-1].groupId===id)this.index--;this.clock.reset();this.clock.start();}
 get durationSeconds(){return Math.round((this.totalMs+this.clock.read())/1000);}
}
export function newSupportSession(){return {schemaVersion:1,supportSessionId:crypto.randomUUID(),patientId:null,timestamp:new Date().toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,entryReason:null,environmentMode:null,interventionType:null,muscleGroups:[],skippedMuscleGroups:[],breathingMode:null,durationSeconds:0,distressBefore:null,distressAfter:null,completed:false,endedEarly:false,crisisEscalationShown:false,userRequestedClinicianSharing:false};}
export const SUPPORT_KEY='paasaa.support-summaries.v1';
// Explicit allowlist: never persist arbitrary UI state, narratives, or thought content.
export function summaryRecord(session){const keys=Object.keys(newSupportSession());return Object.fromEntries(keys.map(k=>[k,session[k]]));}
export function saveSupportSummary(storage,session){
 const raw=storage.getItem(SUPPORT_KEY);const records=raw?JSON.parse(raw):[];
 if(!Array.isArray(records))throw Error('Saved summaries could not be read.');
 const record=summaryRecord(session);storage.setItem(SUPPORT_KEY,JSON.stringify([...records.filter(r=>r.supportSessionId!==record.supportSessionId),record].slice(-100)));return record;
}

