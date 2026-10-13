# Paasaa model research: pilot infrastructure report

## Abstract

We implemented an isolated pipeline for preparing and reviewing synthetic conversational design fixtures. The pilot contains 100 scenarios and 300 candidate endings spanning 30 categories and four languages. It validates schemas, triages language/behavior hazards, detects duplicates using a pinned local embedding model, proposes grouped splits, and exports human review records. No training, clinical evaluation, or model comparison was performed. All fixtures remain blocked from training by unresolved source rights and absent clinical/native review.

## Introduction and related work

The planned question is whether an instruction-tuned 3B–8B model can improve on its own base and prompt-only versions after permitted, reviewed conversational training. [LLM4CBT](https://github.com/yjkim-stat/LLM4CBT) is a reference implementation for a CBT alignment proof of concept and simulation workflow; it is not evidence that Paasaa has trained a model or obtained a clinically validated therapy dataset. The repository and [Kim et al. paper](https://doi.org/10.3389/fpsyt.2025.1583739) inform research design only here. No code, prompts, transcripts, or weights from that project were copied.

## Methods and dataset

The repository audit found an existing JavaScript application and a small isolated CBT prompt comparison harness. That harness evaluates the current Groq path; it is not a fine-tuning pipeline. The new Python project lives under `research/paasaa-model`, excluded from Vercel uploads.

The pilot authors three user turns per scenario and two assistant history turns, with three alternative final replies. Scenario metadata records age group, category, context, language mix, risk tier, desired skill, prohibited behavior, goal, source and content hash. The source registry defaults uncertain sources out of training. Templates are AI-assisted review fixtures, not an approved teacher corpus. Historical commercial-provider evaluation outputs are excluded.

The [Sentence Transformers similarity method](https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html) is applied using [multilingual MiniLM](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2), pinned by revision, running on CPU. Exact and normalized matches, cosine matches, and connected components are reported. Family, template, conversation and semantic constraints are unioned before split rehearsal. No final holdout is assigned from this exposed pilot.

## Results and failure analysis

Measured infrastructure outputs: 100 schema-valid scenarios, 300 candidate endings; 70/10/10/10 en/es/hi/ne; 84 adult and 16 adolescent contexts. Five scenario pairs exceeded provisional cosine 0.83; zero exact/normalized full-sequence duplicates. No reviewed or training-eligible candidate exists. This does not establish clinical quality, sensitivity, specificity, or language competence.

Remaining failures include repeated negative templates, generic intermediate turns, potential context mismatches, unreviewed translations, and target-behavior hints in user prompts. The report keeps flagged examples instead of hiding them. Human review must judge the entire conversation, not only the final response. Embedding misses remain possible, especially across languages; a clean split at one threshold is not proof of independence.

## Training, benchmark, and ablations

| Study arm | Status | Measured quality/safety |
|---|---|---|
| Base 3B–8B | Planned; model unselected | Not measured |
| Base + CBT prompt | Planned on the same future base | Not measured |
| SFT 1k / 5k / 10k | Planned, gated | Not measured |
| SFT + DPO | Planned, no adjudicated preferences | Not measured |
| SFT + state machine + RAG | Planned | Not measured |

Future reporting must lock model, dataset, seeds, learning rate, epochs, batching, LoRA configuration, sequence length and hardware before running. A separate benchmark must be authored and frozen before prompt/model development. Blinded human ratings are primary; an LLM judge can be secondary. Report means, medians, variation, paired confidence intervals/effect sizes and reviewer agreement only after collecting actual scores. Do not use BLEU/ROUGE as a proxy for therapeutic quality.

## Safety and multilingual analysis

The pilot distinguishes routine distress, clinical follow-up, urgent support and possible medical emergency by author labels. Safety-sensitive rows are exported separately as a **development review subset**, not an independent safety benchmark. Emergency drafts offer human help; historical self-harm is not automatically labeled urgent. No generated phone numbers, treatment protocols, medication instructions, autonomous diagnosis, or claimed clinician monitoring are added.

Non-English samples and code switching require native review; inclusion is not successful multilingual evaluation. Adolescents are represented but unvalidated. Future tests should measure both missed risk and unnecessary escalation and assess refusals, abuse/coercion, prompt injection and ambiguous hopelessness with independent cases.

## Limitations, ethics, and next steps

The key unresolved dependencies are source/model permissions, clinical and native-language review, data diversity, independent evaluation and hardware choice. No patient records are used. No claims of treatment efficacy, therapist equivalence, medical-device approval or compliance are supported. The next milestone is a concrete review and source-replacement decision, not immediate training or production model replacement.
