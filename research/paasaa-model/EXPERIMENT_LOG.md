# Experiment log

## R001 — research pipeline pilot, 2026-10-13

Hypothesis: a small synthetic review pack can expose data-quality and rights blockers before expensive model training. This is an engineering pilot, not a test of therapeutic effectiveness.

Model: no generative model called. AI-assisted fixtures and deterministic response templates. Multilingual MiniLM-L12-v2 used locally for similarity only, revision recorded in the manifest.

Dataset/configuration: `paasaa-cbt-pilot-v0.1`; 100 scenarios, three final candidates each; seed 42; semantic cosine threshold 0.83; see `configs/dataset.yaml`.

Observed results: strict schemas pass; 300 candidate drafts exported; five semantic near-duplicate pairs at the configured threshold; no exact or normalized full-sequence duplicates. All 300 candidates remain ineligible for training. Current detailed counts and group allocations are in `reports/quality-report.json`.

Unexpected/useful findings: shared family templates initially responded with details from the wrong scenario. Context-specific alternatives were added, but every candidate still requires context review. Shared negative responses produce substantial repetition. A naive hash split left no test bucket; group-size allocation was substituted while preserving connected groups. This is still only a split rehearsal, not a real holdout.

Limitations: rights pending, no clinical/native-language reviews, English-heavy, short conversations, explicit target-behavior hints in user turns, threshold not calibrated, no independent test, no training or efficacy result.

Next experiment: inspect the first 20 and safety subset; replace/clear source material, collect actual reviews, improve turn histories and blinded benchmark design. Only then propose the first LoRA run.

## Planned experiments — not executed

Compare base, prompt-only, SFT 1k, SFT 5k, SFT 10k, SFT+DPO, SFT+state machine+RAG under identical test conditions. Separate training and judge identities; make blinded human/clinician ratings primary. Predefine paired bootstrap intervals, effect sizes, and inter-rater agreement methods. Record failures, refusals, invalid generations, subgroup sample sizes, and costs. Do not compute significance from synthetic placeholder ratings.
