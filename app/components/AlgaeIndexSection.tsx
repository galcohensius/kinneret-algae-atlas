"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { AlgaeCatalogRecord } from "../../lib/algae-types";
import type { VisualIndexSection } from "../../lib/visual-index-layout";
import type { AlgaeSearchIndexFile } from "../../lib/algae-search-index";
import { filterCatalogBySearchIndex } from "../../lib/algae-search-index";
import {
  formatPhylumLabel,
  groupAlgaeByPhylum,
  phylumPopularName,
  type PhylumCatalogGroup,
} from "../../lib/phylum-catalog";
import { publicAssetPath } from "../../lib/public-path";
import { splitIntoBalancedRows } from "../../lib/split-balanced-rows";
import { HOME_VISUAL_INDEX_HASH } from "../../lib/index-view";
import TaxonItalicName from "./TaxonItalicName";
import VisualIndexGrid from "./VisualIndexGrid";

type AlgaeIndexSectionProps = {
  records: AlgaeCatalogRecord[];
  visualSections: VisualIndexSection[];
};

type IndexView = "phylum" | "appearance";

const INDEX_VIEWS: { id: IndexView; label: string }[] = [
  { id: "phylum", label: "By phylum" },
  { id: "appearance", label: "By appearance" },
];

/** Two rows overflow the 980px content column and wrap to four lines; three fit. */
const PHYLUM_JUMP_ROWS = 3;

/** Split phylum jump links into rows with similar total label length. */
function splitPhylumJumpRows(
  groups: PhylumCatalogGroup<AlgaeCatalogRecord>[]
): PhylumCatalogGroup<AlgaeCatalogRecord>[][] {
  return splitIntoBalancedRows(
    groups,
    (group) => `${formatPhylumLabel(group.phylum)} (${group.records.length})`.length,
    PHYLUM_JUMP_ROWS
  );
}

function AlgaeListCard({ record }: { record: AlgaeCatalogRecord }) {
  return (
    <Link href={`/algae/${record.slug}/`} className="algae-list-card-link">
      <article className="card algae-list-card">
        {record.thumbnailUrl ? (
          <img
            className="algae-thumb"
            src={record.thumbnailUrl}
            alt={`${record.scientificName} thumbnail`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="algae-thumb algae-thumb-placeholder">No image</div>
        )}
        <h3 className="algae-list-card-title">
          <TaxonItalicName taxon={record.scientificName} className="algae-taxon" />
        </h3>
      </article>
    </Link>
  );
}

export default function AlgaeIndexSection({ records, visualSections }: AlgaeIndexSectionProps) {
  const [view, setView] = useState<IndexView>("phylum");
  const [query, setQuery] = useState("");

  // /#visual-index (header link, species back link, old /visual-index/ URL) opens the appearance view.
  useEffect(() => {
    function openViewFromHash() {
      if (window.location.hash === HOME_VISUAL_INDEX_HASH) {
        setView("appearance");
      }
    }
    openViewFromHash();
    window.addEventListener("hashchange", openViewFromHash);
    return () => window.removeEventListener("hashchange", openViewFromHash);
  }, []);

  function selectView(next: IndexView) {
    setView(next);
    const base = `${window.location.pathname}${window.location.search}`;
    history.replaceState(null, "", next === "appearance" ? `${base}${HOME_VISUAL_INDEX_HASH}` : base);
  }
  const [searchIndex, setSearchIndex] = useState<Map<string, string> | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const loadSearchIndex = useCallback(async () => {
    if (searchIndex || searchLoading) {
      return;
    }
    setSearchLoading(true);
    setSearchError(false);
    try {
      const response = await fetch(publicAssetPath("/api/search-index.json"));
      if (!response.ok) {
        throw new Error("search index unavailable");
      }
      const payload = (await response.json()) as AlgaeSearchIndexFile;
      setSearchIndex(new Map(payload.entries.map((entry) => [entry.slug, entry.searchHaystack])));
    } catch {
      setSearchError(true);
    } finally {
      setSearchLoading(false);
    }
  }, [searchIndex, searchLoading]);

  const activateSearch = useCallback(() => {
    void loadSearchIndex();
  }, [loadSearchIndex]);

  const isFiltering = query.trim().length > 0;
  const filteredRecords = useMemo(() => {
    if (!isFiltering || !searchIndex) {
      return records;
    }
    return filterCatalogBySearchIndex(records, searchIndex, query);
  }, [isFiltering, query, records, searchIndex]);

  const phylumGroups = groupAlgaeByPhylum(filteredRecords);
  const phylumJumpRows = splitPhylumJumpRows(phylumGroups);
  const searchPending = isFiltering && !searchIndex && searchLoading;
  const searchBlocked = isFiltering && !searchIndex && searchError;

  return (
    <section
      id="algae-index"
      className="home-algae-index"
      aria-label="Algae species index"
    >
      <p className="muted algae-index-summary">
        {records.length} species,{" "}
        {view === "phylum"
          ? "grouped by phylum; A–Z by scientific name within each phylum."
          : "grouped by shape; color ring = phylum. Hover a picture to see the species name."}{" "}
        Work in progress to include ~150 species of microalgae from Lake Kinneret.
      </p>

      <div
        id={HOME_VISUAL_INDEX_HASH.slice(1)}
        className="index-view-switch"
        role="tablist"
        aria-label="Index view"
      >
        {INDEX_VIEWS.map((option) => (
          <button
            key={option.id}
            id={`index-view-tab-${option.id}`}
            type="button"
            role="tab"
            aria-selected={view === option.id}
            className="index-view-tab"
            onClick={() => selectView(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === "phylum" ? (
        <>
          <div className="glossary-toolbar algae-index-search">
            <label className="glossary-search-label" htmlFor="algae-search">
              Search species
            </label>
            <input
              id="algae-search"
              type="search"
              className="glossary-search"
              placeholder="Species name, previous name, or phylum (e.g. diatoms)"
              value={query}
              onFocus={activateSearch}
              onClick={activateSearch}
              onChange={(event) => {
                activateSearch();
                setQuery(event.target.value);
              }}
            />
            {searchPending ? (
              <p className="glossary-search-count muted" role="status">
                Loading search…
              </p>
            ) : null}
            {searchBlocked ? (
              <p className="glossary-search-count muted" role="status">
                Search is temporarily unavailable.
              </p>
            ) : null}
            {isFiltering && searchIndex ? (
              <p className="glossary-search-count muted" role="status">
                {filteredRecords.length} of {records.length} species
              </p>
            ) : null}
          </div>

          {phylumGroups.length > 1 ? (
            <nav className="phylum-jump-nav" aria-label="Jump to phylum">
              {phylumJumpRows.map((row, rowIndex) => (
                <div key={`phylum-jump-row-${rowIndex}`} className="phylum-jump-row">
                  {row.map((group) => (
                    <a
                      key={group.slug}
                      href={`#phylum-${group.slug}`}
                      style={{ "--phylum-accent": group.accent } as CSSProperties}
                    >
                      {group.phylum}
                      {phylumPopularName(group.phylum) ? (
                        <span className="phylum-jump-popular">
                          {" "}
                          ({phylumPopularName(group.phylum)})
                        </span>
                      ) : null}
                      <span className="phylum-jump-count"> ({group.records.length})</span>
                    </a>
                  ))}
                </div>
              ))}
            </nav>
          ) : null}
        </>
      ) : null}

      {view === "phylum" && isFiltering && searchIndex && filteredRecords.length === 0 ? (
        <p className="muted algae-index-summary" role="status">
          No species match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : null}

      {view === "appearance" ? (
        <article
          className="card visual-index-card home-visual-index"
          role="tabpanel"
          aria-labelledby="index-view-tab-appearance"
        >
          <VisualIndexGrid sections={visualSections} />
        </article>
      ) : (
      <div className="phylum-catalog" role="tabpanel" aria-labelledby="index-view-tab-phylum">
        {phylumGroups.map((group) => (
          <section
            key={group.slug}
            id={`phylum-${group.slug}`}
            className={
              group.records.length === 1
                ? "phylum-catalog-group phylum-catalog-group--single"
                : "phylum-catalog-group"
            }
            style={{ "--phylum-accent": group.accent } as CSSProperties}
            aria-labelledby={`phylum-heading-${group.slug}`}
          >
            <div className="phylum-catalog-rail" aria-hidden />
            <div className="phylum-catalog-body">
              <h2 id={`phylum-heading-${group.slug}`} className="phylum-catalog-heading">
                {formatPhylumLabel(group.phylum)}
                <span className="phylum-catalog-count muted">
                  {" "}
                  ({group.records.length})
                </span>
              </h2>
              <div className="algae-list-grid">
                {group.records.map((record) => (
                  <AlgaeListCard key={record.slug} record={record} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
      )}
    </section>
  );
}
