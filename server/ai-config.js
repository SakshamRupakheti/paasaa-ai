// Server-only configuration. No provider credentials or model settings enter UI assets.
export function aiConfig(env={}) {
  return Object.freeze({provider:env.PAASAA_AI_PROVIDER||'groq',
    conversationModel:env.PRIMARY_MODEL||env.GROQ_MODEL||env.PAASAA_CONVERSATION_MODEL||'openai/gpt-oss-120b',
    plannerModel:env.FAST_MODEL||env.PAASAA_PLANNER_MODEL||'openai/gpt-oss-20b',
    safetyModel:env.SAFETY_MODEL||env.PAASAA_SAFETY_MODEL||'openai/gpt-oss-safeguard-20b',
    embeddingModel:env.EMBEDDING_MODEL||null,
    legacyModel:env.GROQ_MODEL||env.GROQ_TEXT_MODEL||'openai/gpt-oss-20b',
    transcriptionModel:env.GROQ_TRANSCRIPTION_MODEL||'whisper-large-v3-turbo',
    timeoutMs:12000,maxOutputTokens:1600,retryPolicy:{maxRetries:1},
  });
}
