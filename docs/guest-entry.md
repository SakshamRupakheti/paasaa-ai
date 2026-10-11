# Three entry options and temporary guests

Google and email/password sign-in save activity in the existing owner-isolated database. Continue as guest creates an anonymous identity without name, country, email or password. Guest auth tokens and activity state are held only in page memory, not localStorage/sessionStorage. Refresh/close clears the session.

Guest requests use an AES-256-GCM encrypted, owner-bound state envelope carried in page memory. Each server request decrypts into a request-local store and returns fresh encrypted state. No guest chat, worksheet, mood or decision telemetry is written to the records database. The server-only PAASAA_GUEST_STATE_KEY is a sensitive Vercel production variable. State expires after four hours of inactivity and has a size cap. Guest requests are serialized to prevent lost concurrent updates. The record database also rejects anonymous users through RLS, including direct REST access; regular account ownership policies remain in place.

Anonymous authentication identities and per-identity rate-limit counters still exist for security. AI chat and microphone content are processed by Groq under its policies. This is not a claim of zero provider retention or zero operational metadata. The UI explains this distinction. Prior guest rows from the earlier saved-guest version are not deleted by this update; guests can no longer read/write those rows. Existing user records are not merged or deleted.

The device check-in module switches to in-memory mode on guest entry; device-save actions are blocked. Immediate support cannot persist guest summaries. The language preference is not health/activity data and remains a browser preference.

Validation before release: 234 automated tests pass, including encrypted state tampering, wrong-owner/expired-state denial, guest multi-turn chat and mood activity without any database record calls, empty history with fresh state, and direct guest record endpoint denial. A rollback-only Supabase test confirms guest writes are denied while AI quota remains usable. Syntax/build checks pass. Live verification follows deployment.

Supabase quota table intentionally denies direct access. Existing leaked-password protection remains disabled: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Anonymous sign-up rate limits remain; CAPTCHA remains a future abuse-control improvement for a broader public rollout.
