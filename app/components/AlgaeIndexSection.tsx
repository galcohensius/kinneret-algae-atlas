"use client";

import Link from "next/link";
import type { AlgaeRecord } from "../../lib/algae-types";
import { partitionPlateAndGalleryImages } from "../../lib/partition-plate-images";
import TaxonItalicName from "./TaxonItalicName";

type AlgaeIndexSectionProps = {
  records: AlgaeRecord[];
};

export default function AlgaeIndexSection({ records }: AlgaeIndexSectionProps) {
  return (
    <section
      id="algae-index"
      className="home-algae-index"
      aria-label="Algae species index"
    >
      <p className="muted algae-index-count">{records.length} records</p>

      <div className="algae-list-grid">
        {records.map((record) => {
          const { plateImage } = partitionPlateAndGalleryImages(record.images, record.imageCaptions);
          const listImage = record.thumbnailUrl ?? plateImage;
          return (
          <article className="card algae-list-card" key={record.slug}>
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
              <Link href={`/algae/${record.slug}/`}>
                <TaxonItalicName taxon={record.scientificName} className="algae-taxon" />
              </Link>
            </h3>
          </article>
          );
        })}
      </div>
    </section>
  );
}
