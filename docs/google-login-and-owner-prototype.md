# Google login and owner prototype

The Vercel frontend uses Supabase Auth and a same-origin API adapter. The server verifies each bearer token with Supabase before querying records through the user's JWT and row-level security. Groq credentials stay server-side. The older Sites adapter remains available; its identity header is removed by the public Vercel adapter.

## Google provider configuration

Project created in Google Cloud: **Paasaa AI**, ID `airy-period-511004-p1`. No billing was enabled. The user completed the branding agreement and authorized creation of the Web OAuth client. The client was created successfully. Google sign-in is not enabled yet: the owner must enter the new client secret directly in Supabase and save the prepared provider form.

Configured Google client and saved Supabase URLs:

- JavaScript origin: `https://paasaa-ai.vercel.app`
- Google authorized redirect URI: `https://ulixwxljulespgslzahl.supabase.co/auth/v1/callback`
- Supabase Site URL: `https://paasaa-ai.vercel.app`
- Supabase redirect allowlist: `https://paasaa-ai.vercel.app/?auth=callback`
- Requested app scopes: `openid`, `email`, `profile` only.

Client ID: `828628016344-d10lbjgedl0upotmter00umihs4t890l.apps.googleusercontent.com` (public identifier). The secret has not been saved in repository files or chat. Keep Google's creation dialog open until it has been transferred securely; Google says it cannot be viewed again after closing that dialog. The Supabase provider form has the client ID filled in, Google enabled as an unsaved change, and nonce/email checks preserved. This form still requires the owner's secret entry and Save action. Google remains in Testing mode pending sign-in verification and production audience setup.

Store the Google client ID and secret privately in Supabase's Google provider configuration. Never put the secret in frontend code, Git, chat, or a public environment variable. Complete an actual Google sign-in before declaring it operational. The button checks provider availability and explains when setup is incomplete.

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
- Production browser: Google setup fallback displayed correctly; a synthetic non-owner account signed in successfully and was denied the workspace. Signed-out API access returned 401; public auth configuration returned 200. The production owner account has not yet completed a Google sign-in.
- Google login still requires provider setup and an end-to-end sign-in check.
- Real clinician assignments, consent revocation, audit trails and live patient sharing are outside this prototype.
