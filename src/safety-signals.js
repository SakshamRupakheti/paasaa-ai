// Conservative routing hints, not a risk assessment. The visible safety control remains available.
export function safetySignal(text='') {
  return /\b(suicid\w*|kill myself|end my life|hurt myself|hurt someone|overdos\w*|can't stay safe|cannot stay safe|in immediate danger|being abused|being attacked|threaten(?:ing|ed) to kill|hearing voices|voices telling me|can't breathe|cannot breathe|severe chest pain|don't know where i am|do not know where i am)\b/i.test(text);
}
export const SAFE_PAUSE='Let’s pause the worry exercise. This may need human support rather than examining probabilities. Paasaa has not contacted anyone.';
