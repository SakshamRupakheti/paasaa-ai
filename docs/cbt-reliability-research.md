# CBT conversation reliability and research review

Date: October 19, 2026. Engineering prototype; not a clinical evaluation.

## Evidence from the reported failure

The screenshot shows a CBT definition, then “can you help me with CBT?”, then a generic unavailable reply. Code inspection locates that reply at the failed safety-assessment boundary. The screenshot alone cannot identify timeout, provider quota, or invalid output as the historical cause.

A fresh synthetic baseline with that history succeeded through all three model calls in 2,933 ms, but repeated a CBT definition and asked which part interested the user. This reproduced poor handoff, not the original outage. Raw production chats were not downloaded or used for training.

## Implemented change

- Narrow, complete-message CBT start/help requests offer the existing `reflect` action. Selection is still required; no answer is inferred or saved automatically. Existing answer-confirmation and safety gates remain.
- Extra disclosures, quotations, refusal, and recent/unresolved risk do not use this shortcut. This is product navigation, not a replacement for clinical assessment. The initial allowlist is English; broader and other-language messages retain the existing engine.
- Groq calls retry once for transient network/server failures or invalid structured output, within the original 12-second role budget. Short explicit Retry-After delays are honored; longer/unknown rate limits, authentication failures, refusals, and truncations are not retried. Retries can consume additional provider quota.
- Metrics contain role, model, attempt, status, latency, and available token count; no prompts, raw outputs, keys, or reasoning.

Groq documents that best-effort structured output can fail schema validation: [structured outputs](https://console.groq.com/docs/structured-outputs). This justifies a bounded retry, not assuming all outages are schema failures.

## Research recovered from the supplied ChatGPT conversation

The linked conversation contained references and an existing completed Undermind search with 217 relevant results. That is a discovery list, not 217 papers read or validated. SciSpace and Undermind were already available; no extra plugin was needed. The following is a selected evidence review, not a systematic review.

| Source and inspection | Finding and limitation | Paasaa decision |
|---|---|---|
| [LLM4CBT, Kim et al. 2025](https://doi.org/10.3389/fpsyt.2025.1583739), full-text sections | Instruction alignment and simulated dialogues assess therapist-like behavior; they do not establish symptom improvement or equivalence to professional care. | Keep explicit dialogue controls and evaluate transitions. Do not imitate endless questioning. |
| [CBTBench](https://arxiv.org/html/2410.13218v2), full-text sections | Knowledge, cognitive understanding, and response generation are distinct tasks; knowing CBT terminology does not establish good dialogue. | Score actual help and autonomy separately from definitions. |
| [Cactus](https://arxiv.org/html/2407.03103v2), methods, limitations, licensing | Synthetic multi-turn conversations support planning experiments. Simulated clients can be overly positive; expert review identifies remaining professional-quality gaps. Appendix F.3 establishes non-commercial scientific use, not commercial clearance. | Study design; do not import the corpus into commercial training without separate rights review. |
| [Preference Learning Unlocks LLMs’ Psycho-Counseling Skills](https://arxiv.org/abs/2502.19731), abstract | Preference comparisons improve measured response quality; comparative model scores are not patient outcomes. | Consider preferred/rejected pairs after independent human review, not automatic approval. |
| [Tahir et al., fine-tuning feasibility](https://arxiv.org/html/2412.00251v2), full-text sections | Synthetic depression-CBT dialogues and QLoRA improve judge-rated performance in simulations; coherence and evaluation bias remain limitations. | Small-model fine-tuning is a feasible experiment, not evidence that training will fix runtime failures or provide effective care. |
| [MindEval](https://arxiv.org/html/2511.18491v3), full-text sections, preprint | Multi-turn quality can degrade with longer or more severe scenarios. Simulated users and model judges limit validity; imminent self-harm/violence is excluded. | Add continuity tests; maintain a separate safety evaluation. |
| [MindGuard](https://arxiv.org/html/2602.00950v1), full-text sections, preprint | Contextual guardrail classification studies false positives and risk recall using synthetic development and expert evaluation. | Compare both false alarms and missed risk before changing classifiers. No production classifier replacement in this change. |
| [Increasing engagement with CBT using generative AI, McFadyen et al. 2026](https://doi.org/10.1038/s43856-025-01321-8), abstract via Undermind; publisher full text unavailable | Six-week unblinded RCT, 540 US adults with elevated anxiety/depression symptoms: more engagement than workbooks, without an overall advantage in symptom reduction. | Track useful completion separately from symptom outcomes. Adult results do not establish teen suitability or Paasaa efficacy. |
| [coTherapist](https://doi.org/10.1145/3774904.3792988), abstract only | Small-model alignment, retrieval, and expert-facing evaluation; abstract alone is insufficient to audit protocol or safety claims. | Candidate for full-text review; not an approved deployment or dataset source. |

Paper access licenses do not automatically license datasets, teacher outputs, or model weights. None of these sources is newly cleared for training or added to live clinical retrieval. Clinical, adolescent, and native-language reviews remain pending.

## Next model experiment

Compare the current system, a prompt-only candidate, and a future licensed fine-tuned candidate on independently authored, frozen multi-turn cases. Include direct help requests, short answers, corrections, repeated-question fatigue, refusal, plausible worries, indirect risk, medical symptoms, and English/Hindi/Nepali/Spanish. Current regression cases are development tests, not a held-out benchmark.

Rate context accuracy, practical clarity, autonomy, appropriate CBT handoff, repetition, unsupported claims, and risk handling separately. Record unavailable-reply rate, latency, and provider calls as engineering metrics. Use blinded qualified human review; a model judge is supplementary. Do not claim clinical benefit from a preference score or test pass rate.

The existing 100-scenario/300-candidate research pilot remains untrained and unapproved. Complete source permissions and independent clinical/native-language review before exporting training targets. No paid GPU, new base model, production transcript collection, or weight-training run was started.

## Reproduction

`node --test tests/cbt-entry.test.mjs tests/ai-provider-retry.test.mjs` exercises the exact handoff, mixed/previous risk, explicit worksheet selection, transient recovery, and non-retryable failures. Run `npm run check`, `npm test`, and `npm run build` for repository checks. Browser verification must include sending the request and selecting the reflection, not only reading a generated reply.

Measured on October 19: all 280 Node tests passed (15 new), syntax checks and build passed. In a new synthetic local conversation, sending the reported request displayed the reflection button; selecting it opened the worry prompt; submitting a synthetic presentation worry advanced to the prediction prompt. No browser console errors were captured. Local preview uses the existing SQLite synthetic account, not a production patient account. Screenshot: `work/cbt-entry-verified.png` (ignored local artifact). These checks verify the integration, not therapeutic quality or efficacy. No weight-training run occurred.
