# Kinneret Algae Atlas

This site is the **algae atlas of Dr. Tamar Zohary**—a lifelong research effort documenting the algae of **Lake Kinneret** (the Sea of Galilee). The atlas brings together scientific descriptions, imagery, and ecology drawn from that work into a public, browsable catalog.

**Live site:** [http://kinneret-algae-atlas.org/](http://kinneret-algae-atlas.org/)

## Repository

This repository hosts the data pipeline (Word → structured records) and the static web app that publishes the atlas.

## Copyright

© All rights reserved. The scientific knowledge in this atlas is that of **Dr. Tamar Zohary** and **Dr. Alla Alster**.

## Updating the atlas from a new Word file

When `data/raw/` gets an updated `.docx`, run these steps in order (from the repository root).

1. **Add or replace the file** under `data/raw/` (keep a clear filename, e.g. `1 Dinoflagellates workfile for Gal YYYY-MM-DD.docx`).

2. **Optional:** If the canonical filename changed, update defaults so ad-hoc runs stay correct:
   - `src/extract_algae.py` (`--input` default)
   - `package.json` (`sync:atlas` script)

3. **Extract JSON and images** (always run after changing the Word source or the Python extractor):

   ```bash
   python src/extract_algae.py --input "data/raw/<your-file>.docx" --output "data/processed/algae_records.json" --images-dir public/algae-images --use-word-renderer
   ```

   Or, if defaults already point at the right file:

   ```bash
   python src/extract_algae.py --use-word-renderer
   ```

   For multi-doc builds, repeat `--input` (one per file), or omit `--input` to auto-discover all
   `data/raw/*.docx` files except names matching `*suppl*.docx`.

4. **Validate processed data** (matches CI):

   ```bash
   npm run validate:data
   ```

5. **Tests** (optional locally; required on push via GitHub Actions):
   - Node: `npm run test`
   - Python: `PYTHONPATH=src python -m unittest discover -s tests -p "test_pipeline*.py" -v`  
     (PowerShell: `$env:PYTHONPATH='src'; python -m unittest discover -s tests -p "test_pipeline*.py" -v`)

6. **Local preview:** `npm run dev`

7. **Publish:** Commit the updated `data/processed/algae_records.json`, `public/algae-images/`, and any `src/` or config changes, then push to **`main`**. GitHub Actions builds and deploys GitHub Pages when the workflow passes.

**One-shot extract + validate + production build** (still commit and push yourself):

```bash
npm run sync:atlas
```

Structural or recurring extraction bugs belong in `src/algae_extractor/` (and re-run step 3)—not in hand-edits to `algae_records.json` that the next extract would overwrite.
