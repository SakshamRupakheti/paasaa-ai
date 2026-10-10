# Personal Wellness Dashboard v1

## Experience and architecture

The old header mixed four tools with multiple support buttons; breathing was the
default home, account activity was buried in tool menus, and check-ins were local
to the browser. The redesign reuses vanilla ES modules, existing CSS, hash routing,
Supabase auth/record ownership, Vercel APIs and the existing Groq engine.

- `#home`: signed-in wellness dashboard; signed-out public introduction.
- `#chat`: existing conversation, history, microphone and AI controls.
- `#progress`: persisted moods, date filter, worries and conversations.
- `#help`: static resources, monitoring limits, privacy and account assistance.
- Profile menu: account, language, sign-out once authenticated.
- `#breathe`, `#support`, `#check-in`, `#worry` remain working tool routes.
- `#chat/{id}` and `#worry/{id}` resume an actual authorized record.
- `#dashboard` remains the separate internal synthetic owner prototype.

Desktop has a compact sidebar and two-column home. Mobile has four fixed,
labeled destinations, safe-area padding and a composer above navigation. No
notifications, clinician assignments or treatment approval were fabricated.

## Components and changed files

`src/wellness.js`: reusable card, mood selector/editor, category timeline,
continuation, public introduction, Progress and Help renderers.
`src/wellness.css`: tokens, responsive shell, focus/selected/error states.
`src/wellness-translations.js`: English keys with Hindi, Nepali and Spanish copy.
`src/mood-model.js`: mood categories, local calendar dates, seven-day observations.
`server/mood-api.js`: read/save/correct check-ins.

Integration edits: `src/index.html`, `app.js`, `navigation.js`, `auth.js`,
`i18n.js`, `chat.js`, `worry.js`; `server/api.js`, `supabase-store.js`.
Tests: `tests/mood.test.mjs`, `tests/navigation.test.mjs`.

## Real data and migration

`GET /api/moods` reads up to 200 owner-scoped entries. `POST /api/moods` validates
day, mood, note (2,000 characters maximum) and expected revision. The server chooses
the ID `mood-YYYY-MM-DD`; ownership comes from verified authentication, not input.
Same-payload retries return the saved record, conflicting edits return 409.
Duplicate in-flight form submissions are disabled. Save failure keeps the draft.

Migration `20261010184600_wellness_mood_records.sql` adds `mood` to the existing
table's kind constraint. Existing data, grants, JWT ownership filters and RLS
policies are preserved. It was applied to the existing Supabase project.
No credential or new environment variable is needed.

Mood options are nominal categories, **not numeric clinical scores**. The week is
a labeled seven-day timeline, not a fabricated improvement curve. Missing days
remain empty. One correctable check-in per device-local calendar date; changing
timezone does not silently re-date a stored observation. Notes never enter AI
requests. The older, detailed on-device check-in stays available and separately
labeled; it is not silently uploaded or mixed into cloud mood history.

Activity cards use existing conversation and worry APIs with partial-load errors.
User-authored titles and notes use textContent and are excluded from automatic
translation. No patient data is shown on the unauthenticated homepage.

## Verification

- 231 automated tests passed; JavaScript syntax checks and Vercel build passed.
- New tests exercise persistence, corrections, duplicate retry, stale revision,
  ownership isolation, unauthorized/cross-origin rejection, input validation,
  wrong-kind route rejection, missing days and calendar-year boundaries.
- Live Supabase transaction with two synthetic identities: own mood insert worked;
  other-owner rows were not readable/updateable and forged inserts were denied.
  All synthetic data and identities were rolled back.
- Browser: desktop 1265×720 and mobile 390×844 inspected. Created a synthetic
  check-in, reloaded, edited through Progress, and verified the weekly entry.
- Mobile home: no horizontal overflow; primary chat action bottom 740px, bottom
  navigation begins 777px. Mobile chat: composer bottom 721px before the navigation;
  conversation thread has independent `overflow-y:auto`.
- Nepali interface checked for translated navigation, mood options and labels.
  Help's existing 988/911 links remain static and independent of AI/database.
- Focus rings, semantic links/buttons, pressed states, named inputs, status
  announcements, a readable history table and reduced-motion CSS are provided.

Not tested: physical phone keyboard behavior, full screen-reader workflows,
every browser, full linguistic/clinical review, or newly registering a Google user.

## Remaining operational limits

Clinician care plans/review and adolescent clinical services remain disabled.
Translations are authored preview copy, not clinically approved localization.
No diagnostic accuracy or treatment improvement is claimed.

The Supabase advisor reports an existing
[leaked-password protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
No authentication policy was changed by this UI work. Its info-level notice for
private `ai_quota` is intentional: direct access is denied and the existing
bounded quota function handles requests. Neither notice concerns the new mood
kind or a newly exposed table.
