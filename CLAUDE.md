# Kinneret Algae Atlas

Static Next.js site built from Dr. Tamar Zohary's Word files. Readers are algae researchers, many not technical: weigh usability for them. Setup, scripts and routes: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Pipeline and update checklist: [docs/MAINTENANCE.md](docs/MAINTENANCE.md).

## Content rules

1. **Word is the source of truth.** Never edit files under `data/raw/`. Report source typos, wrong units or other content errors to the user instead of patching extracted JSON or code to hide them.
2. **Never hand-edit `data/processed/`.** Fix `src/algae_extractor/`, `src/extract_*.py` or ask for a corrected `.docx`, then re-run the extraction yourself in the same change. A hand edit is only a local experiment and must be folded back into the extractor.
3. **Follow the Word file's layout** (section order, headings) unless the user decides otherwise.

## Workflow

- New Word files from mom: the `update-atlas` skill runs the whole update.
- Before committing, all green: `ruff check src scripts tests`, `npm run test:py`, `npm run lint`, `npm test`, `npm run build`, `npm run test:export`.
- User-visible changes: preview on the dev server (`npm run dev -- -p 3111`) in the browser before committing.
- Commit to `main` locally; never push. The user pushes, and a push to `main` deploys https://kinneret-algae-atlas.org/.
