// Exercise permission is separate from a general wish for advice or support.
export function exerciseRequest(message,previousReply=''){
  const t=message.toLowerCase().replace(/[’]/g,"'");
  if(/\b(?:no|don't|do not|stop|not now|not ready|already tried)\b/.test(t))return null;
  const family=text=>/breath/.test(text)?'breathing':/ground|surroundings/.test(text)?'grounding':/muscle|pmr|relaxation|release/.test(text)?'pmr':/exercise/.test(text)?'any':null;
  if(/\b(?:please|let's|can we|could we|i want|i'd like|help me|guide me|show me|start|try)\b/.test(t)&&family(t))return family(t);
  // A bare yes is meaningful only after a specific, immediately preceding offer.
  const offer=previousReply.toLowerCase();
  if(/^(?:yes|yeah|sure|okay|ok|let's do it|yes please)[.!\s]*$/.test(t)&&/\?\s*$/.test(offer)&&/would you like|want to try|shall we|would you prefer/.test(offer))return family(offer);
  return null;
}

export function dialogueContext(session,message){
  const recent=(session.transcript||[]).slice(-12);
  const assistants=recent.filter(t=>t.role==='assistant');
  const questionStreak=assistants.slice(-2).length===2&&assistants.slice(-2).every(t=>t.text.includes('?'));
  const correction=/you misunderstood|that.s not what i|i meant|no,? i mean/i.test(message);
  const approachRejected=/already (?:tried|did|sent)|didn.t help|not helping|didn.t work|that won.t work/i.test(message);
  return {questionStreak,correction,approachRejected,previousReply:assistants.at(-1)?.text||''};
}
