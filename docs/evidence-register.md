# Breathing evidence register

Reviewed for initial product discussion: 2026-09-29. This is a preliminary targeted review, not a systematic review or clinical sign-off. No clinician has reviewed or approved the prototype.

## Adolescent resonant breathing randomized trial

- Source: https://pubmed.ncbi.nlm.nih.gov/41257401/
- Title: The Immediate Effects of a Resonant Breathing Exercise on Adolescents' Stress Responses: A Randomized Trial.
- Published online 2025; journal issue 2026. DOI: 10.1097/PSY.0000000000001448.
- Population: 150 adolescents aged 12–13.
- Protocol: visually guided resonant breathing versus spontaneous breathing with visual guidance, followed by a laboratory stressor.
- Findings: mixed physiological effects; no between-condition differences in affective responses, emotion regulation, or stress recovery. The target breathing pace was difficult to sustain.
- Limit: does not validate a continuous 3-second inhale / 6-second exhale protocol, all anxiety disorders, or Paasaa.
- Review depth: abstract assessed; detailed full-text protocol and adverse-event reporting require review.

## High-school feasibility pilot

- Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC9397716/
- Title: Slow-Breathing Curriculum for Stress Reduction in High School Students: Lessons Learned From a Feasibility Pilot.
- Year: 2022. DOI: 10.3389/fresc.2022.864079.
- Population: 43 consenting 12th-grade students, roughly age 17.
- Protocol: five-minute slow diaphragmatic breathing, three times weekly for five weeks, with education.
- Findings: adherence varied and decreased over time; anxiety changes were not statistically significant.
- Limit: small feasibility study, not proof of clinical efficacy or suitability for early teens.
- Review depth: abstract and indexed methods/results reviewed; full-text access was intermittent.

## Young-adult acute-stress trial

- Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC13321280/
- Title: Box breathing and prolonged exhalation reduces markers of physiological stress reactivity in response to a virtual trier social stress test.
- Year: 2026. DOI: 10.1016/j.cpnec.2026.100360.
- Population: 66 participants; group mean ages approximately 20–22.
- Findings: smaller post-stressor increases in state anxiety, heart rate, and salivary alpha-amylase for breathing groups; no significant differences for cortisol, HRV, or cognitive performance.
- Limit: laboratory acute stress is not evidence for treating all anxiety disorders or early teens. Reports describe intermittent 3-in/6-out breaths with normal breathing between cues, not our proposed continuous loop.
- Review depth: abstract and indexed results checked; exact timing/repetition remains pending primary full-text methods verification. Do not use this paper as validation of the prototype's exact rhythm.

## Practical clinical guidance

- Source: https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/
- Supports: gentle, comfortable breathing without forcing depth or timing.
- Limit: practical guidance, not a trial of 3-in/6-out breathing or Paasaa.

## Product decision

The 3-in/6-out rhythm is retained solely as a provisional design setting. No therapeutic efficacy, universal safety, or superiority claim is justified. Provide self-paced and stop/skip options. Obtain qualified clinical review addressing ages 13+, discomfort, duration, alternatives, and escalation wording before release.

## Evidence disclosure pattern

For every future exercise, show: what it aims to do; source link; who was studied; what was actually tested; findings; limitations; how Paasaa differs; and last review date. Mark unresolved evidence as unresolved. Do not imply a citation clinically validates the product.

## Daily self-monitoring (2026-09-30)

The custom daily check-in records intensity, emotions, body sensations, context, automatic thoughts, behavior and interference. It borrows self-observation concepts from the NHS thought-record resource; it does not implement the complete cognitive restructuring exercise and is not a validated diagnostic instrument: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/

Neither the 0–10 ratings nor the seven-day descriptive-average threshold has been validated as a Paasaa clinical measure. No diagnosis, predicted risk, causal interpretation, or treatment-effect claim is produced. Clinician review and youth-specific usability/safeguarding work are pending.

Support resources displayed with regional labels: https://988lifeline.org/ ; https://www.samaritans.org/how-we-can-help/contact-samaritan/ ; https://www.childline.org.uk/about/about-childline/ ; https://findahelpline.com/ . Service details checked against official pages in September 2026; periodically review them.

## Immediate support (2026-09-30)

Fixed scripts for targeted/full/discreet PMR, gentle breathing, grounding, performance/social support and non-reassurance thought-loop support are documented in `docs/immediate-support.md`. All require clinician review; no clinician reviewer is assigned. Evidence is adult-focused and does not validate this app's youth use, exact timing, two-round 16-group adaptation or outcome claims. Country-aware crisis links provide escalation, not risk assessment or contact on the user's behalf.

Evidence metadata and source links are kept in `src/support-content.js`; clinical review status remains `needs clinician review`. No new sleep claims, diagnoses, independent ERP exposures or AI-generated therapeutic advice are introduced.

## Conversational guide — October 1, 2026
- Educational basis: [NHS thought records](https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/) and [CCI worry and rumination resources](https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination).
- Use: explain thought records, distinguish practical action from uncertain predictions, and link to the existing worksheet. These are educational resources, not studies of this bot.
- Population and outcome limits: no Paasaa participant study, teen-specific validation, treatment effect size or validated crisis detection is claimed. Clinical review pending. The chat does not diagnose or forecast outcomes.
- Implementation and actual verification: see `chat-guide.md`.

## Adaptive conversation revision — October 1, 2026
- Readiness preference, optional stabilization and bounded branching are product adaptations, not validated diagnostic or therapeutic measures. No distress threshold is required to reflect.
- [NHS breathing guidance](https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/) supports comfortable, unforced breathing. The conversation offers an optional unpaced observation and alternatives; it does not claim to reproduce that full protocol.
- [CCI worry resources](https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination) describe problem-solving, helpful thinking and uncertainty. No generic research statistic is presented as an individual's likelihood.
- Teen-specific suitability, safety-routing sensitivity, long-term effects and the combined AI workflow remain unvalidated. Clinical review pending. See `chat-guide.md` for actual simulated and browser checks.


## Conversational intelligence engine V1
The separate safety classifier, planner, policy router, and response layer are engineering controls, not clinical validation. Existing intervention scripts and evidence notes are reused; clinician review remains pending. Groq model documentation supports API compatibility only. Initial synthetic live evaluations found invented instructions and safety false positives; retained reports document those failures and subsequent guard changes. Intended teen use has not been established by adult PMR evidence. Do not use these evaluation pass counts as treatment efficacy or diagnostic accuracy claims.

## Context-aware follow-ups — October 8, 2026
- Source: Judith Beck, [Why CBT Therapists Don’t Challenge Cognitions](https://beckinstitute.org/blog/why-cbt-therapists-dont-challenge-clients-cognitions-and-why-it-matters/) (2024). Educational clinical guidance on collaborative inquiry and checking a person's meaning, not a trial or chatbot training dataset.
- Product adaptation: interpret short answers in relation to the preceding question, clarify ambiguous “nothing” before storing an interpretation, accept corrections, and stop a confirmed chain of hypothetical consequences. Preserve original answers and ratings; do not manufacture positive conclusions.
- No private therapy records or transcripts imported. The authored prompts and deterministic transitions are not therapist training, treatment validation, or evidence of teen suitability. Population/protocol/outcome effect sizes: not applicable to this educational source. Clinical review remains pending.
