// Copy selection, not diagnosis or a substitute for the safety assessment.
// Keep this deliberately narrow: present first-person distress, not history,
// a definition, quoted text, or someone else's experience.
export function isCurrentPanic(message='') {
  const t=message.toLowerCase().replace(/[’]/g,"'");
  return t.split(/[.!?;\n]+/).some(part=>{
    const s=part.trim().replace(/^(?:help(?: me)?|please|hey|paasaa|right now)[,: ]+/,'');
    if(/["“”]/.test(s)||/\b(?:not|was|had|yesterday|last night|earlier|used to|no longer|example|said|says)\b/.test(s))return false;
    return /^(?:i(?:'m| am)? (?:having|experiencing) (?:a |another )?(?:panic|anxiety) attack|i(?:'m| am) panicking|i (?:think|feel like) i(?:'m| am) having (?:a |another )?panic attack)\b/.test(s);
  });
}

export function panicSupportMessage(memory={}) {
  const acknowledgement='That sounds frightening. You do not need to explain everything right now.';
  const boundary='If you have new or severe chest pain, severe trouble breathing, or feel faint, seek urgent medical help; I cannot tell what is causing the symptoms here.';
  const next=memory.wantsAdvice===false
    ?'We can leave exercises out.'
    :'If you can, ask a safe person nearby to stay with you. You do not have to do a breathing exercise.';
  return `${acknowledgement} ${next} ${boundary}`;
}
