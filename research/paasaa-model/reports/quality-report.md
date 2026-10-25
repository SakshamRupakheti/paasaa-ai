# Pilot dataset quality report

Status: **review-only draft; not eligible for training.**

- 100 scenarios, 300 candidates, 30 scenario families.
- Languages: {'en': 70, 'es': 10, 'hi': 10, 'ne': 10}; age groups: {'adult': 84, 'adolescent': 16}.
- Schema validation: passed. Human reviews: 0. Training eligible: 0.
- Exact / normalized duplicate pairs: 0 / 0.
- Embedding check: completed. Near-duplicate pairs: 5; scenario clusters: 96.
- Repeated candidate instances beyond the first: 106. These are flagged, not removed.
- Dry-run split sizes: {'train': 80, 'validation': 10, 'test': 10}; groups: 30; cross-split semantic pairs at configured threshold: 0.
- This is not a frozen holdout; all 100 examples are development/review data.

## Limitations and review priorities

- Draft templates are not independent teacher outputs.
- All source rights, clinical reviews, and native-language reviews pending.
- Pilot is development material, not an independent benchmark.
- Heuristics cannot establish safety; false positives and missed hazards expected.
- Similarity threshold needs calibration; English-heavy and very small per-language samples.
- Repeated assistant histories and response templates reduce effective diversity. No claim of 100 unique therapeutic processes.
- Some user turns explicitly request the target behavior, a shortcut unsuitable for a final benchmark.

Inspect safety examples first, then corrections/refusals, context mismatch, translated/code-switched examples, and near-duplicate clusters. Replace generic history turns before expanding. Do not scale simply by paraphrasing.

Full counts and flags: `quality-report.json`. Pair list: `duplicate-review.json`. First 20: `first-20-examples.md`.
