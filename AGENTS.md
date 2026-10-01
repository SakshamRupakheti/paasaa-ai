# Paasaa development instructions

- Build one agreed feature at a time. The active milestone includes breathing, local daily self-monitoring and the authorized immediate-support flow. Worry exploration and server-side transcription/AI are now authorized. Clinician sharing remains preview-only until separately configured.
- Keep the brand `Paasaa.ai` and motto `your best space`.
- The intended audience includes ages 13+. Do not assume adult study results apply to teens.
- Use a calm white/blue design, readable contrast, natural illustration, and optional motion. Clearly disclose AI when conversational AI is added.
- Track health claims in `docs/evidence-register.md`, including population, protocol, results, limitations, and clinical-review status.
- The 3-in/6-out rhythm is provisional. Never label it or Paasaa clinically validated without direct evidence.
- Preserve start, pause, skip, self-paced, and reduced-motion options.
- Use synthetic data for testing. No secrets in source or browser code, no analytics; external AI requires explicit user consent and a server-side credential.
- Keep source and docs in this repository. Use feature branches and reviewable pull requests for subsequent development.
- The conversational guide is authorized: reuse existing worksheet records, require explicit answer confirmation, and use server-allowlisted exercise/source links. Do not let model output mutate records.
- Run `npm run check` for code changes. Test meaningful interactions in a browser when changing their behavior. Record what was actually checked.
