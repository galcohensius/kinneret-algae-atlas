---
name: update-atlas
description: Use when the user says mom sent new Word files for the Kinneret Algae Atlas and they've copied them into data/raw/. Runs the Word-to-site pipeline, commits, previews locally, waits for the user to push, verifies the deploy, and drafts the reply email to mom.
---

# Update the atlas from new Word files

Trigger: user has copied new/replacement `.docx` files into `data/raw/` (from mom's email) and asks to update the atlas.

1. **Survey.** `git status` on `data/raw/` to see what's new. For each file, read enough of it (or the diff against any same-species file it replaces) to know whether it's an update or a new species, and whether the species name itself changed (check for a "previous name" / synonym note).
2. **Run the pipeline** per `docs/MAINTENANCE.md` → "Updating the atlas from a new Word file". Prefer `npm run sync:atlas` for a full refresh (covers extraction, validate, llms, search-index, build). Raw filenames don't need to match current taxonomy and old files don't need manual deletion — `git add -A` picks up the rename.
3. **Run the full suite before anything else depends on it passing:** `npm run test:py`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:export`. All green before continuing.
4. **Decide if a new test is needed.** Routine add/update of a species does not need one — the suites are generic over all records. Only add a test if this update introduced something the schema/suite doesn't already cover (new phylum, new field, a new kind of rename pattern).
5. **Preview.** `npm run dev -- -p 3111` in the background (kill it when done), open the new/changed species pages in the browser: plates render, captions correct, species count and phylum tally on `/` updated, and — if the species was renamed — search resolves it by the old name too.
6. **Flag, don't fix, source issues.** Typos, mislabeled figure numbers, inconsistent captions in the Word file itself go back to the user to relay to mom — never patched into the extracted JSON (Word is the source of truth). She fixes her Word file and resends it; never word this as us fixing it ("so I can fix the caption" is wrong) — always "could you fix X in the Word file and resend."
7. **Commit locally** (file list in `docs/MAINTENANCE.md` step 10). Do not push.
8. **Hand off:** tell the user what's committed and ask them to push — pushing is a production deploy of kinneret-algae-atlas.org (see `kinneret-atlas-deploy` memory).
9. **After they say it's pushed:** `gh run list --workflow deploy-pages.yml --limit 3` to confirm the deploy succeeded, then spot-check the live site for the new/changed content.
10. **Draft the reply to mom** (draft only — never send): what was added/updated, plus every source issue flagged in step 6 as things for her to check or fix.
