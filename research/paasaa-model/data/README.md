# Data directories

- `raw/`: synthetic seed fixtures only, no patient records.
- `generated/`: review-only scenarios, conversations and unselected preferences.
- `reviewed/`: validated review batches, ignored by Git to avoid accidental identity disclosure.
- `train/`, `validation/`, `test/`: deliberately empty; no training export or frozen holdout at this milestone.

Do not move generated fixtures into training directories to bypass source-rights and clinical-review gates. See the dataset card.
