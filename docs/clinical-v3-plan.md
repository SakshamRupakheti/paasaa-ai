# Clinical Intelligence Engine v3 implementation plan

## Repository audit

Current baseline: 923a09c. The application is vanilla HTML/CSS/JavaScript with hash
navigation, Vercel Node functions (`api/index.js` and `server/vercel-api.js`),
Supabase Auth/Google PKCE, and owner-scoped Postgres REST storage. Groq runs
classification, planning, generation and transcription through server-only code.
Drizzle and SQLite/D1 support the older adapter and local synthetic preview;
production Supabase migrations are SQL. No framework replacement is needed.

Reuse `conversation-engine`, deterministic conversation/worry models, the existing
intervention registry, provider/schema validation, safety resources, localization,
check-in UI, auth and database adapters. Keep the calm design and existing routes.

The checked-in database has `public.paasaa_records` (worry/conversation JSON,
owner, revision) and private per-user AI quota. Supabase `auth.users` is identity.
The owner dashboard uses fixtures, not a clinician role or a real patient roster.
This audit inspected source/migrations, not a fresh live database inventory.

## Missing capabilities and risks

- No real clinician assignments, clinical roles, care plans, review queues, event
  outbox, acknowledgments or staffed service. Never infer these from user metadata.
- No age/jurisdiction enrollment policy or verified adolescent approval workflow.
- Local check-ins/support summaries are not longitudinal account records.
- Memory is bounded conversation context, not a patient-managed durable profile.
- Model-output guards and safety rules are imperfect, predominantly English;
  no reviewed multilingual clinical support or full-condition coverage exists.
- Retention/deletion, audit access logs, recovery drills, incident response,
  vendor agreements and youth governance need separate work.
- Model availability depends on quotas/network; configuration is not uptime.
- Existing source RLS restricts account records, but a fresh production RLS audit
  and database-level authorization tests are required before clinical rollout.

## Phase order and release boundary

1. **Operational foundation (this increment):** public outage-independent service
   status; AI kill switch; hard-disabled unimplemented clinical routes; age and
   jurisdiction eligibility policy contract; no-monitoring disclosure; guards
   against generated claims that humans were notified or are responding. Tests
   prove software gates, not legal/clinical approval. No production migration.
2. **Conversation and safety:** canonical modes, approved intervention metadata,
   patient language/code-switch context, multilingual safety evaluation and
   contextual routing. No unsupported language efficacy claims.
3. **Records:** migrate profiles, scoped versioned consents, approved memory,
   structured check-ins/observations and immutable source references. Preserve
   existing identity/records. Add owner-isolation and retention tests first.
4. **Clinician access:** verified roles, assignments, care-plan restrictions,
   provenance-linked summaries and review/correction workflow; assignment and
   consent checks in both API and RLS, including revocation tests.
5. **Escalation:** persistent safety/review events plus idempotent outbox and
   delivery attempts; distinct sent/delivered/acknowledged states; actual review
   hours, holiday handling, operational ownership and failure runbook.
6. **Readiness:** adolescent jurisdiction approval, native-speaker/clinical review,
   expanded safety evaluations, access audit and recovery/incident drills.

Do not expose an unfinished clinical portal or activate on-call coverage. The
existing self-help prototype remains usable; clinical access remains denied.
Patient eligibility collection is not implemented in phase 1; do not claim that
the existing self-help chat now verifies ages or enforces jurisdiction consent.

## Planned schema and API boundaries

Reuse `auth.users` and `paasaa_records`. Future normalized tables cover patient
profiles, verified clinician profiles, assignments, consent versions, care-plan
versions, patient-approved memory, structured observations/check-ins, summaries
with source links, clinical reviews, safety/escalation events, notification outbox
and deliveries, and audit records. Every table needs explicit grants/RLS, update
ownership checks and tests; there is no blanket guardian access. Patient identity
must not be duplicated and user-editable auth metadata must not grant roles.

New in phase 1: public `GET /api/service-status`, independent of auth/database/AI.
Reserved `/api/clinical` and `/api/clinician` namespaces reject access after auth.
Future APIs: patient profile/consent/memory/check-ins; assigned-patient views;
care-plan versions; summary source/review operations; review queue acknowledgments;
worker-only outbox delivery. These are planned, not implemented routes.

Each later phase must document changed files/migrations/endpoints, actual tests,
configuration/setup, disabled features and unresolved risks. Final readiness
requires schema and clinician workflow docs, escalation runbook, monitoring-hours
guide, privacy/security checklist, multilingual evaluation checklist, adolescent
rollout requirements and a deployment checklist. Phase 1 is not v3 completion.
