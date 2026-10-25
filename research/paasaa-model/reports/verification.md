# Verification — October 13, 2026

- Full pilot build completed with the pinned multilingual embedding model on local CPU (network disabled after initial model download).
- 100 scenarios / 300 candidates validated against the generated schemas; exact/normalized and embedding duplicate checks completed.
- 22 Python unit tests passed, including CSV review round-trip, stale review hashes, wrong candidate associations, source denial before teacher invocation, intentional-negative exclusion, review conflicts, all eligibility gates, and grouped leakage detection.
- `npm run check` passed (application JavaScript syntax checks). No live application interaction or production deployment was performed because this change adds offline research tooling.
- Human/clinician ratings, native-language review, model training, model inference comparisons, clinical safety performance and therapeutic outcomes were **not tested**. Unit tests do not establish them.

The repository contains no downloaded embedding weights or virtual environment; both are ignored. `research/` is excluded from Vercel uploads. Review batches are ignored. Only synthetic draft fixtures and documentation are committed.
