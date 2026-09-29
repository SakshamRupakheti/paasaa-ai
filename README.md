# Paasaa.ai

**your best space**

An early-stage mental health support concept for people aged 13 and up who experience anxiety. We are developing one small, reviewable feature at a time, beginning with a breathing screen. CBT-based support is a later milestone.

## Current status

Interactive design prototype only. No AI model, therapy service, accounts, analytics, or health-data storage is implemented. The proposed 3-second inhale / 6-second exhale rhythm is provisional and has not been validated as a Paasaa intervention for teens. The anatomical diagram is an early functional draft, not final artwork.

## Preview locally

With Node.js 22 or newer:

```sh
npm start
```

Open http://127.0.0.1:4173. No dependencies or API keys are required. Alternatively, open `src/index.html` directly in a browser.

```sh
npm run check
```

This verifies JavaScript syntax; it does not establish browser accessibility or clinical validity.

## Project structure

- `src/`: standalone opening-screen prototype, styles, and interactions.
- `docs/product-brief.md`: agreed audience, scope, and design direction.
- `docs/evidence-register.md`: sources, findings, limitations, and review status.
- `docs/roadmap.md`: small milestones and outstanding decisions.
- `scripts/`: dependency-free local preview server.
- `.github/`: automated syntax checks and a pull request template.

## Development workflow

Keep changes focused on one milestone. Use feature branches and pull requests after this initial repository setup. Record evidence alongside any health-related claim. Never commit credentials or real users' mental health information. See `AGENTS.md` for project instructions.

No public release or clinical validation is implied by this repository. An open-source license has not been selected.
