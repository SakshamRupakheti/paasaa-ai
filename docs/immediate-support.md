# Immediate support implementation and review notes

## Scope

One new feature: **Help me right now**, reachable from the persistent header and directly at `#support`. No account or Daily Check-In is required. Existing breathing and check-in data remain separate. This is a fixed-script coping preview, not diagnosis, emergency care, risk assessment, psychotherapy, or independent ERP. It collects no free-text thought or crisis narrative and makes no external LLM calls.

## Files and components

- `src/support-content.js`: reason labels, review metadata, evidence links, 16 configurable muscle groups, targeted/discreet mappings and social next actions.
- `src/support-model.js`: pure PMR/breathing/grounding planners, safety routing rule, `GuidedTimer`, minimal session model and explicit-save allowlist.
- `src/support-ui.js`: accessible choices, optional ratings, evidence disclosure, body highlights and local-only optional speech controller.
- `src/support.js`: entry, environment/body selector, targeted/full/discreet PMR, acute breathing, performance/social support, thought-loop support, safety escalation and summary orchestration.
- `src/app.js`, `src/navigation.js`, `src/index.html`: header entry, `#support`, pausing other activities, support lifecycle and shared privacy deletion.
- `src/styles.css`: responsive support cards, body selector, timers, highlights and crisis resource actions.
- `scripts/serve.mjs`, `package.json`: module routes and syntax checks.
- `tests/support.test.mjs`, `tests/navigation.test.mjs`: planners, full sequence, safety branches, timer behavior, minimal persistence and routing.

The vanilla ES-module architecture is preserved. There are no new dependencies, database, auth system, API, analytics, haptics, notification services or clinician-sharing capability.

## Interventions and timing

Targeted PMR uses the chosen region with 5 seconds of gentle tension and 20 seconds of release. Single-group targeted exercises have three rounds (75 seconds); most bilateral groups take 50 seconds. Full PMR visits the 16 configured groups, dominance first, with two rounds each: 800 seconds (13 minutes 20 seconds) excluding pauses and repeats. The repetition count is a product adaptation, not a claim that the exact app protocol has been validated. The UI discloses two rounds. Every muscle can be skipped; awareness-only mode avoids contraction. Jaw and neck cautions appear before starting and during the relevant step. Users are told to breathe normally, avoid injured/recently operated areas and stop for pain, cramps, dizziness or significant discomfort.

Discreet mode restricts choices to hands/forearms/upper arms/shoulders/thighs/calves/feet, at most four groups, with 50–100 seconds of guided time. It excludes face and neck. No location permission is requested.

Acute breathing is separate from the opening-screen protocol: six cycles of 4 seconds in / 6 seconds out, 60 seconds, no required hold. Own-pace, immediate stop, discomfort-to-grounding and medical-help actions are present. A completed minute offers another minute, never auto-continues. The 4/6 timing is a design choice and must be clinically reviewed.

Performance support is 30 seconds of gentle breathing followed by 7 seconds each releasing shoulders/hands and 6 seconds orienting outward: 50 seconds to one chosen next action. Breathing can be skipped. Social support offers quiet awareness/release and one next action without insisting on complete calm or shaming a choice to stop.

The thought-loop route first asks whether the thought is unwanted versus possible intent/uncertainty. Possible intent and uncertainty go directly to safety support. The unwanted-thought path offers two minutes without answering/neutralizing the thought; optional urge chips stay in memory and are not saved. It never generates an exposure hierarchy or reassures that harm cannot occur. It explicitly excludes delaying an action needed for immediate physical safety.

Grounding uses three short optional prompts. The general-overwhelm screen also shows an immediately usable grounding prompt without requiring a choice.

## Timer, motion and accessibility

One monotonic clock controls each phase. A delayed frame advances to a fresh next phase rather than skipping through unobserved contraction phases. The timer pauses when the tab is hidden, the user leaves support, or opens a shared dialog; it never resumes on visibility alone. A paused tension phase restarts its short countdown on resume because the person was instructed to release while paused. Pause, skip, repeat and stop remain available.

Screen readers receive phase/muscle transitions via a polite status region, not a live announcement every second. Timer numerals are aria-hidden; progress has an accessible label. Body hotspots have text-button equivalents. Both operating-system reduced motion and an in-session switch are supported. Highlights become static; no moving waves/pulsing body is required. Audio defaults off, uses only browser-reported on-device English voices, speaks short cues with silence between them, and is canceled on pause/navigation. If no local voice is available the silent guide remains fully usable. Audio quality and OS screen-reader behavior still need device testing.

## Safety and geography

Safety escalation interrupts any exercise and cancels audio. It visibly states that Paasaa has not contacted anyone and is not monitored. Country selection is manual: US 988 call/text and 911 for immediate physical danger/medical emergency; UK Samaritans 116 123 and emergency 999; Ireland Samaritans 116 123 and emergency 112. Other countries receive a direct link to Find A Helpline's country-aware directory. No US default is inferred from timezone or IP. External directory navigation requires connectivity; the app does not maintain a worldwide offline crisis-number database.

A trusted-person action only reveals suggested wording; it does not send messages. Youth copy points to a trusted adult. No AI/classifier claims to distinguish risk from typed narratives: there is no narrative input. The supplied text-risk scenarios are addressed through the explicit risk-choice branch, not automatic monitoring. A user must select the appropriate safety option; urgent medical symptoms are never dismissed as anxiety.

## State and privacy

`SupportSession` has schemaVersion, supportSessionId, patientId (null), timestamp, timezone, entryReason, environmentMode, interventionType, muscleGroups, skippedMuscleGroups, breathingMode, durationSeconds, optional distressBefore/After, completed/endedEarly flags, crisisEscalationShown and userRequestedClinicianSharing (false).

Default is memory only. No auto-save of acute support. A summary screen offers an explicit device-save action with a plain-language disclosure. Only an allowlist is serialized to `paasaa.support-summaries.v1`, separately from Daily Check-In. Save is idempotent per session ID and keeps at most 100 records. Corrupt saved data is not overwritten; quota/blocked storage errors are shown. No thought narrative, optional urge choice, contact details or crisis narrative is persisted. Browser-profile users can inspect unencrypted localStorage. Saving does not share with any clinician; the app has no authenticated patient identity. The shared privacy action clears both stores. The hosting provider may retain ordinary access logs.

No claim of HIPAA compliance, end-to-end encryption or complete privacy is made. Use synthetic examples for development and evaluation. Consent, clinical governance, adolescent safeguards and secure authenticated sharing require separate work before real-patient use.

## Evidence assumptions and clinical review

Every evidence entry has version, source owner, last reviewed date, reviewer (null), category and `needs clinician review`. Product review of a source is not clinician approval. All scripts remain drafts. Adult PMR findings cannot be assumed to generalize to 13–17-year-olds. This app does not establish an optimal dose, symptom improvement, sleep benefit or treatment outcome from a before/after rating. The optional bedtime shortcut was not added, avoiding a new saved-preference feature or sleep claim.

Sources checked 2026-09-30:

- VA PMR overview: https://www.va.gov/WHOLEHEALTHLIBRARY/docs/Progressive-Muscle-Relaxation.pdf
- Adult PMR systematic review (46 publications; mixed protocols): https://pmc.ncbi.nlm.nih.gov/articles/PMC10844009/
- NHS comfortable breathing: https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/
- IOCDF compulsions overview: https://iocdf.org/wp-content/uploads/2025/07/What-is-OCD-Brochure-July-2025.pdf
- IOCDF clinician-led ERP: https://iocdf.org/about-ocd/treatment/erp/
- NHS urgent breathing symptoms: https://www.nhs.uk/symptoms/shortness-of-breath/
- US crisis support: https://988lifeline.org/
- International directory: https://findahelpline.com/
- Samaritans: https://www.samaritans.org/how-we-can-help/contact-samaritan/

## Validation and remaining TODOs

Node tests exercise 16-group ordering and dominance, full completion, neck skipping, pause/repeat, long-frame handling, public-friendly selection/duration, awareness-only plans, 60-second no-hold breathing, possible-intent/uncertainty routing, summary allowlisting/deduplication/corrupt-storage protection, and support deep links. Existing breathing and check-in tests remain included. There is no lint or TypeScript setup; syntax checks cover all JS modules and the static build is run.

Browser QA includes keyboard entry, body selection, neck skip, discreet thigh release, pause, reduced-motion static highlights, breathing-discomfort stop/grounding, country-specific safety actions, unwanted versus uncertain thought routing, stopping early, neutral high after-rating, and desktop/mobile layout. The long PMR sequence is tested with an injected clock rather than claiming a real-time 13-minute human usability session.

Remaining: clinician review of every script/dose and especially neck/jaw/teen use; supervised teen/usability research; formal WCAG and screen-reader audit; local voice quality on supported devices; ongoing crisis-resource review; secure consent/authorization/backend if clinician sharing is later approved. No clinical efficacy or safety validation has been completed.
