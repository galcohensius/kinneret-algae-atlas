# Site improvements — spec

Six improvements selected from the 2026-09-01 project review. All are independent of the
ongoing content work (adding species records) and of each other; each section can ship as
its own small PR. Ordered by value-for-effort.

Excluded from this spec (parked for later): "similar species" strip and the faceted
identification helper.

---

## 1. Species search box on the home index

**Why.** The glossary page has live search; the species index does not. At 41 species
scrolling works, at the target ~150 it won't. The filter logic already exists and is
unused by any UI.

**Existing code.**
- `filterAlgaeByQuery()` in `lib/algae-filter.ts` — client-safe, currently matches
  `title`, `scientificName`, `nameAuthority`.
- `searchAlgae()` in `lib/algae.ts:194` — server wrapper, currently has no caller.
- UI pattern to copy: the search input + live count in
  `app/components/GlossaryPageClient.tsx` (`glossary-toolbar` / `glossary-search`).

**Design.**
- Add a search input at the top of `AlgaeIndexSection` (already a client component),
  filtering the records passed to `groupAlgaeByPhylum()` before rendering. Empty query
  renders exactly the current page.
- Extend `filterAlgaeByQuery` to also match `previous_name_used` (plain text from
  `sections`) and phylum — taxonomists often know a species only by its old name, and
  today old names are findable only inside a record. Requires adding those two fields to
  the generic constraint and passing them through from `AlgaeRecord` (both already exist
  on the record).
- While filtering: hide phyla with zero matches, show "N of M species" count, keep the
  phylum jump-nav in sync (hide or disable empty phyla).
- No URL state needed; this is an in-page convenience.

**Acceptance.**
- Typing `peridinium` shows only matching species; clearing restores the full catalog.
- A query matching only a previous name still finds the species.
- Unit test on the extended `filterAlgaeByQuery` (previous-name and phylum matches).

**Effort.** Small (half a day incl. styling).

---

## 2. OpenGraph / social link previews

**Why.** There are no `og:` tags anywhere, so a species link shared on WhatsApp/X/Slack
renders as bare text. Each record already has a thumbnail; the audience (researchers,
teachers) spreads the site by sharing links.

**Existing code.**
- `generateMetadata()` in `app/algae/[slug]/page.tsx:171` — already builds title,
  description, canonical per species.
- Thumbnail resolution: `record.thumbnailUrl` / `partitionPlateAndGalleryImages()`
  (same choice the index cards make in `AlgaeIndexSection.tsx`).
- Site-wide metadata: `app/layout.tsx` and `app/page.tsx`.

**Design.**
- Species pages: add `openGraph` (title, description, `url`, `images: [absolute thumbnail
  URL]`, `type: "article"`) and `twitter: { card: "summary_large_image" }` to the
  existing `generateMetadata`. Image URLs must be absolute
  (`https://kinneret-algae-atlas.org` + asset path) — build a small helper next to
  `publicAssetPath()` in `lib/public-path.ts` rather than concatenating inline.
- Home / glossary / supplements / about / visual-index: static `openGraph` blocks; home
  uses `kinneret-lake.jpg`, about can use the ISS photo.
- Note: og:image aspect — thumbnails are small squares; acceptable for `summary` cards.
  If previews look poor, fall back to the plate image (usually larger) and revisit.

**Acceptance.**
- `out/algae/<slug>/index.html` contains `og:image` with an absolute URL pointing at an
  existing file; verified for one species in a preview debugger (e.g. opengraph.xyz).
- Extend `tests/schema-jsonld.test.ts` (or a sibling test) to assert og tags exist in the
  exported HTML and their image paths exist on disk.

**Effort.** Small (~10 lines per page + helper + test).

---

## 3. Privacy-friendly analytics

**Why.** Zero visibility today into visits, popular species, or referrers. Informs which
future ideas matter, and "N people viewed your Peridinium page this month" is direct
motivation for the content author.

**Design.**
- Use **GoatCounter** (free for non-commercial, no cookies, no consent banner needed) or
  Plausible (paid). Decision: GoatCounter unless a dashboard preference says otherwise.
- One `<script>` tag in `app/layout.tsx` (production only — gate on
  `process.env.NODE_ENV` or on hostname so `npm run dev` and PR previews don't count).
- Static export + client-side navigation caveat: Next `Link` navigations don't fire page
  loads. GoatCounter needs the SPA snippet (bind to `history` changes) or we accept
  landing-page-only counts. Start with the standard snippet; add SPA tracking only if
  per-species numbers look implausibly low.
- No personal data is collected; still add one line to the About page footer ("anonymous
  visit counts via GoatCounter") for transparency.

**Acceptance.**
- Visits to `/` and to a species page appear in the GoatCounter dashboard from the
  production site; nothing is sent from `npm run dev`.

**Effort.** Tiny (account setup + a few lines). Requires owner to create the GoatCounter
account (site code goes in an env var / config, not hardcoded credentials).

---

## 6. Prev / next navigation on species pages

**Why.** The only navigation off a species page is "back to index" (or the origin-aware
visual-index link). Prev/next lets the atlas be read like a book — the same order the
printed atlas tradition uses: A–Z within phylum.

**Existing code.**
- Ordering source of truth: `groupAlgaeByPhylum()` in `lib/phylum-catalog.ts` — reuse it,
  do not re-sort in the page (single source of truth for the browse order).
- Render location: `app/algae/[slug]/page.tsx`, alongside the existing
  `algae-detail-nav` / `algae-detail-nav-end` rows.

**Design.**
- At build time (the page is async SSG), compute the flattened order
  `[...phylumGroups.flatMap(g => g.records)]`, find the current index, and render
  `← <prev name>` / `<next name> →` links (italic taxon names via `TaxonItalicName`).
- Wrap across phylum boundaries (last cyanobacterium → first dinoflagellate), showing the
  phylum name in small text when it changes, so flipping through covers the whole atlas.
- No wrap from last→first species (dead-end is clearer than a cycle).
- Bottom nav row gets the same links; top row keeps only the back link to stay quiet.

**Acceptance.**
- Every species page links to its neighbors in index order; first has no prev, last has
  no next. A small unit test over the flattened order (neighbors are consistent and
  cover all records exactly once).

**Effort.** Small.

---

## 7. "Recently updated" strip on the home page

**Why.** Records carry an update date but the site never surfaces change. A small strip
shows returning visitors the atlas is alive and showcases content progress with zero
per-update effort.

**Existing code.**
- `record.recordUpdated` (used by `buildCitationBundle` in `lib/cite-this-record.ts`).
  **Verified 2026-09-01**: the algae pipeline stamps it with `date.today()` at extraction
  time (`src/algae_extractor/pipeline.py:189`), so a full re-extract flattens all records
  to the run date — today all 41 carry `2026-08-30`. As-is, the strip would show nothing
  meaningful (and citations churn on every re-extract).
- The source Word files DO carry distinct, meaningful dates in their DOCX core
  properties (`dcterms:modified`: Dinoflagellates 2026-08-07, Cryptophytes 2026-08-17,
  Microcystis 2026-08-23, …), and the glossary/supplements/About extractors already use
  them via `_source_modified_date()` (`src/algae_extractor/supplement_pipeline.py:83`,
  whose docstring exists precisely so reruns don't churn JSON).
- **Prerequisite fix (one-liner + re-extract):** in the algae pipeline, set
  `record_updated` from the source doc's core-properties date instead of `date.today()`
  (move `_source_modified_date` to a shared module). Granularity is per Word file — a
  multi-species doc (e.g. Chroococcales) shares one date — which matches the real
  semantics: when the author last edited that record's source. Also fixes citation churn.
- Card rendering to reuse: `AlgaeListCard` in `app/components/AlgaeIndexSection.tsx`.

**Design.**
- On the home page, between the hero and the phylum catalog: "Recently updated" with the
  3–5 records with the newest `recordUpdated`, rendered as the existing list cards plus
  a muted date. Ties (same date) break A–Z.
- Hide the strip entirely when fewer than 2 distinct dates exist across the atlas (the
  degenerate everything-updated-at-once case).

**Acceptance.**
- Strip shows the newest records with dates; disappears in the degenerate case; no layout
  shift on mobile (reuses card grid styles).

**Effort.** Small — a one-line extractor fix + re-extract, then the strip itself.

---

## 8. Link-and-asset checker over the static export (CI)

**Why.** The exported site is plain HTML in `out/`; broken internal links or missing
images are cheap to detect at build time and currently reach production (this session's
back-link bug is the class of regression it catches). Generalizes the existing
`tests/image-orphans.test.ts`.

**Design.**
- A vitest suite (e.g. `tests/export-links.test.ts`) that runs after `next build`:
  - Walk every `out/**/*.html`.
  - For each internal `href` (same-origin or relative, ignoring `http(s)://`, `mailto:`,
    `#...`): assert the target resolves to a file in `out/` (respecting
    `trailingSlash: true` → `<path>/index.html`) . Fragment-only links checked against
    ids in the same document.
  - For each `<img src>` and `og:image`: assert the file exists under `out/`.
  - Respect `NEXT_PUBLIC_BASE_PATH` if set (strip before resolving).
- CI wiring in `.github/workflows/ci.yml`: today tests run **before** build, so either
  move the build step earlier or add a separate `npm run test:export` step after
  `npm run build`. Keep it out of the default `npm test` so local test runs don't require
  a build.
- Use `node:fs` + a small regex/`parse5`-free extraction if possible; add a dependency
  (e.g. `node-html-parser`) only if regex proves too brittle for the actual output.

**Acceptance.**
- Deleting one species image or hand-breaking one internal href makes CI fail with a
  message naming the source page and the bad target.
- Runs in seconds on the current export.

**Effort.** Small–medium (the path-resolution edge cases are the work).

---

## Suggested order

2 (og tags) → 1 (search) → 7 (recently updated; do the extractor date fix first) →
8 (export checker) → 6 (prev/next) → 3 (analytics; needs an account from the owner).
