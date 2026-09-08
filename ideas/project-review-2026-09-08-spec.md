# Project review 2026-09-08 — spec

Findings from a full read-only scan of the web app (`app/`, `lib/`), the Python pipeline
(`src/`, `scripts/`, `tests/`), the docs, and CI. Each section is one reviewable, separately
committable change. Each heading carries a checkbox; it is ticked (`[x]`) only after the change
is implemented, verified, and committed.

Priority: **P1** fix soon (user-visible or data-affecting) · **P2** accessibility and
robustness · **P3** docs and process · **P4** cleanup. Within a group, sections are in the
suggested implementation order.

Excluded on purpose: content gaps that belong to the authors, not the code — the empty
`ecology` section of *Peridiniopsis cunningtonii var. quinquecuspidata*, and the About
page's "How to use this atlas [to be written]" placeholder.

---

## P1 — Bugs

### [ ] 1. Legacy `/algae?q=` search links land unfiltered

**Why.** `app/algae/AlgaeLegacyRedirect.tsx` redirects `/algae?q=term` to `/?q=term`, but
`AlgaeIndexSection` starts with an empty query and never reads `?q=`. Bookmarked or shared
searches silently show the full index. The comment in `app/algae/page.tsx` claiming the
query is preserved is false.

**Change.** In the mount effect of `AlgaeIndexSection`, read `q` from `location.search`;
when present, set the query and call `activateSearch()` so the index loads.

**Acceptance.** Opening `/?q=peridinium` shows the filtered list with the count line.

**Effort.** Tiny.

---

### [ ] 2. Hero image script squashes non-square photos

**Why.** `scripts/optimize-hero-image.py` resizes to a fixed `max_px × max_px` square. It
only worked because the current photo is square. It also overwrites its input in place.

**Change.** Scale by `max_px / max(width, height)` preserving aspect ratio; write to an
output path (default: alongside the input with a suffix) instead of overwriting; add the
script to the docs as a manual tool (see §14).

**Acceptance.** A 3:2 test image comes out 3:2; the source file is untouched.

**Effort.** Tiny.

---

### [ ] 3. Chart-renderer test skips forever; two diagnostic scripts cannot run

**Why.** `tests/test_chart_fallback_render.py` looks for
`data/raw/1 Dinoflagellates 2026-06-10.docx`; the repo has the 2026-08-07 file, so the only
test of the OOXML-chart fallback renderer (~150 lines of `reader.py`) has been skipped in CI
since the rename. `scripts/diagnose_dino_charts.py` and `scripts/inspect_dino_chart_xml.py`
hardcode the same missing file (and one hardcodes relationship ids from one revision);
nothing references them.

**Change.** Test: glob `data/raw/*Dinoflagellates*.docx` and take the newest, as
`extract_glossary.py` already does for its input. Scripts: delete both.

**Acceptance.** `python -m unittest discover -s tests` reports 0 skipped.

**Effort.** Tiny.

---

### [ ] 4. `about.json` date will move backwards on the next extraction

**Why.** Committed `record_updated` is 2026-08-07; the Word file's core-properties modified
date is 2026-08-01, which is what `extract_about.py` reads. The next run rewrites the
published date six days earlier with no other change.

**Change.** Decide which date is true. Either re-save `1-About.docx` (so its modified date
is ≥ 2026-08-07) or re-run `npm run extract:about` and commit the 08-01 date knowingly.
Also: `extract_about.py` reads raw `para.text`, bypassing the glyph normalization every other
extractor uses (Greek letters, µ, °, super/subscripts); route it through
`paragraph_clean_text`.

**Acceptance.** `npm run extract:about` produces no diff; a `µ` in the About source survives
into `about.json`.

**Effort.** Tiny (decision needed from Gal on the date).

---

### [ ] 5. Supplement images use a weaker TIFF conversion than species images

**Why.** `supplement_pipeline.py` converts TIFF with a bare `Image.open(...).save(...)`: no
mode conversion (CMYK/palette would raise), no context manager. `pipeline.py` has
`_tiff_blob_to_png_bytes` that handles these cases. Same file also builds the public URL
without stripping a trailing slash from the prefix (species path does), so
`--images-public-prefix /algae-images/` yields `//` URLs.

**Change.** Move `_tiff_blob_to_png_bytes` and `_save_image` into `image_optimize.py` (or a
new shared module) and call them from both pipelines; `rstrip("/")` the prefix.

**Acceptance.** A CMYK TIFF in a supplement document converts; existing outputs unchanged
(diff `data/processed/supplements.json` before/after).

**Effort.** Small.

---

### [ ] 6. Glossary plate links are hardcoded to two plates

**Why.** `GlossaryPageClient.tsx` string-matches `"Cox (1996) Plate 1"` / `"Plate 2"` and
hardcodes their anchors, while the actual anchors come from `plate.id` in the data. A third
plate, or a relabel, produces dead in-text links. Plate `src` also bypasses
`publicAssetPath` (only matters for base-path builds, but every other image uses it).

**Change.** Build the split regex and hrefs from the `plates` prop (`label`, `id`); wrap
`src` in `publicAssetPath`.

**Acceptance.** Definitions still link to both plates; no literal plate names in the
component.

**Effort.** Tiny.

---

### [ ] 7. Glossary first-occurrence tracking can drop every popover

**Why.** `GlossaryLinkScopeProvider` records claimed slugs in a `useRef` `Set` that is never
reset. Any second render pass (React StrictMode in dev, a retried render, a future stateful
parent) finds all slugs already claimed, so no term gets a popover.

**Change.** Compute first occurrences deterministically before render (server side or in a
`useMemo` over the content order) and pass a boolean down, instead of mutating a ref during
render.

**Acceptance.** Popovers appear with StrictMode on; SSR and client markup match.

**Effort.** Small.

---

### [ ] 8. Local Python venv is broken (repo moved)

**Why.** `.venv/pyvenv.cfg` and `.venv/bin/pip` still point at
`~/Developer/kinneret-algae-atlas`; the repo now lives under `~/Developer/others/`. Any `pip
install` fails with "bad interpreter". Local only, not a repo change — listed so it is not
forgotten.

**Change.** `rm -rf .venv && python3.12 -m venv .venv && .venv/bin/pip install -r
requirements.txt` (3.12 to match CI; see §16).

**Effort.** Tiny.

---

## P2 — Accessibility

### [x] 9. Phylum chip text fails colour contrast in both themes

**Why.** `.phylum-jump-nav a` uses the phylum accent as text colour. On the light card,
euglenophyta is 1.98:1, charophyta 2.28:1, cryptista 2.94:1, cyanobacteriophyta 3.68:1; in
dark mode dinoflagellata 2.09:1, rhodophyta 2.33:1, haptophyta 2.83:1, bacillariophyta
2.91:1, chlorophyta 2.92:1. WCAG AA requires 4.5:1. The audience skews older; this is the
most-clicked control on the home page.

**Change.** Keep the accent for the pill border (and optionally a leading dot); set the label
to `var(--text-primary)` with the popular name in `var(--text-muted)`. Same treatment for
any other place the accent is used as text (check the glossary legend items: they already
use a dot + neutral text, keep that).

**Acceptance.** Every chip label ≥ 4.5:1 in both themes (compute with the palette in
`lib/phylum-catalog.ts`); a unit test over the palette guarding the ratio is cheap and
prevents regressions when phyla are added.

**Effort.** Small.

---

### [x] 10. View switch has no keyboard support; panel structure is wrong

**Why.** `role="tablist"` / `role="tab"` without arrow-key handling, roving `tabIndex`, or
`aria-controls`; both tabs are in the tab order. The search box and phylum chips sit
outside the phylum `tabpanel` they belong to.

**Change.** Add `aria-controls` + panel ids, `tabIndex` 0 on the selected tab and -1 on the
other, ArrowLeft/ArrowRight/Home/End handling, and move the search + chips inside the phylum
panel. Alternative if this feels heavy: drop the tab roles and make it two plain toggle
buttons with `aria-pressed` (no keyboard contract to satisfy). Recommend the alternative —
simpler, and the pattern is already used by the legend.

**Acceptance.** Keyboard-only switch between views; screen reader announces state.

**Effort.** Small.

---

### [x] 11. Focus visibility

**Why.** `.glossary-term-trigger:focus-visible` sets `outline: none` (focus conveyed by colour
only). No `:focus-visible` rule exists for `.site-nav a`, `.site-brand`,
`.phylum-jump-nav a`, `.glossary-letter-nav a`, `.algae-detail-nav a`, further-reading links;
they rely on the UA default against accent-coloured pills.

**Change.** One shared rule `a:focus-visible, button:focus-visible { outline: 2px solid
var(--focus-ring); outline-offset: 2px; }`; remove the `outline: none`; delete the now
redundant per-component focus rules.

**Acceptance.** Tab through the home page: every link and button shows the ring.

**Effort.** Tiny.

---

### [x] 12. Motion, theme toggle, image dimensions

**Why.** No `prefers-reduced-motion` guard for ~30 transitions/transforms. The theme toggle is
`disabled` until hydration although the pre-paint script already knows the theme. Nine
`<img>` tags have no intrinsic `width`/`height`, causing layout shift on every card grid.

**Change.** Add one `@media (prefers-reduced-motion: reduce)` block. Initialise the toggle
from `document.documentElement.classList` in a `useState` initialiser and drop `disabled`.
Give thumbnails and plates `width`/`height` attributes or an `aspect-ratio` rule per class.

**Acceptance.** Lighthouse CLS on home ≈ 0; toggle works before hydration completes.

**Effort.** Small.

---

## P3 — Docs, CI, metadata

### [x] 13. CI does not type-check; the two workflows duplicate each other

**Why.** `ci.yml` and `deploy-pages.yml` run unittest, `validate:data`, vitest, build, and
the export check, but never `npm run lint` (`tsc --noEmit`), the only type check covering
`tests/`, `lib/`, `scripts/`. The five steps are copy-pasted between the two files, so a
check added to one is silently missing from the other.

**Change.** Add a "Typecheck" step. Extract the shared steps into a reusable workflow
(`workflow_call`) that both call. Add a step that re-runs `generate:llms` and
`generate:search-index` and fails on `git diff --exit-code public/api public/llms*.txt`,
so the committed corpus cannot drift from `data/processed`.

**Acceptance.** A deliberate type error in `lib/` fails CI; the generated-files drift check
passes on a clean tree.

**Effort.** Small.

---

### [ ] 14. README: pipeline diagram, setup, deploy, routes

**Why.** `README.md` is 15 lines: no setup, no commands, no deploy, no route map, no diagram.
The Mermaid diagram exists only in `docs/MAINTENANCE.md` and misattributes
`public/api/search-index.json` to the LLM step (it is produced by
`scripts/generate-search-index.ts` via `prebuild`). The deploy workflow comment refers to a
README section that does not exist. The README site link uses `http://` while every
canonical is `https://`.

**Change.** README gets: one-paragraph purpose; a condensed Mermaid diagram
(`docx → extractors → data/processed → next build → GitHub Pages`); Setup (`npm ci`,
venv + `requirements.txt`, Node 20 / Python 3.12); Scripts table (every `package.json`
script incl. `prebuild`, and every `src/`/`scripts/` Python entry point, marking manual
tools); Routes table (route → page → component, including the two redirects and the
`/#visual-index` view); Deploy section (push to main → CI + Pages, `out/` artifact,
`NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_GOATCOUNTER_CODE`, `CNAME`/`.nojekyll`). Fix the
MAINTENANCE diagram and its Tests section (list `lint`, `test`, `test:export`; note Python
tests are stdlib `unittest`). Verify diagrams in the IDE preview.

**Acceptance.** A new contributor can clone, install, run tests, and build from README alone.

**Effort.** Medium (half a day).

---

### [ ] 15. Ideas spec is fully shipped

**Why.** All six items in `ideas/site-improvements-spec.md` are in `main`, but the file still
reads as a backlog and describes designs that were changed in implementation (search, the
recently-updated line).

**Change.** Add a "Status: all shipped, 2026-09-08" header and a one-line note per section
on what differs from the spec; move the two parked ideas ("similar species" strip,
identification helper) into a short new `ideas/` file if they are still wanted.

**Effort.** Tiny.

---

### [ ] 16. Python dependency and version hygiene

**Why.** `requirements.txt` pins nothing except `Pillow>=10`; `lxml` is imported directly but
only present transitively. No Python version is declared (local venv 3.14, CI 3.12). No Node
`engines`/`.nvmrc`. No `pyproject.toml`, so no ruff config; 14 test files carry the same
`sys.path` prologue that `PYTHONPATH=src` already makes unnecessary in CI.

**Change.** Pin exact versions and add `lxml`; add a minimal `pyproject.toml` with
`requires-python = ">=3.12"` and the standard `[tool.ruff]` block; add `engines` and
`.nvmrc`; add `tests/conftest.py`-style path setup (or `pythonpath` config) and drop the
prologue; add `ruff` to a dev requirements file and run it in CI. Add `extract:algae` to
`package.json` so `sync:atlas` composes named scripts instead of inlining the command, and a
`test:py` script so the Python suite is one command away.

**Acceptance.** `ruff check src scripts tests` clean; `npm run test:py` runs the unittest
suite.

**Effort.** Small.

---

### [ ] 17. Machine-readable index (`llms.txt`) is stale

**Why.** `scripts/generate_llms_files.py` lists `/#algae-index`, About, species, Glossary,
Supplements. It never mentions the morphotype view (`/#visual-index`), the Cox (1996)
glossary plates, or `public/api/search-index.json`. The site URL is spelled out ~14 times in
one function although `ATLAS_URL` exists in the same module.

**Change.** Add the morphotype view line; relabel `/#algae-index` as "Species index (default:
by phylum)"; mention the plates in the glossary line; list or explicitly mark internal the
search-index endpoint; interpolate `ATLAS_URL` / `_atlas_attribution()`. Re-run
`npm run generate:llms`.

**Acceptance.** `tests/test_llms_outputs.py` passes; `public/llms.txt` names the morphotype
view.

**Effort.** Tiny.

---

### [ ] 18. Sitemap and page metadata gaps

**Why.** `app/sitemap.ts` omits the supplement detail route. `/supplements/` has social tags
but no canonical; `/supplements/[slug]` has title only. The site origin is hardcoded in six
files although `lib/site.ts` exports `SITE_ORIGIN`/`absoluteUrl`. Species JSON-LD `url` lacks
the trailing slash the canonical has. `app/layout.tsx` hardcodes `/favicon.png` while
`app/icon.png` also emits an icon; no `metadataBase`. Redirect pages (`/algae`,
`/visual-index/`) render only "Redirecting…" with no link and (for `/algae`) no `noindex`.
The title suffix "– Kinneret Algae Atlas" is repeated in seven files.

**Change.** Add supplements to the sitemap; canonical + `socialPreviewMetadata` on both
supplement routes (extend the page list in `tests/social-preview.test.ts`); replace literals
with `absoluteUrl`; trailing slash in JSON-LD; `metadataBase` + title template in the root
layout, drop the manual favicon; `robots: { index: false }` and a visible fallback link on
both redirect pages.

**Acceptance.** `out/sitemap.xml` includes the supplement page; every page has exactly one
canonical; `grep -r "kinneret-algae-atlas.org" app lib` finds only `lib/site.ts` and
`lib/cite-this-record.ts` (the latter derived from it).

**Effort.** Small.

---

### [ ] 19. One name for the supplements section

**Why.** Header says "Supplements"; the page H1 and `<title>` say "Supplementary Material";
the detail back link says "Supplementary material"; the home description and `llms.txt` say
"supplementary material".

**Change.** Decision for Gal: either "Supplements" everywhere (short, matches header) or keep
"Supplementary Material" as the page H1 and use "Supplements" only as the nav label
(current state, but then align the back link and title casing). Recommend the second:
formal name on the page, short label in navigation.

**Effort.** Tiny.

---

## P4 — Cleanup

### [ ] 20. Dead code, web app

- Unused CSS: `.algae-index-title`, `.section-title`, `.field-row`, `.gallery*`,
  `.glossary-intro`.
- Used classes with no rule: `.algae-redirect`, `.glossary-plates`, `.algae-pager-prev` —
  either style or drop the class.
- Unused imports: `Link` in `app/layout.tsx`, `RichText` in `app/supplements/[slug]/page.tsx`.
- Unused exports: `searchAlgae`, `getAlgaeIndexRecords`, `toAlgaeIndexRecord`,
  `AlgaeIndexRecord` (the whole deprecated index-record path), `buildVisualIndexCells`,
  `ORGANIZATION_AXIS`, `shapeGroupSortIndex`, `buildStudyAreaApiPayload` (duplicated in
  Python, already diverged — delete the TS one and its test).
- `PRIMARY_SECTION_ORDER` includes `morphology`, which no record has; `record.morphology`
  and `record.notes` are always null and never read.
- `PhylumLegendEntry.label` always equals `phylum`; collapse to one field.
- Theme storage key duplicated between the inline bootstrap script and `ThemeToggle`; export
  it from one module and interpolate.
- Species page re-implements `getAlgaBySlug`.
- Search index refetches on every keystroke after a failed fetch; stop after one failure.
- `ExpandableFiguresGrid` keys by `src`, which collides if an image repeats.
- Three date formatters for one concept (`RecentlyUpdatedLine`, `cite-this-record`, raw ISO
  in the glossary header); one helper with a style argument.
- "Coordinates and maps" footer link lands on an About section that shows no coordinates;
  render `formatStudyAreaCoordinatesDms()` there.

**Acceptance.** `npm run lint`, tests, build, export check all green; page markup diff is
empty except for the intended fixes.

**Effort.** Small, best done as two or three commits.

---

### [ ] 21. Dead code and duplication, Python

- `pipeline.py`: `_normalize_structured_fields` is defined twice; the first is a
  `RuntimeError` stub shadowed by the real one. Delete the stub.
- Four `_slugify` copies with three behaviours (`pipeline.py`, `extract_algae.py`,
  `generate_llms_files.py` with NFKD folding, `glossary_extractor/parse.py`). The first three
  feed one slug namespace, so the NFKD divergence is a latent mismatch for any taxon with a
  diacritic. One `slugify` in a shared module plus an explicitly named glossary variant; same
  for the copied `_BINOMIAL_RE`/`_GENUS_RE`.
- Duplicate rich-segment builders (`_char_styles_to_rich` vs `_char_styles_to_rich_segments`).
- Unused: `detect_scientific_name`, `iter_docx_paragraphs`,
  `move_inline_further_reading_from_ecology` (test-only; production uses the `_rich`
  variant — retarget the five tests or delete them with it).
- Dead branches: unreachable y-axis `elif` chain in `reader.py`; unreachable non-docx
  branch and duplicated extension check in `extract_glossary.py`; no-op `collaborators`
  branch and unused `collaborators_intro` key in `extract_about.py`; `continue` where `break`
  is meant after `skip_template_appendix` in `pipeline.py`.
- `print` in library code (`pipeline.py` "Dropping content-less record") → `logging`.
- Two silent `except Exception` worth a warning: Word COM export returning `[]` on any
  failure (so `--use-word-renderer` silently falls back on macOS/Linux), and the
  core-properties reader falling back to `date.today()` — exactly the churn the docstring
  promises to prevent. Also convert the UTC modified timestamp to local date before
  truncating (a doc saved after 21:00 Israel time is dated the previous day).
- `extract_about.py` and `extract_glossary.py` hardcode `data/raw`; `generate_llms_files.py`
  hardcodes `data/study-area.json`; add flags like the other two extractors.
- `sections` ships all 24 keys (326 empty strings across 41 records) while `sections_rich`
  prunes empties; prune, or document the asymmetry.
- `extract_algae.py` caption line: hoist `caps = record.get("image_captions") or []`.
- `src/algae_extractor/parsers/` lacks `__init__.py`.
- `scripts/scan_word_typos.py` is unreferenced and its rules are spent; delete or give it
  `--raw-dir` and an npm script.

**Acceptance.** `data/processed/*.json` byte-identical after re-extraction (except §4 and
the deliberate empty-key pruning, which needs the TS consumers checked: `lib/algae.ts`
normalisation must tolerate missing keys — it already does via `?? null`).

**Effort.** Small–medium, as several commits.

---

## UI polish (requested by Gal)

### [x] 22. "Search species" label on the same row as the box

**Why.** In the By phylum view the label sits on its own line above the input, adding a row
to an area that is already stacked (summary, switch, search, chips).

**Change.** Render label and input inline in `.algae-index-search` (flex row, label
vertically centred, input keeps its `min(100%, 34rem)` width); the "N of M species" count
stays below or moves to the right of the input on wide screens. On phones (≤ 640px) let the
label wrap above the input again if the row does not fit.

**Acceptance.** Desktop: one row `Search species [__________]`; phone: unchanged stacking.

**Effort.** Tiny.

---

## Suggested order

22 (search row) → 9 (contrast) → 11 (focus) → 10 (switch a11y) → 13 (CI typecheck) → 1, 3, 6, 2 (small bugs)
→ 17, 18 (metadata) → 19, 15 (naming, ideas) → 5, 7, 12 → 16, 14 (hygiene, README)
→ 20, 21 (cleanup) → 4 and 8 whenever Gal decides the date / recreates the venv.
