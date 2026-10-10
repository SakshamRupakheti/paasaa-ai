# Google login and owner prototype

The Vercel frontend uses Supabase Auth and a same-origin API adapter. The server verifies each bearer token with Supabase before querying records through the user's JWT and row-level security. Groq credentials stay server-side. The older Sites adapter remains available; its identity header is removed by the public Vercel adapter.

## Google provider configuration

Project created in Google Cloud: **Paasaa AI**, ID `airy-period-511004-p1`. No billing was enabled. The user completed the branding agreement, authorized creation of the Web OAuth client, and entered the secret directly in Supabase. Google sign-in is enabled and has passed an end-to-end production browser check.

Configured Google client and saved Supabase URLs:

- JavaScript origin: `https://paasaa-ai.vercel.app`
- Google authorized redirect URI: `https://ulixwxljulespgslzahl.supabase.co/auth/v1/callback`
- Supabase Site URL: `https://paasaa-ai.vercel.app`
- Supabase redirect allowlist: `https://paasaa-ai.vercel.app/?auth=callback`
- Requested app scopes: `openid`, `email`, `profile` only.

Client ID: `828628016344-d10lbjgedl0upotmter00umihs4t890l.apps.googleusercontent.com` (public identifier). The secret has not been saved in repository files or chat. The saved provider configuration initially had a secret but an empty client ID and Google disabled; the client ID and enabled state were corrected without reading or changing the secret. Nonce and email checks remain enforced. Google remains in Testing mode, with the owner's Google account added as a test user. Public audience release and final consent-screen branding remain separate work; no public release was claimed or performed.

Keep the Google client secret privately in Supabase's Google provider configuration. Never put it in frontend code, Git, chat, or a public environment variable. The button checks provider availability and explains when setup is incomplete.

The app uses a random PKCE verifier and SHA-256 challenge. Pending sign-in expires after ten minutes and can be consumed once. Callback query parameters are removed before the exchange. Sessions are tab-scoped; refresh tokens are not placed in localStorage.

Reference: https://supabase.com/docs/guides/auth/social-login/auth-google

## Owner workspace

Route: `/#dashboard`. Production API: `GET /api/admin/prototype`.

Set server-only `PAASAA_PROTOTYPE_OWNER_EMAIL` to the owner's verified sign-in email. Missing configuration, unverified emails, anonymous accounts and other users are denied. User-editable metadata grants no permissions.

This is a read-only, explicitly synthetic prototype. It never queries real patient records or the account directory. It displays sample sign-in activity, check-in ratings, CBT estimates and optional sample transcripts. Record consent and transcript consent are separate fixture states. Withheld content is removed on the server, not merely hidden with CSS. Missing ratings stay missing; increased or unchanged estimates are preserved. No diagnoses or live monitoring are provided.

Local `npm start` binds to loopback and uses a synthetic preview identity. Its dashboard shortcut does not authenticate production requests. Existing on-device daily check-ins are not uploaded by this feature.

## Verification

- JavaScript syntax checks passed.
- Full suite: 165 tests passed, including OAuth, owner-access and consent tests.
- Local browser: all three patient selections, separately consented transcript, hidden records and empty search checked.
- Production deployment `dpl_HvFtsEFKAisryE4kFDKEykKkHeAy` (code commit `e4e3a44`) is Ready at `https://paasaa-ai.vercel.app`.
- Production browser: Google setup fallback displayed correctly before provider activation; a synthetic non-owner account signed in successfully and was denied the workspace. Signed-out API access returned 401; public auth configuration returned 200.
- Google end-to-end: Continue with Google opened the correct OAuth client, requested only name/profile picture/email, returned through Supabase to the PKCE callback, removed the callback code from the URL, and opened the signed-in chat. The same session successfully opened the owner-only synthetic dashboard. No clinical message was sent during this login check.
- Real clinician assignments, consent revocation, audit trails and live patient sharing are outside this prototype.
