# Paasaa model research — pilot v0.1

This is a separate, **review-only research workspace**, not a trained Paasaa-3B/7B model. The live application, Groq provider, safety engine, accounts, and storage are unchanged.

The first implementation contains 100 synthetic scenario fixtures, three draft endings each, strict schemas, taxonomy, source rights gates, local embedding duplicate triage, conservative split proposals, and a review export/import workflow. **No fixture is eligible for training.** See [quality report](reports/quality-report.md) and [first 20 examples](reports/first-20-examples.md).

## Run on Windows (Python 3.12)

From this directory:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock.txt
.\.venv\Scripts\python.exe research.py build
.\.venv\Scripts\python.exe research.py validate
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

The first full build downloads the pinned multilingual embedding model into ignored `.cache/`. It runs locally on CPU with remote code disabled. Subsequent runs can use `$env:HF_HUB_OFFLINE='1'`. No generative API key is needed. `build --skip-embeddings` makes a quick draft and explicitly reports that semantic checks did not run; it is not a substitute for a full build. The build rewrites generated artifacts, not imported review batches. Commit code before a release build; the manifest records the base Git commit, source hashes, config, seed, embedding revision, and build time. Generation is deterministic apart from the timestamp/manifest.

## What is actually implemented

| Area | Implementation |
|---|---|
| Data contract | Strict scenario, conversation, candidate, preference and review JSON schemas |
| Coverage | 30 scenario families; adults and adolescents; English, Spanish, Hindi, Nepali and mixed language |
| Conversation | Three user turns, two assistant history turns, three alternative final replies |
| Generation | Deterministic AI-assisted design templates; two unreviewed alternatives and one intentional negative |
| Teachers | Provider-neutral callback and import adapter with mandatory rights checks, supporting six source types; no approved external teacher configured |
| Quality | Schema and association validation; review flags for claims, resources, style, repetition and context fidelity |
| Deduplication | Exact, Unicode-normalized, pinned multilingual embedding cosine pairs, transitive clusters |
| Splits | Union scenario family, conversation family, template origin, and semantic pairs before a size-balanced 80/10/10 allocation proposal with seeded tie breaks |
| Review | UTF-8 CSV and JSONL export, eight ratings, approve/edit/reject, preference, rationale, pseudonymous identity; hash-bound validated JSONL import |
| Training gates | Rights, pilot approval, independent holdout, clinical and language reviews; all current fixtures blocked |

## Review workflow

1. Open `reports/first-20-examples.md`, then `reports/review_queue.csv` in a spreadsheet. All ratings and decisions begin blank. Intentional negatives are clearly labeled; do not show this corpus to end users as advice.
2. Review context and every history turn as well as the final answer. Prioritize urgent/medical cases, refusals/corrections, wrong-context templates, and language quality. Automatic flags are triage, not verdicts.
3. Rate all eight dimensions 1–5. For a reply without a question, rate whether *not asking* was appropriate under next-question quality. Record a pseudonymous reviewer ID, role, decision, preferred candidate, optional rationale, native-language review, and whether flags are resolved. Preference selection is independent of SFT approval.
4. Save a copy of the completed CSV; use `research.py import-review PATH.csv`. Blank-decision rows are skipped; completed rows require all ratings and `true`/`false` for both review flags. Alternatively supply JSONL matching `schemas/evaluation.schema.json` (nested `ratings`, nullable empty preference/edit fields, actual booleans). No patient data or reviewer real names are necessary.
5. Import rejects stale content hashes, invalid ratings, wrong candidate associations, and duplicate batches. EDIT records a proposed revision; it does not silently approve the edit. Revise the source, rebuild, and review the new hash. Conflicting reject/edit decisions remain blocking.

There is intentionally **no train command, SFT export, frozen test set, research endpoint, or deployment** at this milestone. User inspection alone does not establish source rights or clinical approval. Preference files remain unselected; intentional negatives can later serve as rejected examples only after comparison review, never as SFT targets.

## Data rights and teacher integration

`source_registry.json` records name, type, license, training/commercial permissions, review status, and check date. These fixtures were authored with Codex; internal synthetic origin does not itself grant distillation rights. Their permissions are unresolved and disabled. This is an infrastructure demonstration, not a cleared synthetic training corpus. No Groq evaluation outputs, production chats, scraped counseling transcripts, or LLM4CBT prompts/data were imported.

An approved source can be wired through `ApprovedTeacher(source, model, generate_callable)`. The adapter checks rights **before invoking** the callback, and checks 3–5 nonempty replies afterward. `import_candidates` validates source permission and provenance for external exports; callers then construct the strict candidate/conversation records. A runtime local-model loader or commercial API transport is deliberately not configured before source/model approval. Do not label that boundary as a completed multi-model teacher ensemble.

Applicable provider terms must be checked for the specific contract and intended model-development use. References checked October 13, 2026: [OpenAI services agreement](https://openai.com/policies/services-agreement/), [terms of use](https://openai.com/policies/terms-of-use/). This registry is conservative engineering, not a legal opinion.

## Deduplication and evaluation limits

The embedding model is [multilingual MiniLM-L12-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2), Apache-2.0, with a pinned revision in dataset.yaml. Similarity uses [Sentence Transformers](https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html). Long inputs are chunked rather than silently truncated. The 0.83 cosine threshold is provisional, particularly for Nepali and code switching. Inspect pairs and misses with native reviewers before calibrating it. Near duplicates are retained for adjudication and locked into groups; no claim of 100 independent situations is made.

Family-wide grouping is deliberately conservative and may leave uneven or empty splits. Do not force the target ratios by breaking groups. All pilot examples have been exposed for development; create an independently authored benchmark later and freeze it **before** prompt/model tuning. The current split report is only a leakage-control rehearsal.

## Next milestone, after inspection

Replace or clear the source drafts with permitted teacher/manual/clinician material; improve histories and remove meta-instruction shortcuts; obtain clinical and native reviews; adjudicate duplicate clusters. Then design and freeze independent evaluation, select a licensed 3B–8B instruction model and hardware, lock a manifest, and implement LoRA/QLoRA before scaling 100 → 1k → 5k → 10k. DPO, clinical RAG, state-machine ablations, inference gateway, blinded ratings and statistical comparisons remain planned. Do not purchase GPU capacity or begin training from this scaffold.

See [dataset card](DATASET_CARD.md), [untrained model status](MODEL_CARD.md), [experiment log](EXPERIMENT_LOG.md), and [research summary](reports/research-summary.md).
