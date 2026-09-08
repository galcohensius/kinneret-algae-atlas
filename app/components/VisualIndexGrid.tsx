"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { VisualIndexSection } from "../../lib/visual-index-layout";
import { ORIGIN_PARAM, VISUAL_INDEX_ORIGIN } from "../../lib/index-view";
import TaxonItalicName from "./TaxonItalicName";

type VisualIndexGridProps = {
  sections: VisualIndexSection[];
};

function ShapeGroupGrid({ section }: { section: VisualIndexSection }) {
  const cols = Math.max(...section.cells.map((cell) => cell.col)) + 1;
  const rows = Math.max(...section.cells.map((cell) => cell.row)) + 1;

  return (
    <div className="visual-index-grid-scroll">
      <div
        className="visual-index-grid"
        style={
          {
            "--visual-index-cols": cols,
            "--visual-index-rows": rows,
          } as CSSProperties
        }
      >
        {section.cells.map((cell) => (
          <Link
            key={cell.slug}
            href={`/algae/${cell.slug}/?${ORIGIN_PARAM}=${VISUAL_INDEX_ORIGIN}`}
            className="visual-index-cell"
            style={
              {
                "--phylum-accent": cell.accent,
                gridColumn: cell.col + 1,
                gridRow: cell.row + 1,
              } as CSSProperties
            }
            aria-label={`${cell.scientificName}, ${cell.phylum}`}
          >
            {cell.imageUrl ? (
              <img
                className="visual-index-thumb"
                src={cell.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="visual-index-thumb visual-index-thumb-placeholder">No image</span>
            )}
            <span className="visual-index-tooltip" role="tooltip">
              <TaxonItalicName taxon={cell.scientificName} className="algae-taxon" />
              <span className="visual-index-tooltip-phylum">{cell.phylum}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function VisualIndexGrid({ sections }: VisualIndexGridProps) {
  if (sections.length === 0) {
    return <p className="muted">No species available.</p>;
  }

  return (
    <>
      <p className="muted visual-index-swipe-hint">Swipe sideways to see the full map.</p>

      <div className="visual-index-shape-groups">
        {sections.map((section) => (
          <section
            key={section.group}
            className="visual-index-shape-group"
            aria-labelledby={`visual-index-shape-${section.group}`}
          >
            <h2 id={`visual-index-shape-${section.group}`} className="visual-index-shape-heading">
              {section.label}
            </h2>
            <ShapeGroupGrid section={section} />
          </section>
        ))}
      </div>
    </>
  );
}
