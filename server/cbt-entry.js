// A narrowly allowlisted product-navigation request, not clinical assessment.
// Additional disclosure, negation, quoted text, and prompt instructions do not match.
export function isCbtEntryRequest(message){
  const t=message.trim().toLowerCase().replace(/’/g,"'").replace(/[.!?]+$/,'').trim();
  return /^(?:(?:can|could|would) you (?:please )?help me (?:with|do|start)|(?:please )?help me (?:with|do|start)|(?:can|could) we (?:please )?(?:do|try|start)|let's (?:do|try|start)|i (?:want|would like) to (?:do|try|start)) (?:cbt|cognitive behavio(?:u)?ral therapy)(?: please)?$/.test(t);
}

export const CBT_ENTRY_MESSAGE='Yes—we can work through one worry together using a CBT-based reflection, here in the chat. We’ll look at what happened, what you’re predicting, and a next step you choose. Select “Start CBT reflection” when you’re ready; you can pause or skip parts.';
export const CBT_ENTRY_CHOICES=[{id:'reflect',label:'Start CBT reflection'}];
