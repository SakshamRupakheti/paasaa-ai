# Conversational upgrade — October 5, 2026

This is an incremental extension of the existing application, not a new project or a clinically validated treatment. Production Vercel still serves a static preview with an explicit unavailable API. These changes do not connect Vercel to the authenticated backend.

## 1. Architecture inspected

Plain browser ES modules (`src/`), hash navigation, shared pale-blue CSS and Georgia/Segoe UI typography. Routes: chat, breathe, check-in, worry, support. Cloudflare Worker build bundles `server/api.js` and assets. Node preview uses a synthetic local owner and SQLite. Production storage is an owner-scoped D1 record store with optimistic revisions. Never deploy the synthetic local identity.

The existing free-chat engine already separates safety, planning, generation, validation and structural memory. A second, adaptive conversation state machine already supports confirmation, practical/hypothetical branches, probability/distress/severity/coping sliders, selected history, outcome follow-up and clinician-summary preparation. This increment joins these two experiences explicitly rather than duplicating either.

## 2–3. Changed and new files

Changed: `server/conversation-api.js`, `conversation-engine.js`, `engine-api.js`, `engine-memory.js`, `engine-prompts.js`, `engine-router.js`, `ai-config.js`; `src/chat.js`, `conversation-model.js`, `app.js`, `support.js`, `styles.css`; `scripts/serve.mjs`; `.env.example`.

Created: `server/conversation-modes.js`, `server/knowledge.js`, `src/chat-context.js`, `src/safety-resources.js`, `tests/conversation-upgrade.test.mjs`, this report, and the synthetic ordinary-conversation live evaluation in `evals/results/`.

## 4–6. Groq, configuration, routes

Existing `AIProvider` / `GroqProvider` remains the server-only boundary. Dedicated safety and planner models return validated schemas; generation returns a validated message. No API key enters browser assets. `GROQ_API_KEY` is required for model replies; optional `GROQ_MODEL` overrides reply/worksheet models. Existing `PAASAA_CONVERSATION_MODEL`, `PAASAA_PLANNER_MODEL`, `PAASAA_SAFETY_MODEL`, `GROQ_TEXT_MODEL`, and `GROQ_TRANSCRIPTION_MODEL` remain supported. `PORT` optionally changes the local preview port only.

No new API endpoints. Existing conversation turn requests now accept device `localContext`; values are bounded and validated, the day period is recomputed, and context is not a location or identity assertion. A persisted greeting flag prevents repeated time greetings. Existing consent is required before model calls. No paid provider fallback or automatic retries.

## 7. CBT integration

Free chat exposes explicit choices for NORMAL, CBT_SUPPORT, ACUTE_ANXIETY and SAFETY_ESCALATION behavior. Only a patient action enters CBT/settling; an LLM suggestion cannot write an answer or directly select a clinical transition. Switching to free chat preserves the worksheet position for return. Prediction confirmation, answer edits, optional questions, practical planning, unchanged/increased ratings, selected history, uncertainty and outcome review reuse the existing state machine.

State mapping: worry/prediction/actionability fields cover WORRY_CAPTURE/PREDICTION_CLARIFICATION/ACTIONABILITY; control/options/nextStep/actionWhen cover PRACTICAL_PROBLEM; rating and evidence fields cover INITIAL_RATINGS, CORE_FEARED_MEANING, EVIDENCE_FOR/AGAINST, WORST_CASE, COPING, REALISTIC_SCENARIO and REVISED_RATINGS; HISTORY/personalHistory cover PERSONAL_HISTORY/CALIBRATION; UNCERTAINTY, REVIEW_AT, SUMMARY and COMPLETE retain their existing roles. Focus choices provide shorter paths. No synthetic graph data or automatic positive reframe is added.

## 8. Safety

Existing local and model safety checks remain authoritative. Additional deterministic medical/urgent checks also guard worksheet turns. Pending safety cannot be bypassed through the chat-to-CBT handoff. Stopping/restarting and selecting listening cannot clear unresolved urgent concerns. Exercise refusals, grounding refusals, physical caution and driving constraints survive handoff. Approved resource URLs are centralized in `src/safety-resources.js`, reused in immediate support and the help dialog; country remains a user choice.

## 9–10. Voice and UI

Existing consent → recording/timer → server transcription → editable review → approval → composer flow is reused, including raw/approved separation. A Mic button opens it beside the composer. No recording is automatically started. New landing heading and starter chips recede after the first turn. Sent text appears immediately while waiting, with a simple thinking indicator; failures retain the draft and expose a manual retry. Keyboard sending, sliders, optional motion, shared design and mobile CSS are retained.

## 11. Persistence and knowledge

No SQL migration. New fields live within existing versioned JSON records (`mode`, `chatChoices`, `hasGreetedThisSession`, `cbtResume`). Unsent free-chat text remains in the tab. Clinical knowledge has document validation, category/tag retrieval, relevance filtering and bounded context. The production collection is deliberately empty pending qualified content review. No scraping, automatic training, invented clinician approval, or patient-data export was introduced.

## 12–14. Verification

All 152 automated tests pass. The prior 140-test suite was extended with device-time validation, one-time greetings, ordinary answers/failure handling, acute-choice overrides, sticky safety across worksheet/free-chat transitions, confirmed CBT handoff/resume, refused interventions, reviewed-document filtering, model configuration and typed stop/restart cases. Browser verification confirmed the greeting, same-conversation CBT handoff, prediction confirmation, and the Mic button opening consent without starting recording. Existing voice transport tests use synthetic fixtures; real microphone capture has not been retested.

Commands: `npm run check`; `node --test --test-reporter=dot tests/*.test.mjs`; `npm run build`; `node scripts/build-vercel.mjs`; `node scripts/evaluate-engine.mjs --live --only=ordinary conversation`. Initial network/build attempts failed under sandbox restrictions; authorized reruns succeeded. A live synthetic question returned “The capital of Nepal is Kathmandu.” from the model in 2,066 ms. This single live example is not a quality or safety validation.

## 15–17. Assumptions, outstanding work and review

Authenticated owner isolation and server-side keys are mandatory deployment dependencies. The Vercel backend remains unconnected; Supabase currently has no project. Local verification does not mean these capabilities are live at the Vercel URL. No HIPAA, end-to-end encryption or autonomous-treatment claims are made.

Remaining work: connect and verify production authentication/storage/Groq on Vercel; broader live multi-turn quality evaluation; real microphone/browser-device testing; clinician review of teen suitability, intervention scripts, escalation behavior and source material. The current heuristics can misclassify language. No token streaming, autonomous clinician sharing or new calibration graph was added. Stop controls pause after an in-flight response saves; they do not cancel server inference. A full clinical review and additional implementation/evaluation are still needed before the entire product brief can be considered complete.
