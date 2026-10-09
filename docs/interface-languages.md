# Interface languages — October 9, 2026

The header offers English, हिन्दी, नेपाली, and Español. A browser-local preference
(`paasaa.interface-language.v1`) survives reloads. English is the default and the
fallback for unknown languages, unavailable storage, and untranslated copy.

## Scope

The authored catalogue covers the main navigation, login, chat controls/settings,
AI/Groq disclosures, breathing instructions and timing, and common check-in and
worry controls. Language changes update the document language and clock format.
Check-in weekday labels use the selected locale. Devanagari text has local font
fallbacks; no translation service, font CDN, or new network dependency is added.

This is an interface translation preview, not a fully localized clinical product.
Some detailed CBT/support guidance, error messages, sources, reports, and the
synthetic owner dashboard remain English. A translated footer notice explains
this. The translations have not had independent native-speaker or clinical
review. They do not establish clinical validity or multilingual safety coverage.
AI reply language and the conversation engine's language understanding are
unchanged; the language selector does not promise translated AI responses.

## Data preservation

Only exact, authored interface phrases are substituted as text. Input values,
patient messages, generated replies, saved conversation titles, worry titles,
and record details are excluded. There is no page reload on language changes.
Check-in choice buttons retain their canonical English IDs in `data-value`;
translation changes presentation only. No stored answers or server schemas are
migrated. Do not translate arbitrary patient text through this catalogue.

`src/i18n.js` observes new interface nodes and attributes so asynchronous login,
chat and worksheet rendering is localized. Original text is tracked per node so
switching back to English restores it. Runtime timing strings use explicit
template interpolation. New patient-generated elements must be marked
`data-i18n-skip` or included in the protected containers before adding copy.

## Verification performed

- `npm run check`: passed. `npm test`: 190 passed, including locale fallback,
  catalogue completeness, placeholder preservation and timing interpolation.
- Browser: all four languages selected; Hindi persisted on reload; English
  labels restored after switching back.
- Breathing: Nepali running countdown switched to Spanish without restarting;
  phase, cycle and remaining-time labels reflected the selected language.
- Synthetic session check-in: selected Hindi “Calm”, switched to Spanish;
  displayed “Calma” retained canonical `Calm`, and deselected correctly.
- New local chat: unsent synthetic text `Calm` stayed unchanged across Nepali
  and Spanish switches. Existing message content was not translated.
- Mobile 390×844: Nepali chat and Spanish DOM measurements had no horizontal
  page overflow; composer stayed within viewport. Nepali login fixture used
  page scrolling, with equal card client/scroll heights (no inner scroll).
- Login translations inspected using a local layout-only fixture; no credentials
  submitted and no authentication-provider configuration changed.

Deferred: native-speaker review, comprehensive clinical-copy localization, and
multilingual conversation/safety evaluation. These need their own acceptance
criteria before claiming full language support for therapeutic conversations.
