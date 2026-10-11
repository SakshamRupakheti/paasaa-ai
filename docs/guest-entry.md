# Guest entry (prepared; activation pending)

Visitors enter a name/nickname and country instead of email/password. Supabase anonymous sign-up creates a unique verified identity; metadata is descriptive only and is never used for authorization. Current signed-in sessions remain intact.

The Vercel adapter accepts verified guest UUIDs, while owner prototype access still rejects guests. The pending migration removes only the non-anonymous predicate from owner-scoped record policies and the quota function. Ownership predicates, RLS, and the 60/hour identity quota remain in place. Guest tokens stay in sessionStorage, matching the existing session model. The welcome form explains that closing the tab or ending the session can lose access. Ending a guest session requires a confirmation. Existing records are not merged by name or country.

Validation: syntax/build passed; 232 automated tests passed. A rollback-only Supabase transaction verified guest-owned insert/read, cross-guest read/update/forged-insert denial, and guest quota access. All synthetic rows and policy changes were rolled back. Local browser verified welcome form and absence of sign-in controls.

Activation still required: enable Allow anonymous sign-ins in Supabase (currently off), apply 20261011014659_guest_owned_records.sql, deploy, and verify actual guest creation/record persistence/chat. Browser access-change policy requires action-time confirmation for enabling the setting. No production migration or deployment has been performed yet. Supabase anonymous sign-up rate limits remain active; CAPTCHA is recommended before broader public launch, as guest identities can be recreated to reset per-identity AI quota.

References: https://supabase.com/docs/guides/auth/auth-anonymous
