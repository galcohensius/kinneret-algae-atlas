# Kinneret Algae Atlas

Digital preservation and publication pipeline for a long-term scientific catalog of Lake Kinneret algae.

## Vision

This repository is the technical foundation for publishing a serious algae research archive as a searchable public atlas.

The goal is to turn legacy research files (Word documents with images and scientific notes) into structured, reusable data that can power:

- a visual catalog with one page per algae taxon,
- filters by biological attributes (for example color, morphology, seasonality),
- and a stable long-term web presence under a dedicated domain.

## What This Repo Does Today

The current implementation focuses on the data layer:

- Reads `.docx` research files.
- Detects record boundaries by scientific-name patterns.
- Extracts sectioned content (for example morphology, ecology, notes).
- Outputs normalized JSON records for downstream website usage.

In short: this repo already solves the "Word -> structured data" problem.

## Why This Architecture

For a research legacy project, it is important to separate concerns:

1. **Data extraction (Python):** convert source documents into clean records.
2. **Presentation (web app):** display cards, detail pages, and filters.

This keeps the system maintainable:

- parser rules can evolve without breaking the frontend,
- website design can evolve without changing the source documents,
- and future contributors can work independently on data vs. UI.

## Repository Structure

```text
kinneret-algae-atlas/
├── data/
│   ├── raw/                    # Original source files (do not edit)
│   ├── processed/              # Generated JSON outputs
│   └── interim/                # Optional intermediate artifacts
├── src/
│   ├── extract_algae.py        # CLI entrypoint
│   └── algae_extractor/
│       ├── parsers/            # Record-start and section parsing helpers
│       ├── config.py           # Config loading
│       ├── default_config.json # Extraction rules (aliases/patterns)
│       ├── models.py           # AlgaeRecord data model
│       ├── pipeline.py         # Extraction orchestration
│       └── reader.py           # DOCX paragraph reader/normalizer
├── requirements.txt
└── README.md
```

## Quick Start

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run extraction with defaults:

```bash
python src/extract_algae.py
```

4. Or run with explicit paths:

```bash
python src/extract_algae.py --input "data/raw/Atlas-Examples to Gal V2.docx" --output "data/processed/algae_records.json" --config "src/algae_extractor/default_config.json"
```

## JSON Output Shape

Each extracted algae record currently looks like:

```json
{
  "scientific_name": "Ceratium hirundinella",
  "sections": {
    "morphology": "...",
    "ecology": "...",
    "notes": "..."
  },
  "metadata": {
    "source_file": "Atlas-Examples to Gal V2.docx"
  }
}
```

This schema is intentionally simple and can later be expanded with explicit fields such as image links, taxonomy hierarchy, and filter tags.

## Configuration and Extension

To support additional document styles or new section types:

- Edit aliases and patterns in `src/algae_extractor/default_config.json`.
- Tune record-start detection and filtering rules in the same config.
- Add reusable parser helpers under `src/algae_extractor/parsers/`.

## Next Milestones

- Improve extraction quality across a larger corpus (hundreds of taxa).
- Add automated tests for parser regressions.
- Enrich records with structured attributes for filtering in UI.
- Build a public frontend atlas (cards + detail pages + faceted filters).
- Deploy with a dedicated domain for long-term scientific access.

## GitHub Pages

The Next.js app is configured for **static export** (`output: "export"`). Deploy from GitHub:

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment:** set **Source** to **GitHub Actions**.
3. On each push to `main`, the workflow **Deploy to GitHub Pages** builds `out/` and publishes it.

With the **custom domain** in `public/CNAME`, GitHub Pages serves the site at the **root** of that domain. The deploy workflow therefore builds **without** `NEXT_PUBLIC_BASE_PATH` (same as a local `npm run build`), so asset and app paths stay `/…` and do not break.

If you ever need the **default project URL** only (`https://<username>.github.io/<repository-name>/`), add a build env in `.github/workflows/deploy-pages.yml`:

```yaml
env:
  NEXT_PUBLIC_BASE_PATH: /<repository-name>
```

(use the real repository name, no trailing slash). Do not use that together with a custom domain served at `/`.

Local static build (root, no subpath):

```bash
npm run build
# output in ./out
```

## Suggested Publication Path

- **Domain:** use a dedicated non-governmental domain (for example `.org.il` or `.org`).
- **Hosting:** static hosting (GitHub Pages, Vercel, Netlify) is enough for a JSON-driven atlas.
- **Content workflow:** keep Word files as source-of-truth, regenerate JSON via this pipeline, redeploy website.

This gives a stable, professional home for a life-long research archive.

