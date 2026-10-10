import {EVIDENCE} from './support-content.js';
export const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
export const action=(text,fn,cls)=>{const b=node('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
export function choices(root,items){const list=node('div',null,'support-choices');for(const [text,fn]of items)list.append(action(text,fn));root.append(list);return list;}
export function evidence(root,key){const e=EVIDENCE[key]||EVIDENCE.grounding;const d=node('details',null,'support-evidence');d.append(node('summary','Why might this help?'));d.append(node('p',e.explanation));for(const [label,url]of e.sources){const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';const p=node('p');p.append(a);d.append(p);}d.append(node('p','Content draft · Needs clinician review, especially for ages 13–17.','subtle'));root.append(d);}
export function rating(root,label,onChange){const details=node('details');details.append(node('summary',`${label} (optional)`));const l=node('label','Choose a number, or leave unanswered.');const input=node('select');const blank=node('option','Unanswered');blank.value='';input.append(blank);for(let i=0;i<=10;i++){const o=node('option',`${i}${i===0?' · not intense':i===10?' · extremely intense':''}`);o.value=String(i);input.append(o);}input.setAttribute('aria-label',label);input.addEventListener('change',()=>onChange(input.value===''?null:Number(input.value)));l.append(input);details.append(l);root.append(details);}
export function bodyHighlight(group=null){
 const holder=node('div',null,'support-body');
 holder.innerHTML='<svg viewBox="0 0 220 380" role="img" aria-label="Body awareness guide"><circle cx="110" cy="40" r="25" fill="#e0b998"/><path d="M99 63 L99 80 L121 80 L121 63" fill="#dbb392"/><path d="M99 78 Q68 74 59 111 L40 190 L50 197 L78 130 L77 225 L84 337 L100 337 L110 247 L120 337 L136 337 L143 225 L142 130 L170 197 L180 190 L161 111 Q152 74 121 78Z" fill="#c5ddea" stroke="#91b2c9" stroke-width="2"/><path d="M40 187 L33 207 Q36 219 48 211 L54 195 M180 187 L187 207 Q184 219 172 211 L166 195 M84 337 L72 351 Q71 361 101 357 L100 337 M120 337 L119 357 Q149 361 148 351 L136 337" fill="#dfb795" stroke="#b4a797"/><path d="M95 40 Q99 44 104 40 M116 40 Q121 44 125 40 M104 54 Q110 57 116 54" fill="none" stroke="#947d70"/><g class="support-highlight" fill="#6faac8" stroke="#3d789c" stroke-width="1.5" opacity=".65"></g></svg>';
 const svg=holder.querySelector('svg'),highlight=holder.querySelector('g');
 const spots={forehead:[[110,28,19,8]],cheeks:[[110,43,21,9]],jaw:[[110,56,16,8]],neck:[[110,72,11,10]],shoulders:[[110,97,43,15]],stomach:[[110,183,26,22]],forearm:[[52,167,10,25],[168,167,10,25]],biceps:[[70,122,11,22],[150,122,11,22]],thigh:[[94,250,12,26],[126,250,12,26]],calf:[[92,303,9,23],[128,303,9,23]],foot:[[87,348,15,8],[133,348,15,8]]};
 const region=group?.bodyRegion;let circles=spots[region]||[];if(group?.side&&circles.length===2)circles=[circles[group.side==='right'?0:1]];
 for(const [cx,cy,rx,ry]of circles){const shape=document.createElementNS('http://www.w3.org/2000/svg','ellipse');for(const [k,v]of Object.entries({cx,cy,rx,ry}))shape.setAttribute(k,v);highlight.append(shape);}
 svg.setAttribute('aria-label',group?`${group.displayName}: highlighted area`:'Body awareness guide');
 return holder;
}
// Use only browser-reported local voices. No remote TTS provider is contacted.
export class CalmAudio {
 constructor(){this.enabled=false;this.synth=globalThis.speechSynthesis;}
 available(){return this.synth?.getVoices().find(v=>v.localService&&v.lang.startsWith('en'));}
 speak(text){this.cancel();if(!this.enabled)return;const voice=this.available();if(!voice)return;const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.rate=.85;this.synth.speak(u);}
 cancel(){this.synth?.cancel();}
}
