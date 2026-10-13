# Paasaa CBT pilot v0.1 — dataset card

**Status: synthetic design fixtures, review-only, rights unresolved. Not training data.**

Purpose: exercise a pipeline for investigating conversational context, autonomy, CBT-informed reflection, requested practical help, and safety boundaries. This pilot cannot demonstrate clinical effectiveness or model improvement.

## Composition

- 100 scenarios across 30 labeled families; 300 final-response candidates.
- 70 English, 10 Spanish, 10 Hindi, 10 Nepali; five explicitly code-switched scenarios (English-Hindi, English-Spanish, English-Nepali represented).
- 84 adult and 16 adolescent contexts. Adolescents represent ages 13–17 conceptually; inclusion does not establish suitability for teens.
- 82 routine, 10 clinical follow-up, three urgent, five possible medical emergencies. Risk labels are author-assigned, unvalidated labels rather than diagnoses.
- Three user turns and two assistant history turns per scenario, followed by two alternative drafts and an intentional negative. There are 300 possible six-message completions, not 300 independent scenarios.

## Origin and rights

Seeds, history, and templates were authored with Codex, then assembled deterministically. No generative teacher was called by the pipeline. This is not an ensemble, a clinician-authored dataset, or licensed clinical gold. No private user conversations, patient records, Groq evaluation outputs, or upstream LLM4CBT material were imported. Source: `codex_design_drafts` in the registry; license and model-development permissions unresolved, `allowed_for_training=false`, `allowed_for_commercial_use=false`.

The embedding model is used for local similarity analysis, not generating therapy text. Its software/model license does not grant rights to the input corpus. Distribution of this review pack is not permission to train on it.

## Review and quality

All clinical and language reviews are pending. No preferred/rejected pair has been adjudicated. Author-designated negative responses are only *proposed* negatives; a clinician must still compare them with the alternatives. Automatic flags never certify a reply as safe. They include English-centric pattern matching, some localized certainty phrases, repeated replies, and universal context-fidelity review.

Near duplicates are retained for review; groups prevent their separation in split rehearsal. Exact/normalized matching covers the full user-side sequence; embedding checks use context plus all user turns. Family/template constraints additionally keep parallel-language concepts together. All pilot content is exposed development material. No frozen final test exists.

## Biases and limitations

English dominates. Non-English examples are AI-authored and have not been reviewed by native speakers. Many parallel concepts are language variants, not culturally independent situations. Short meta-instructions in user turns often disclose the desired response; these create shortcut learning and must be replaced for a serious benchmark. Repeated assistant histories and negative templates reduce diversity. Candidate alternatives are not ranked; apparent warmth does not prove clinical competence. Heuristic false positives include quoted claims and negations; false negatives are also expected. Cosine threshold calibration and Nepali coverage remain open questions.

Children under 13, diagnosis, medication management, autonomous crisis handling, unsupervised exposure, and specialized treatment protocols are outside scope. Specialized topics appear only to review boundaries and referral behavior. This corpus is not representative of populations, symptom prevalence, severity, or clinical care pathways.

## Intended and prohibited uses

Use for inspecting design, validating infrastructure, and planning reviewed data collection. Do not use for SFT, DPO, distillation, clinical claims, diagnostic decisions, patient-facing advice, or clinical performance marketing. Do not label the 100 rows as 100 independently validated therapeutic conversations. Source rights and human review are separate requirements, and neither is satisfied by running tests.

Version manifest and measured counts are in `reports/build-manifest.json` and `reports/quality-report.json`. Preserve both when replacing drafts with permitted material.
