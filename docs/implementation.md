# Daily self-monitoring implementation

## Scope and architecture

The original dependency-free app remains in place; no framework or backend was introduced. The existing header, tokens, breathing illustration, evidence section, and support dialogs are reused. Navigation switches four in-page screens and moves keyboard focus to their headings.

- `src/index.html`: semantic screen shell, breathing diagram, optional controls, evidence and support/privacy dialogs.
- `src/styles.css`: shared responsive styling, check-in controls and body silhouette.
- `src/app.js`: wall-clock greeting, screen routing, breathing animation and dialog integration.
- `src/breathing.js`: pure phase/countdown/progress calculations and pauseable clock.
- `src/checkin-model.js`: versioned local draft/record schema, persistence and choice rules.
- `src/checkin.js`: seven-step view, optional ratings/chips/text, autosave, resumption and weekly calendar.
- `src/voice.js`: isolated MediaRecorder lifecycle, playback, manual review and explicit approval.
- `scripts/serve.mjs`, `scripts/build.mjs`: allowlisted local static server and deterministic static build.
- `tests/`: clock boundaries, pause/resume, null ratings, storage recovery, resumption and exclusivity tests.
- `.github/workflows/check.yml`: syntax, tests and build in CI.

## Data boundaries

Every draft has schemaVersion, checkInId, patientId (null; no authenticated patient), timestamp, localDate, timezone, ratings, choices, narrative, thought, optional belief, behavior, interference, optional notes and completionDuration (active foreground question seconds). Nullable ratings distinguish unanswered from zero. Records remain descriptive, not diagnostic scores. No validated questionnaire or efficacy claim is implied.

Device persistence is opt-in. Session mode never writes records to storage. Device mode autosaves every edit and navigation to `paasaa.checkins.v1` in localStorage. Closing/reloading resumes only device-saved drafts. Corrupt data is not overwritten; save failures keep answers in memory and show an error. Clearing removes this app's records/draft and stops/discards audio. There is no encryption, cross-device sync, retention automation, identity verification, access separation, or multiple-tab conflict resolution. Browser/site data deletion can permanently lose records. Different origins (local/private/public deployment) have separate storage.

No answer is sent over the network. The hosting service may retain ordinary access logs. Anyone using the browser profile can inspect its localStorage. Clinical use requires security and privacy review; this preview is for synthetic evaluation. Intended ages 13+ is a product direction, not verified consent or youth safeguarding infrastructure.

## Voice and future adapter contract

Recording uses browser microphone permission, shows an elapsed timer, stops at two minutes, supports local playback, and releases tracks on navigation, tab hiding and cleanup. Raw audio is never saved to localStorage. The user types a transcript and approves it; only approved text is added to the selected field. `voice.sources` identifies the field, time, manual-review method and approved version. `voice.transcription` stays null because no machine transcription exists. Editing the response afterwards remains possible; voice provenance is the approved text at that time, not an assertion that it is the latest field value.

A future server adapter should accept explicitly consented audio and return a draft proposal:

```ts
type VoiceProposal = {
  transcription: string;
  readableFirstPersonText: string;
  suggestions: Array<{ field: string; value: string; sourceQuote: string }>;
};
```

It must not mutate saved answers. Display original speech/transcript and suggested changes separately, preserve uncertainty and tone, permit per-field acceptance/editing, and never infer ratings, diagnoses, intent or missing facts. Test ambiguity and prompt injection before activation. Keep provider keys server-side. Define audio retention/deletion, provider processing, consent and youth requirements before sending audio externally.

## Clinician-sharing milestone (not implemented)

After validating the patient flow: authenticated patient/clinician identities, explicit per-clinician consent with field/time scope, revocation, server authorization on every read/write, audit trail, deletion/retention policy, security review and youth safeguarding. The UI must state precisely what clinicians and AI receive. Do not claim HIPAA compliance or end-to-end encryption without independent verification.

## Statistics

Calendar checks come only from completed records for each recorded local date. No streaks or penalties. Average anxiety appears only after rated entries on seven distinct dates; this threshold is a UI convention, not clinical validation. It uses all rated local records and discloses the denominator. No inferred causes or symptom interpretations.

## Verification and remaining work

Automated tests cover full breathing-cycle boundaries, pause/resume/reset, custom durations, untouched null ratings, session-only storage, opted-in resumption, completion without duplication, deletion, corrupt/quota storage failures and exclusive symptoms. Browser QA covers keyboard progression, chip selection, draft resumption, optional steps, impact disclosure, completion, desktop and mobile layout, and reduced-motion state.

No lint or TypeScript configuration exists; `npm run check` checks every JS module's syntax. Actual microphone capture needs testing on target mobile browsers with user permission; it is not claimed tested by this run. Screen-reader and formal accessibility audits remain. Clinical review, teen usability work, automatic transcription/AI, authenticated storage and clinician sharing remain intentionally separate future milestones.
