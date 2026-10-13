# Safety assessment outage copy

The old engine replaced every failed assessment with the same safety warning.
Timeouts, rate limits, rejected requests and schema failures therefore appeared
to patients as concern about their message, even for a greeting.

The engine now distinguishes a technical failure from detected concern:

- A simple greeting can use the existing fixed greeting during an outage.
- Other messages without detected concern receive a brief technical retry notice.
- Current or recent user concern, pending clarification and unresolved urgent
  state keep safety-focused support. Assistant-authored help text is not evidence
  of patient risk. A failed assessment never clears pending clarification.
- Existing local emergency guidance and safety questions retain priority; the
  outage notice cannot overwrite them.
- No planner, generated advice or intervention is enabled after assessment failure.
  Operational routing remains UNCERTAIN, never a declaration that someone is safe.

The additional fallback cues include wishes to die, feeling there is nothing to
live for, unsafe circumstances and possible abuse. They select conservative copy,
not a diagnosis or automatic emergency escalation. Successful model assessment
still considers recent dialogue and indirect signals. These finite cues are not
complete across languages or contexts; clinician and native-speaker review is pending.

Sources checked October 9, 2026:
- [NIMH warning signs](https://www.nimh.nih.gov/health/publications/warning-signs-of-suicide)
  describes warning signs, not a validated keyword classifier for this app.
- [Groq structured outputs](https://console.groq.com/docs/structured-outputs)
  documents best-effort output for the safeguard model and potential malformed
  output/errors. Existing app validation remains required.

Verification: all 228 automated tests passed, including 17 new regression tests;
JavaScript syntax and the Vercel build passed. Tests cover ordinary messages,
all technical failure classes, prior context, current danger, failed-assessment
intervention blocking, and successful model routing. A live synthetic greeting
returned a valid safety result; the original production API failure was not
reproduced. Telemetry now includes a bounded failure code and assessment source,
without raw provider errors or patient text.

Follow-up verification October 10: the localhost browser rendered a normal
greeting after Send. A fresh synthetic full-engine question about Nepal returned
“The capital of Nepal is Kathmandu.” with successful safety, planner and
conversation provider calls. No existing patient transcript was used for this probe.

No schema, credentials or environment settings are changed. No notifications
are sent. These checks do not establish clinical sensitivity or teen suitability.
