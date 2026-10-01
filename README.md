# Paasaa.ai

**your best space**

A calm, incremental self-monitoring preview for anxiety, intended for ages 13+. It supports noticing experiences between clinician appointments; it does not diagnose, deliver therapy, or replace care.

## Run and verify

Node.js 22+, no dependencies or API keys:

```sh
npm start
npm run check
npm test
npm run build
```

Open http://127.0.0.1:4173. ES modules require the preview server; opening the HTML as a file is not supported. Build output is `dist/`. Syntax checks and tests do not establish clinical validity or WCAG compliance.

## Current experience

- Optional breathing entry, synchronized countdown and illustration, pause/resume, custom rhythm, self-paced option, reduced motion, evidence links, and support resources.
- Seven optional daily check-in steps, draft resumption, explicit device-saving choice or session-only mode, completion calendar.
- Local voice recording/playback with manually reviewed text. Automatic transcription and AI extraction are not connected.
- Help me right now (`#support`): fixed-script PMR, breathing, grounding, performance/social and thought-loop support, with explicit safety escalation. See `docs/immediate-support.md` for clinical-review limitations and privacy.
- No accounts, server database, AI calls, analytics, clinician access, or sharing.

Device saving uses localStorage and is not encrypted by Paasaa. Anyone using the same browser profile may read it. Session-only entries disappear on reload/close. Audio is memory-only and discarded when leaving a question. Use synthetic examples for evaluation, not real patient data.

## Architecture

Vanilla HTML/CSS and browser ES modules preserve the original opening screen. `app.js` controls screen navigation, `breathing.js` owns deterministic timing, `checkin.js` renders the form, `checkin-model.js` owns the extensible local schema/store, and `voice.js` owns recording/review lifecycle. See `docs/implementation.md` for data boundaries, verification, and remaining work.

The GitHub repository stays private. Development uses a feature branch and reviewable PR. `.openai/hosting.json` links the existing Sites deployment; generated `dist/` is ignored. No real users' mental health information or credentials belong in Git.
