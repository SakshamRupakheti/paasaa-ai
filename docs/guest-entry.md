# Guest entry

Visitors enter a name/nickname and country instead of email/password. Supabase anonymous sign-up creates a unique verified identity; metadata is descriptive only and is never used for authorization. Current signed-in sessions remain intact.

The Vercel adapter accepts verified guest UUIDs, while owner prototype access still rejects guests. The applied migration removes only the non-anonymous predicate from owner-scoped record policies and the quota function. Ownership predicates, RLS, and the 60/hour identity quota remain in place. Guest tokens stay in sessionStorage, matching the existing session model. The welcome form explains that closing the tab or ending the session can lose access. Ending a guest session requires a confirmation. Existing records are not merged by name or country.

Validation: syntax/build passed; 232 automated tests passed. A rollback-only Supabase transaction verified guest-owned insert/read, cross-guest read/update/forged-insert denial, and guest quota access. All synthetic rows and policy changes were rolled back. Local browser verified welcome form and absence of sign-in controls.

Activation: user approved enabling anonymous sign-ins; enabled in Supabase and migration applied. Production deployed at https://paasaa-ai.vercel.app (code commit 6f9b89b). Live synthetic guest entry succeeded; a mood check-in saved and survived reload; chat returned an AI answer to a factual question. The first general capabilities question received the existing simpler-mode fallback despite successful provider calls; this is an existing response-generation limitation, not a guest authentication failure. Synthetic QA guest records are clearly labeled Guest QA — synthetic. No real user records were used for these checks.

Supabase security advisor reports the expected anonymous-access warning on owner-scoped records (https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins). This is intentional: verified guests can access only their own rows. The private quota table deliberately has no direct-access policy. Existing leaked-password protection remains disabled (https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); guest entry does not use passwords.

Supabase anonymous sign-up rate limits remain active; CAPTCHA is recommended before broader public launch, as guest identities can be recreated to reset per-identity AI quota. No billing changes were made.

References: https://supabase.com/docs/guides/auth/auth-anonymous
