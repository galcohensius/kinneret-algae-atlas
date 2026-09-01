"use client";

import { Fragment, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { AlgaeRecord } from "../../lib/algae-types";
import { filterAlgaeByQuery } from "../../lib/algae-filter";
import { selectRecentlyUpdated } from "../../lib/recently-updated";
import { groupAlgaeByPhylum, type PhylumCatalogGroup } from "../../lib/phylum-catalog";
import { splitIntoBalancedRows } from "../../lib/split-balanced-rows";
import { partitionPlateAndGalleryImages } from "../../lib/partition-plate-images";
import TaxonItalicName from "./TaxonItalicName";

type AlgaeIndexSectionProps = {
  records: AlgaeRecord[];
};

/** `YYYY-MM-DD` as e.g. `30 Aug 2026`, compact enough for the one-line strip. */
function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.trim().split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Split phylum jump links into two rows with similar total label length. */
function splitPhylumJumpRows(groups: PhylumCatalogGroup[]): PhylumCatalogGroup[][] {
  return splitIntoBalancedRows(
    groups,
    (group) => `${group.phylum} (${group.records.length})`.length
  );
}

function AlgaeListCard({ record }: { record: AlgaeRecord }) {
  const { plateImage } = partitionPlateAndGalleryImages(record.images, record.imageCaptions);
  const listImage = record.thumbnailUrl ?? plateImage;

  return (
    <Link href={`/algae/${record.slug}/`} className="algae-list-card-link">
      <article className="card algae-list-card">
        {listImage ? (
          <img
            className="algae-thumb"
            src={listImage}
            alt={`${record.title} thumbnail`}
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

export default function AlgaeIndexSection({ records }: AlgaeIndexSectionProps) {
  const [query, setQuery] = useState("");
  const isFiltering = query.trim().length > 0;
  const filteredRecords = filterAlgaeByQuery(records, query);
  const phylumGroups = groupAlgaeByPhylum(filteredRecords);
  const phylumJumpRows = splitPhylumJumpRows(phylumGroups);
  const recentlyUpdated = selectRecentlyUpdated(records);

  return (
    <section
      id="algae-index"
      className="home-algae-index"
      aria-label="Algae species index"
    >
      <p className="muted algae-index-summary">
        {records.length} species, grouped by phylum; A–Z by scientific name within each
        phylum. Work in progress to include ~150 species of microalgae from Lake Kinneret.
      </p>

      <div className="glossary-toolbar algae-index-search">
        <label className="glossary-search-label" htmlFor="algae-search">
          Search species
        </label>
        <input
          id="algae-search"
          type="search"
          className="glossary-search"
          placeholder="Scientific name, previous name, or phylum"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {isFiltering ? (
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
                  <span className="phylum-jump-count"> ({group.records.length})</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
      ) : null}

      <nav className="home-aux-links home-aux-links-top" aria-label="Reference material">
        <Link href="/about/">About</Link>
        <Link href="/glossary/">Glossary</Link>
        <Link href="/visual-index/">Visual index</Link>
        <Link href="/supplements/">Supplementary Material</Link>
      </nav>

      {!isFiltering && recentlyUpdated.length > 0 ? (
        <p className="muted recently-updated-line" aria-label="Recently updated species">
          Last updated{" "}
          <span className="recently-updated-date">
            ({formatShortDate(recentlyUpdated[0].recordUpdated ?? "")})
          </span>
          :{" "}
          {recentlyUpdated.map((record, index) => (
            <Fragment key={record.slug}>
              {index > 0 ? <span aria-hidden> &middot; </span> : null}
              <Link href={`/algae/${record.slug}/`}>
                <TaxonItalicName taxon={record.scientificName} className="algae-taxon" />
              </Link>
            </Fragment>
          ))}
        </p>
      ) : null}

      {isFiltering && filteredRecords.length === 0 ? (
        <p className="muted algae-index-summary" role="status">
          No species match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : null}

      <div className="phylum-catalog">
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
                {group.phylum}
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
    </section>
  );
}
