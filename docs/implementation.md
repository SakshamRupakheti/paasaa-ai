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

## Resting figure and discoverable navigation (2026-09-30)

The breathing entry now uses an original front-facing seated SVG with translucent lungs and twelve curved airflow wavelets split across two airway paths. Wavelet travel, lung expansion and chest light all derive from the existing clock's eased expansion, so exhalation reverses travel and pause freezes the entire scene. Reduced motion removes travel, expansion and changing glow. No animation library, external art dependency or new health claim was added.

The header exposes Breathe / Daily check-in on all screens, with a prominent start/resume check-in action beside breathing. `src/navigation.js` maps hash URLs to screens; `#check-in` is directly linkable and reloads to the consent/resume entry. Browser history moves between sections; individual questions remain within the same check-in URL. Session-only drafts survive in-page navigation, not reload. Existing device drafts retain their stored step.

Changed files for this iteration: `src/index.html`, `src/styles.css`, `src/app.js`, `src/checkin.js`, new `src/navigation.js`, `scripts/serve.mjs`, `package.json`, new `tests/navigation.test.mjs`, and this document. Tests include deep-link mapping, alongside existing timing and persistence coverage. Browser checks verify direct entry, refresh, Back/Forward, draft-aware entry text, paused airflow transforms, reduced-motion static state, and desktop/mobile layout. Formal screen-reader, clinical and cross-browser audits remain pending.

## Calm blue guide and graphical pacing (2026-09-30)

The realistic-photo iteration was reverted. The editable seated SVG now uses a soft blue palette with no surrounding card/background. Airway paths extend outside the mouth and branch into both lungs, so curved wavelets visibly travel inward and reverse outward. Lung scaling is restrained (2–2.5%) and chest glow ranges only from .12 to .28 opacity.

The graphical breathing meter is 18px high, fills blue during inhale and releases in muted teal during exhale. Phase labels remain explicit so color is not the only signal. A smaller numeric countdown remains secondary. All movement shares the existing clock; paused state freezes it. Reduced motion removes airflow and expansion and uses static phase bar states. No new features, analytics or data processing were introduced.

Design references: W3C reduced-motion guidance https://www.w3.org/WAI/WCAG22/Techniques/css/C39 and guidance against using color alone https://www.w3.org/WAI/tips/designing/ . These inform the design, not a claim of audited WCAG compliance. Added a phase-boundary timing test for the new graphical meter.

## Visible breathing motion and meter repair

Replaced native progress rendering with an explicit transform-based fill driven by the same clock: dark blue fills across the full inhale, light blue empties across the full exhale. Custom durations remain authoritative. Reduced motion uses coarse meter steps and disables figure movement; the UI explicitly explains this state instead of silently showing a static figure. Pause freezes the clock and fill.

Restored warm skin and brown hair. The torso gently widens, lungs expand, the diaphragm flattens/downshifts and the abdominal contour moves outward on inhale, returning on exhale. The face, hands and seated legs remain still. This is an illustrative pacing cue, not measured human physiology; magnitudes are design choices.

Physiology reference: NHLBI, How Your Body Controls Breathing, https://www.nhlbi.nih.gov/health/lungs/body-controls-breathing ; MedlinePlus diaphragm illustration, https://www.medlineplus.gov/ency/imagepages/19380.htm . These explain chest expansion and diaphragm contraction on inspiration and relaxation on expiration, not validation of the app or its rhythm.
