# Foundation pipeline examples

These three files are original synthetic engineering fixtures, not patient records, clinician ratings, or training data. Null evaluation scores mean no human rating was performed.

From the repository root:

```powershell
node scripts/foundation-research.mjs validate-corpus research/paasaa-model/foundation-examples/corpus.json
node scripts/foundation-research.mjs summarize-evaluation research/paasaa-model/foundation-examples/evaluation.json work/foundation-evaluation.json
node scripts/foundation-research.mjs review-synthetic research/paasaa-model/foundation-examples/review.json work/foundation-review.json
node scripts/launch-readiness.mjs
```

The owner dashboard can download the same synthetic review input format. The offline review command records transitions and corrections; its reviewer label is not verified clinical identity. Dataset candidates require separate rights, consent, de-identification, and clinical approval evidence. Even a candidate does not authorize training. No production conversation is imported by these commands.

Every evaluation dimension uses 1 (poor) to 5 (good). For error dimensions such as hallucination, false reassurance, and premature advice, 5 means the error is absent; do not reverse the direction. These are descriptive reviewer ratings, not validated clinical outcome instruments. Establish inter-rater reliability, language and age-stratified held-out cases, and prospective clinical evaluation separately.
