# Clinical v3 Phase 1 delivery

## Implemented

This is the operational foundation, not the full v3 clinical platform.

- Public service status survives missing auth/database configuration without
  external requests, exposes no secrets, and distinguishes configured AI from
  guaranteed availability. Human review is unconfigured; hours are null.
- Server-only `PAASAA_AI_ENABLED=false` disables all Groq generation and
  transcription, including direct provider entry points. Existing help remains.
- Reserved clinical/clinician routes reject unauthenticated callers and remain
  unavailable to authenticated callers, including spoofed clinician metadata.
- Clinical eligibility contract distinguishes under 13, unknown age, unsupported
  jurisdiction, unapproved adolescent policy, missing consent and assignment.
  It always denies actual clinical activation because the service is unimplemented.
  It is a tested policy contract, not an enrollment or age-verification system.
- Generated replies across free chat and legacy worksheet/chat paths reject
  known patterns claiming notifications, human acknowledgment, dispatch,
  monitoring, human/licensed identity, or generated contact-number instructions.
  The common provider system prompt states the actual unstaffed service boundary.
- Turn metadata has a separate operational safety category. Local-only/no-model
  assessment is UNCERTAIN, not a declaration of safety. A review category does not
  create a review item, contact someone, or diagnose a condition.
- Chat and Help disclose that clinician review and notifications are not
  connected. These notices have English/Hindi/Nepali/Spanish interface copy.

## Files and endpoints

New server modules: `service-policy.js`, `response-policy.js`, `safety-routing.js`.
Updated: `vercel-api.js`, `api.js`, `ai-provider.js`, `ai.js`,
`conversation-engine.js`, `conversation-ai.js`, `chat.js` (server); `src/chat.js`,
`src/app.js`, `src/styles.css`, `src/translations.js`; `.env.example`.
Tests: `tests/clinical-foundation.test.mjs`.
Planning: `docs/clinical-v3-plan.md`.

New public endpoint: `GET /api/service-status` (read-only, no-store).
Reserved `/api/clinical` and `/api/clinician` namespaces: no patient/clinician data
is served. These are disabled boundaries, not completed APIs. Existing routes and
synthetic owner dashboard remain unchanged. Database migrations: **none**.

## Configuration and operational runbook

No new credential or manual setup is required. Default AI behavior is preserved.
Set server-only `PAASAA_AI_ENABLED=false` and deploy to stop provider requests;
restore `true` or remove it and deploy to restore configured AI. Client status and
mic availability reflect the switch on reload. Requests already in progress are
not canceled by a new deployment; this is not a global revocation mechanism.

There is no environment variable that activates clinical service, on-call
coverage or notifications in this release. Do not bypass the release latch.
Before a future scheduled-review service can run, establish a staffed roster,
verified assignments, scoped consent, legal/clinical approval, timezone-aware
hours and holidays, patient disclosure, acknowledgment procedures and an audited
outbox. Notification delivery and human acknowledgment must remain separate.

During an outage: retain the static Help and support entry; do not tell patients
someone has been alerted. Service status is independent of auth/database/Groq,
but still requires the website and network. It is not an offline service or an
uptime monitor. Incident logs must exclude conversation bodies, tokens and keys.

## Verification performed

All 211 automated tests passed. `npm run check`, the Vercel static build
(`node scripts/build-vercel.mjs`), and `git diff --check` completed successfully.
Turn metadata records the service policy version alongside existing prompt versions.

Automated tests cover public status without credentials, method/origin rejection,
anonymous and spoofed role denial, closed clinical gates, provider/transcription
kill switch, model output fallback, known English/Spanish/Hindi/Nepali service
claims, invented contact numbers and operational safety-category precedence.
These are synthetic software checks, not a multilingual clinical evaluation.

Browser tested on localhost with AI disabled: Help still opened with US 988 call,
text and 911 links; a fresh chat showed the monitoring disclosure, unavailable-AI
notice and disabled mic. Nepali notice rendered; at 390×844 no horizontal overflow
occurred and the composer remained inside the viewport (bottom 720.1px).
No real audio or clinical message was submitted.

## Limits and remaining work

The deny patterns are finite and can miss paraphrases or unsupported languages;
they are defense in depth, not proof of safe output. No live model evaluation was
run for this phase. Clinical safety rules, longitudinal memory, real assignments,
reports, audit logs, escalation persistence/retries, clinician portal, age
collection and legal consent enforcement still require subsequent phases.

The existing self-help prototype has not become an approved clinical service.
No production database schema or grants were changed. A fresh live database audit,
RLS tests, clinical review, native-speaker review, teen safeguarding review,
retention/deletion decisions and operational staffing remain prerequisites.

Reference checked: https://988lifeline.org/ confirms the US call/text service and
24/7 availability. This is a third-party service, not Paasaa staffing. Supabase
RLS reference: https://supabase.com/docs/guides/database/postgres/row-level-security .
No state-specific legal rule or parental-access entitlement was inferred.
