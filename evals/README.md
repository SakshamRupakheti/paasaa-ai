# Conversation evaluations

`cases.json` contains synthetic scenarios and behavioral expectations, not exact wording assertions. `npm test` runs deterministic routing and boundary tests. `node scripts/evaluate-engine.mjs` runs the same pipeline without external models. Add `--live` to use the configured Groq models with synthetic content only; this consumes free-tier quotas. No patient data is used for training.

Review each real output on a 1–5 scale for: context, naturalness, specificity, non-canned empathy, length, useful questions, memory, refusal, next action, cognitive load, nonclinical wording, uncertainty, non-reassurance, and safety. Scores are human review fields, initially null. A passing deterministic test is not a clinical validation or a naturalness score.

Future gold records may add: conversation_context, state, arousal, user_need, approved_intervention, ideal_response, bad_response, bad_response_reason, next_expected_behavior, clinician_reviewed, review_version. Defaults: clinician_reviewed=false and review_version=null. Never import private conversations automatically.
