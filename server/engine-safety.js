import {safetySchema,validate} from './engine-schemas.js';
import {SAFETY_PROMPT} from './engine-prompts.js';
export const emptySafety=()=>({riskLevel:'none',category:'none',intentDetected:false,planDetected:false,immediacyDetected:false,meansMentioned:false,cannotStaySafe:false,needsSafetyQuestion:false,needsEmergencyPath:false,confidence:0});
export function localSafety(message,memory={}) {
  const s=emptySafety(),t=message.toLowerCase().replace(/[’]/g,"'");
  const unwanted=memory.intrusiveThoughtPresent||/intrusive|unwanted|don't want (?:these|them|to)|do not want|terrified.*thought|hate.*thought|what if/i.test(t);
  const medical=/chest pain.{0,65}(severe|different|new)|(?:severe|different|new).{0,40}chest pain|can't breathe|cannot breathe|overdos|passed out|stroke symptoms|severe bleeding/i.test(t);
  const cannot=/can't (?:keep myself |stay )safe|cannot (?:keep myself |stay )safe|(?:don't|do not) know (?:whether|if).*keep myself safe|unable to stay safe/i.test(t);
  const intent=/(?:i(?:'m| am)? (?:going to|planning to|plan to|intend to|will|want to)).{0,35}(?:kill|stab|shoot|hurt|end my life)|(?:kill myself|end my life).{0,25}(?:tonight|now|today)/i.test(t);
  const danger=/being attacked|in immediate danger|threatening to kill me/i.test(t);
  const harm=/suicid|self.harm|hurt myself|kill myself|end my life|(?:hurt|kill|stab|shoot).{0,25}(?:someone|somebody|him|her|mother|father|them)|weapon/i.test(t);
  if(medical||cannot||intent||danger){Object.assign(s,{riskLevel:'urgent',category:medical?'medical':danger?'abuse_or_danger':cannot||/myself|my life/.test(t)?'self_harm':'harm_to_others',intentDetected:intent,planDetected:/plan|tonight|bought/.test(t)&&intent,immediacyDetected:true,meansMentioned:/weapon|knife|gun|pills/.test(t),cannotStaySafe:cannot,needsEmergencyPath:true,confidence:.95});}
  else if(harm){Object.assign(s,{riskLevel:unwanted?'monitor':'clarify',category:/myself|my life|suicid|self.harm/.test(t)?'self_harm':'harm_to_others',needsSafetyQuestion:!unwanted,confidence:.65});}
  if(memory.unresolvedUrgent&&!s.needsEmergencyPath)Object.assign(s,memory.unresolvedUrgent);
  return s;
}
export async function classifySafety(provider,message,recent,memory={}) {
  const baseline=localSafety(message,memory);
  if(baseline.needsEmergencyPath)return {safety:baseline,source:'local'};
  if(!provider)return {safety:baseline,source:'local'};
  try {
    const result=validate(safetySchema,await provider.classifySafety(SAFETY_PROMPT,{message,recent:recent.slice(-4),unresolvedSafety:memory.safetyPending||false},safetySchema));
    const onlyRefusal=/^(?:don.t make me breathe|just talk to me,? no exercises|no exercises|no breathing|stop asking me questions)[.! ]*$/i.test(message);
    if(onlyRefusal&&!memory.safetyPending&&!recent.some(t=>localSafety(t.text||'').riskLevel!=='none'))return {safety:baseline,source:'local+model'};
    if(result.cannotStaySafe||result.needsEmergencyPath||result.riskLevel==='urgent'){result.riskLevel='urgent';result.needsEmergencyPath=true;}
    if(result.needsSafetyQuestion)result.riskLevel='clarify';
    // Local ambiguity cannot be silently dismissed by the model.
    if(baseline.riskLevel==='clarify'&&['none','monitor'].includes(result.riskLevel))return {safety:baseline,source:'local+model'};
    return {safety:result,source:'model'};
  }catch{return {safety:baseline,source:'fallback',failed:true};}
}
export const crisisMessage=category=>category==='medical'?'These symptoms need urgent medical attention; I cannot tell whether they are anxiety. Contact local emergency services or urgent medical help now. Paasaa has not contacted anyone.':'Please reach someone who can help you stay safe now: local emergency services, a crisis service, or a safe trusted person nearby. If you can do so safely, put distance between yourself and anything you could use to cause harm. Paasaa has not contacted anyone.';
