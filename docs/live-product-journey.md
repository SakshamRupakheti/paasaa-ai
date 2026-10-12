# Live product journey — October 12, 2026

The home page now mounts the real chat component below a full-viewport introduction, followed by the existing mood check-in. The chat node is moved between the home journey and the direct chat route; its conversation state, voice controller, CBT flow, API integration, and AI-off preference remain shared. There are no hardcoded conversation or check-in previews.

The hero uses the existing optimized Himalayan image with a muted CSS treatment. Cormorant Garamond, Inter, Noto Serif Devanagari, and Noto Sans Devanagari are self-hosted as subset WOFF2 files. OFL licenses are included. Short entrance transitions and scroll actions respect reduced motion. Mobile uses existing bottom navigation and omits the permanent product sidebar.

Start chatting opens a temporary guest session when no account is active. Existing accounts go directly into their real conversation. Direct #chat, #progress, #worry, #breathe, #check-in, #help and #dashboard routes remain available. Guest chat/check-in data continues through the encrypted in-memory guest-state path, with no activity records saved to the database.

The optional Get updates form explicitly registers product-update interest. Email and consent version are stored separately in paasaa_update_interest, bound to the authenticated identity (including a temporary guest identity), with one row per identity. No chats, mood notes, or predictions are copied. No email campaign or outbound email delivery has been configured. The endpoint validates input, enforces the existing per-identity request quota, and only returns success after storage succeeds. Repeated submissions update that identity's address.

## Verification

- npm run check passed; all 237 tests passed, including input validation, owner identity isolation, quota and upstream failure handling for the updates endpoint.
- Vercel frontend build passed.
- Local synthetic account: actual check-in saved and appeared in Progress; navigation returned to the home journey; AI-off scripted chat accepted a long message.
- Mobile 390×844: message scrollTop changed from 1510 to 666 while page scrollY stayed 1022. Composer remained inside the chat section. Settings overflow was corrected. Loading home does not focus the below-fold composer.
- Database transaction verified the public anon role has no read/insert grants and an authenticated request without an identity cannot read or insert records. Transaction rolled back without retaining test data.
- Production checks are recorded after deployment below.

## Database policy review

The new opt-in table intentionally permits authenticated anonymous identities to access only their own opt-in row, not others' information. Supabase reports this deliberate anonymous-user policy as an advisory: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins

Existing advisories remain: private AI quota table denies direct access by having no policies; leaked-password protection is disabled: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

RLS guidance checked against https://supabase.com/docs/guides/database/postgres/row-level-security

Production verification: deployment cc2bd65 reached paasaa-ai.vercel.app. One-action Start chatting created a temporary guest session; the real Groq reply answered the capital-of-Nepal test correctly. Inline guest check-in accepted Okay and displayed its refresh/close lifetime. Synthetic updates signup used paasaa-ui-test-20261012@example.invalid; this address is test-only and must never be included in a future email campaign. No outbound email was sent.
The live updates form displayed success only after the insert completed. Refresh removed the guest conversation and check-in from the interface and restored the guest entry controls. Aggregate database verification found zero saved activity records for guest identities created since the redesign. Google/email authentication flows were preserved but not reauthenticated during this UI verification. Microphone capture itself was not recorded during this pass.

## Homepage copy refinement — October 12
Removed the hero eyebrow, reassurance line, and visible email-form heading per browser comments. Renamed the CTA to Connect with Team Paasaa and kept its product-update consent explicit. The email placeholder is transparent until hover/focus, with an always-present accessible name. Replaced the labeled scroll pill with a 48px-hit-target SVG arrow animated gently over 2.4 seconds; reduced motion disables it. Local browser verification confirmed transparent/default versus visible/focused placeholder colors, the revised visual layout, and the arrow's scroll action. Syntax check and Vercel frontend build passed. No backend behavior changed.
