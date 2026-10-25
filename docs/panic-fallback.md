# Panic support during AI failures — October 13, 2026

The reported screenshot matches the engine's ordinary outage copy: when the safety classifier fails and local danger markers are absent, a message such as “i am having a panic attack” previously received only a retry instruction. The historical provider error is not recoverable from the screenshot. One synthetic live Groq check succeeded across safety, planning, and response generation, so this investigation does not establish that Groq is permanently unavailable or identify the original failure code.

The engine now recognizes a narrow set of current first-person English panic disclosures for fallback copy selection. If classification, planning, or response generation fails (or AI is off/unconfigured), it provides bounded scripted acknowledgment, an optional nearby-person support step, and conditional medical guidance. It never labels symptoms as definitely anxiety, forces breathing, starts an exercise, or replaces urgent/safety-clarification routes. Unresolved safety context retains higher priority. The UI provides a direct button to the existing human-support screen and discloses scripted support.

The live synthetic probe also exposed a wording-validation gap: generated “noticing five…” and “breathing slowly” instructions could bypass the existing exercise guard. Those variations now reject into the existing fallback, rather than starting an unapproved exercise through prose.

## Verified

- 257 Node tests pass, including timeout, rate limit, upstream failure, request rejection, malformed output, AI-off, refused exercises, urgent medical signs, self-harm clarification, unresolved context, and generated exercise wording.
- `npm run check` and `npm run build` pass.
- Browser at local port 4192, with AI disabled for verification: exact reported message renders the scripted reply and button. Clicking the button opens the existing human-support screen. Test used a separate synthetic local conversation.
- Local preview restarted with the existing AI configuration after verification. No production deployment is claimed by these checks.

## Limits

This is outage resilience, not a clinically validated panic detector. Matching is deliberately narrow and English-only; history, negation, quotations, and third-person discussion are excluded. It can miss phrasing variants. An unavailable model assessment remains `UNCERTAIN`; the fallback does not certify safety. Existing medical/safety detection also has limitations. Native-language and clinician review remain pending. No provider switch, training, patient-data import, or treatment-efficacy claim is part of this change.
