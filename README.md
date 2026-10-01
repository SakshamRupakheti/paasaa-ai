# Paasaa.ai

**your best space**

A calm, incremental self-monitoring preview for anxiety, intended for ages 13+. It supports noticing experiences between clinician appointments; it does not diagnose, deliver therapy, or replace care.

## Run and verify

Node.js 22.13+ (24 recommended):

```sh
npm ci
npm start
npm run check
npm test
npm run build
```

Open http://127.0.0.1:4173. ES modules require the preview server; opening the HTML as a file is not supported. Build output is `dist/`. Syntax checks and tests do not establish clinical validity or WCAG compliance.

For optional chat and transcription, copy `.env.example` to the ignored `.env.local` and set `GROQ_API_KEY`. Keep the Groq account on its Free plan. Never paste credentials into browser code or commit them. The preview uses a synthetic local account and a SQLite file under ignored `work/`; keep it on loopback. Production uses authenticated Sites identity, D1 and a server-side secret. Without a key, guided worksheets remain available.

## Current experience

- Optional breathing entry, synchronized countdown and illustration, pause/resume, custom rhythm, self-paced option, reduced motion, evidence links, and support resources.
- Seven optional daily check-in steps, draft resumption, explicit device-saving choice or session-only mode, completion calendar.
- Optional Groq speech-to-text with explicit consent and editable transcript approval. No silent answer extraction.
- Help me right now (`#support`): fixed-script PMR, breathing, grounding, performance/social and thought-loop support, with explicit safety escalation. See `docs/immediate-support.md` for clinical-review limitations and privacy.
- Work through a worry (`#worry`): practical planning or prediction exploration, separate probability/distress/severity ratings, private account drafts, editable summaries and outcome reviews.
- Talk to Paasaa (`#chat`): optional Groq questions, fixed exercise/source links, and daily check-in/worry worksheets completed inside the conversation. See `docs/chat-guide.md` for data boundaries, verification and limitations.
- No analytics, automatic clinician sharing, diagnostic claims or autonomous worksheet changes.

Daily check-in device saving uses localStorage and is not encrypted by Paasaa. Anyone using the same browser profile may read it. Session-only entries and chat disappear on reload/close. Worry records save to the authenticated account. Consented chat/transcription requests send text/audio to Groq; audio is not stored by Paasaa. Browser data clearing does not delete account records. Use synthetic examples for evaluation while clinical and privacy review remain pending.

## Architecture

Vanilla HTML/CSS and browser ES modules preserve the original opening screen. `app.js` controls screen navigation, `breathing.js` owns deterministic timing, `checkin.js` renders the form, `checkin-model.js` owns the extensible local schema/store, and `voice.js` owns recording/review lifecycle. See `docs/implementation.md` for data boundaries, verification, and remaining work.

`server/api.js` owns authenticated record and chat endpoints, `server/chat.js` bounds AI advice/actions, and `src/worry-model.js` controls worksheet transitions independently of AI. The build emits a Worker and D1 migrations; `docs/chat-guide.md` describes the current backend additions. Earlier milestone documents describe their scope at the time.

The GitHub repository stays private. Development uses a feature branch and reviewable PR. `.openai/hosting.json` links the existing Sites deployment; generated `dist/` is ignored. No real users' mental health information or credentials belong in Git.
