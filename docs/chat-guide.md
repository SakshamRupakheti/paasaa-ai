# Paasaa conversational guide

Implemented October 1, 2026 in the existing application. Route: `#chat` (Talk to Paasaa).

## What the guide does

- Answers short self-help and worksheet questions through Groq, after explicit consent.
- Offers app-controlled buttons for breathing, immediate support, daily check-in and worry exploration. The model cannot supply destination URLs.
- Completes daily check-ins and both practical and hypothetical worry branches inside the conversation, using structured controls and explicit answer confirmation.
- Shows editable review before completion. Worry records are the same authenticated records shown on the existing worry page. Daily check-ins use the same in-memory/browser store as the existing check-in page.
- Keeps the conversational question box separate from worksheet answers: an explanation request cannot silently become a worksheet answer.
- Leaves prediction probabilities to the user. Does not calculate forecasts or force a lower re-rating.

## Architecture and storage

`src/chat.js` owns presentation and conversation state. `src/chat-checkin.js` maps the original daily check-in fields/scales into questions. `createCheckIn` exposes a small adapter over its existing store. `src/worry-model.js` remains the authority for worry question ordering and branching. Worry answer, revision, completion and safety checks remain in `server/api.js`.

`POST /api/chat` requires the authenticated Sites user header, same-origin request, explicit consent, bounded conversation/context and the shared per-account AI rate limit. `server/chat.js` supplies a fixed exercise/source catalogue and validates the structured Groq response. The AI cannot execute writes. `server/ai.js` keeps credentials on the server. Free-tier throttling does not trigger retries, account upgrades or another provider.

Conversation messages remain in tab memory and are not written to the app database. Asking the AI sends up to 12 recent messages and up to 8,000 characters of the active worksheet context to Groq. Answers are sent only through this consented question action; completing a worksheet does not require AI. Groq's own retention terms still apply. Raw voice transcription remains a separate consented flow with editable review; chat does not introduce a second voice recorder.

Daily check-in: tab-only or opt-in device storage; existing records are reused. Worry: private account storage, optimistic revisions, preserved text on failures. Unconfirmed input stays in memory; leaving a worry sends a draft save. A browser reload warning protects unsaved text. Chat does not introduce new tables or a duplicate patient record.

## Safety and limitations

The guide is clearly labeled AI self-help, not a therapist, diagnosis service or crisis monitor. Fixed routing hints and model safety flags interrupt normal chat advice and display human-support options. They are imperfect routing aids, not validated risk detection. No one is automatically contacted. Prompts prohibit diagnostic/medication decisions, invented history, certainty about predictions, and secrecy from safe adults. Link validation and output checks are defense in depth, not proof of clinical safety.

Clinical review remains pending, particularly for ages 13–17. NHS/CCI educational references explain components; neither validates Paasaa's AI, this exact workflow or its suitability for minors. Saved worry outcome reviews remain on the existing worry page. This initial conversational surface does not autonomously extract multiple answers from an unrestricted message or forecast the user's future.

## Verification

- 40 automated tests: existing breathing, support, check-in and worry behavior, plus Groq transport, chat consent/authentication, allowlisted links, malformed output rejection, high-risk routing, scale validation and direct routing.
- Live synthetic Groq request in the browser: CBT question answered, with real worry/breathing actions and educational source links.
- Browser: completed a tab-only daily check-in with a 4/10 rating; reviewed answers and confirmed completion.
- Browser: completed a synthetic practical worry inside chat; verified the resulting reflection appears on the existing worry page.
- No real patient examples used. Voice transcription has transport tests but has not been live-tested with recorded speech.

Before wider access: clinical and safeguarding review, representative adversarial safety evaluation, privacy/retention policy and account-data deletion controls, and tested age-appropriate consent. Keep the current owner-only audience while these are unresolved.
