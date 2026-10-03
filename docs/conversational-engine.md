# Conversational intelligence engine V1

## Existing architecture inspection
Plain JavaScript ES modules; CSS and static HTML; no frontend framework or TypeScript. A Node preview serves the same server API bundled by esbuild into a Worker. Authenticated user headers and same-origin checks gate requests. D1 records store owner-scoped JSON payloads with optimistic revisions; local preview uses SQLite with synthetic identity. Groq text and transcription requests are server-only; `.env.local` is ignored. No key values were inspected or copied.

The existing chat used a deterministic worksheet state machine and one Groq rephrasing call. It has persistent conversations, optional AI consent, voice approval, and a continuous chat UI. Existing support-content and support-model modules provide PMR muscle groups, 5-second tension/20-second release, breathing without holds, grounding, and pause/skip timers. Daily check-in remains separate. Existing safety is keyword-based and intentionally conservative. New layers must distinguish unwanted thoughts from intent in companion chat without rewriting the worksheet subsystem.

Tests use node:test; check is JavaScript syntax validation, not a linter or type checker. The project has no TypeScript configuration. Existing responsive pale-blue/navy styling is preserved. Intervention scripts are product drafts awaiting clinician review, not clinically approved treatments.
