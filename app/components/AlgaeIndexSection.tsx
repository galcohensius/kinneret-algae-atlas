"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { AlgaeRecord } from "../../lib/algae-types";
import { groupAlgaeByPhylum } from "../../lib/phylum-catalog";
import { partitionPlateAndGalleryImages } from "../../lib/partition-plate-images";
import TaxonItalicName from "./TaxonItalicName";

type AlgaeIndexSectionProps = {
  records: AlgaeRecord[];
};

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
  const phylumGroups = groupAlgaeByPhylum(records);

  return (
    <section
      id="algae-index"
      className="home-algae-index"
      aria-label="Algae species index"
    >
      <p className="muted algae-index-summary">
        {records.length} species, grouped by phylum; A–Z by scientific name within each
        phylum.
      </p>

      {phylumGroups.length > 1 ? (
        <nav className="phylum-jump-nav" aria-label="Jump to phylum">
          {phylumGroups.map((group) => (
            <a
              key={group.slug}
              href={`#phylum-${group.slug}`}
              style={{ "--phylum-accent": group.accent } as CSSProperties}
            >
              {group.phylum}
              <span className="phylum-jump-count"> ({group.records.length})</span>
            </a>
          ))}
        </nav>
      ) : null}

      <nav className="home-aux-links home-aux-links-top" aria-label="Reference material">
        <Link href="/glossary/">Glossary</Link>
        <Link href="/supplements/">Supplementary Material</Link>
      </nav>

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
