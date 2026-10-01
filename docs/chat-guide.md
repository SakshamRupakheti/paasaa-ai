# Talk to Paasaa: adaptive conversation

Redesigned October 1, 2026 around **STABILIZE → UNDERSTAND → WORK THROUGH → LEARN**, on the existing `#chat` route. The Daily check-in, breathing, worry-record and immediate-support pages remain available in navigation.

## Experience

One spacious, open Paasaa response is the working surface. A subtle patient card and expandable earlier conversation provide context. Choice chips, editable prediction, optional 0–100 slider, grounding cue, evidence review or outcome controls appear only when relevant. No exercise directory or second generic question box interrupts the conversation.

Readiness is a preference, not a diagnosis. Explicit reflection choice wins over an overwhelmed hint. Settling offers physical, surroundings or expression approaches, one intervention at a time; breathing is optional. Failed/declined approaches are tracked. Breathing refusal persists through restart and going back. Pause, another way, restart, reflection and end controls remain available. There is no distress threshold for reflection.

A worry becomes an editable, confirmed prediction. Practical concerns take a short planning branch. Uncertain concerns keep probability and distress distinct, then offer evidence, coping or a brief reflection path. Already confirmed fields are skipped. AI-extracted extra details are proposed for editing/confirmation; clarification questions are not stored as evidence. Re-ratings may rise, fall or remain the same without praise for reductions. Remaining uncertainty leads toward a patient-owned next step rather than endless argument.

Repeated-worry candidates use matching words in the user's own completed records. Similarity is a heuristic, so the UI asks whether something changed rather than asserting sameness. Previous reflection, changed circumstances, attention shift and ending are available. Personal-history comparisons use only records the user selected; aggregates require at least five resolved yes/no outcomes, excluding partial/unclear results. No generic research statistic becomes a personal probability.

## Architecture and persistence

- `src/conversation-model.js`: deterministic states, legal progression, intervention tracking, optional branches, minimal context and reflection mapping.
- `server/conversation-api.js`: authenticated, owner-isolated `/api/conversations` and per-session `draft`, `turn`, `consent`, `edit` operations. Same-origin mutation checks and optimistic revisions protect writes. Sessions reuse the existing D1 records table with kind `conversation`; no schema migration is needed.
- `server/conversation-ai.js`: Groq structured output (assistant message/action, suggested state, extracted data, UI, reason and confirmation flag, plus readiness/feedback hints). The server rejects fabricated controls or transitions. Patient choices remain authoritative. Model input contains the current state, allowed profile context, worry/prediction, ratings/evidence, selected outcomes, short recent context, last message, tried/declined approaches and safety state.
- `src/chat.js`: active-turn rendering, debounced draft saves, queued revisions, voice review, resumption, summary edits and due reviews.

Conversations and drafts now persist to the private account, replacing the previous chat's tab-only retention. AI wording is opt-in, with a separate voice-transcription consent. Relevant context is sent to Groq, not the full record archive. Raw transcript, optional cleaned transcript (currently null) and patient-approved text stay distinct. Audio is not stored by Paasaa. A reviewed completed conversation is mirrored into the existing worry record list; conversation revision is claimed before the mirror write. If that mirror fails, the UI states that the full saved conversation remains available. Clinician sharing remains off.

Outcome reviews are **in-app scheduled reviews**, not push, email or SMS reminders. A chosen local date/time is stored as an ISO due time. Returning to the conversation page surfaces a due review; users can also record an outcome early. Outcome result, actual severity when relevant, coping description and learning join the person's own history. If the prediction is not observable, no review is required.

## Safety and limits

Configured urgent-language hints and model safety flags pause ordinary reflection and route to existing human-support resources. The same check covers edited prediction/details. Ending remains possible; resuming an escalated session returns to support, not probability debate. No one is contacted automatically. These are unvalidated routing aids, not a risk assessment or clinical service. Clinical and safeguarding review, especially for teens, remains pending. Prompt constraints and tests do not guarantee model safety.

The NHS thought-record and CCI worry/uncertainty resources support educational components, not this combined flow's efficacy. Gentle breathing is optional and comfortable; there is no claim that the app's pacing or settling flow reproduces a studied protocol. Source links and limits are available under Privacy, AI & sources.

## Verification

66 automated tests pass, including the 26 new simulations in `tests/conversation.test.mjs`: readiness, overwhelm, refusal/failure of breathing/grounding, one-word responses, restart, bounded clarification, practical/hypothetical/mixed concerns, unchanged/higher ratings, absent counter-evidence, likely events, repeated worries, selected/no history, unresolved uncertainty, outcome scheduling, speech approval metadata, reload persistence, owner isolation, conflict handling, model-transition rejection, clarification-versus-answer handling, and safety on edited predictions.

Browser checks used synthetic data: settling → optional breathing → breathing refusal → grounding → one-word rejection → changed approach; reflection and editable prediction confirmation; repeated-worry candidate and changed-context choice; probability slider; pause and reload with exact 99% draft restored. A live Groq structured response recognized an already described event/outcome and returned a tentative prediction for confirmation. No real patient examples were used.

Real microphone transcription, assistive-technology testing, comprehensive adversarial evaluation and clinical validation are not claimed. Wider access and account-retention/deletion policy need separate review. The current publication remains owner-private.


## Continuous chat presentation
The full saved conversation is shown as alternating Paasaa and user messages. A bottom composer supports Enter to send and Shift+Enter for a new line. Active exercise controls appear inside the latest reply; whole-number ratings can also be sent in the chat box. Paused, ended, and safety states retain their explicit controls. Browser verification covered sending a numeric rating with Enter and receiving the next prompt in the same thread.
