# Team Paasaa connection notifications

Implemented October 19, 2026. Activation requires Resend credentials and a Vercel deployment.

The existing homepage form sends an authenticated, same-origin POST to `/api/updates`. After validation and the existing per-owner quota, the endpoint saves the contact to `paasaa_update_interest` under the verified Supabase owner. It then awaits Resend acceptance of a plain-text notification addressed only to `sakshamrupakheti23@gmail.com`.

The notification contains the submitted email and homepage source. The email's timestamp supplies the send time. It labels the submitted address as unverified. No chat, mood, check-in, account identifier, token, or patient records are sent. The form discloses the email notification before submission. Existing product-update consent purpose/version and database policies remain unchanged; no schema migration is required. No historical contacts are emailed automatically.

## Activation

1. Create a Resend account using the recipient Gmail. Create a Sending access API key at https://resend.com/api-keys.
2. Save `RESEND_API_KEY` privately in `.env.local`. Never commit it or paste it in chat.
3. Configure `PAASAA_TEAM_EMAIL_FROM` with a Resend-authorized sender. For initial owner-inbox testing use `Paasaa <onboarding@resend.dev>` with the same recipient as the Resend account email. A custom sender requires a verified domain.
4. Add both variables to the verified `paasaa-ai` Vercel project, Production environment. Store the key as a secret. Redeploy; env changes alone do not update existing deployments.
5. Submit a clearly synthetic `example.com` address through the deployed homepage. Check the response, Resend acceptance/delivery status, and the owner's Gmail inbox. API acceptance alone is not proof of inbox delivery.

## Failure and duplicate handling

- No email is attempted before a successful database save.
- The server retries one network/5xx failure with the same payload and idempotency key. Auth/quota/validation rejections are not retried automatically.
- Within the form instance, a failed submission retains its UUID and email for retry. An edited address or successful new submission gets a new UUID. Resend's idempotency window is 24 hours; refreshing the page loses the pending UUID.
- Missing configuration or failed sending returns `{registered:true,notified:false}`. The form preserves the address, states it was saved but notification failed, and offers Retry notification. It never claims inbox delivery.
- There is no durable notification queue or automatic retry after the two attempts. Contacts remain saved even if the visitor leaves. Delivery/bounce monitoring and durable retries are future work; this implementation cannot guarantee every email reaches Gmail.
- Existing local SQLite preview does not implement the Supabase `/api/updates` endpoint. Browser verification uses a separate synthetic fixture with the real form/handler/backend and fake external services.

## Verification

- `npm run check`: passed.
- 20 targeted Node tests: passed (notification, updates, Vercel auth/backend).
- `node scripts/build-vercel.mjs`: passed.
- Browser: simulated provider failure saves contact and shows retry; retry succeeds and clears the field. No real email or production contact was created during these tests.
- Live Resend delivery and production activation remain pending credentials.

References: [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email), [24-hour idempotency behavior](https://resend.com/docs/dashboard/emails/idempotency-keys).
