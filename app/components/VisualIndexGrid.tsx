"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import type { VisualIndexSection } from "../../lib/visual-index-layout";
import { ORIGIN_PARAM, VISUAL_INDEX_ORIGIN } from "../../lib/index-view";
import { splitIntoBalancedRows } from "../../lib/split-balanced-rows";
import TaxonItalicName from "./TaxonItalicName";

type VisualIndexGridProps = {
  sections: VisualIndexSection[];
};

type PhylumLegendEntry = {
  phylum: string;
  label: string;
  accent: string;
};

function buildPhylumLegend(sections: VisualIndexSection[]): PhylumLegendEntry[] {
  const seen = new Map<string, PhylumLegendEntry>();
  for (const section of sections) {
    for (const cell of section.cells) {
      if (!seen.has(cell.phylum)) {
        seen.set(cell.phylum, { phylum: cell.phylum, label: cell.phylum, accent: cell.accent });
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.phylum.localeCompare(b.phylum));
}

function ShapeGroupGrid({
  section,
  highlightedPhylum,
}: {
  section: VisualIndexSection;
  highlightedPhylum: string | null;
}) {
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
            className={
              highlightedPhylum && cell.phylum !== highlightedPhylum
                ? "visual-index-cell visual-index-cell--dimmed"
                : "visual-index-cell"
            }
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
  const [highlightedPhylum, setHighlightedPhylum] = useState<string | null>(null);

  if (sections.length === 0) {
    return <p className="muted">No species available.</p>;
  }

  const legend = buildPhylumLegend(sections);
  const legendRows = splitIntoBalancedRows(legend, (entry) => entry.label.length);

  return (
    <>
      <div className="visual-index-legend" role="group" aria-label="Highlight a phylum">
        {legendRows.map((row, rowIndex) => (
          <div key={`legend-row-${rowIndex}`} className="visual-index-legend-row">
            {row.map((entry) => (
              <button
                key={entry.phylum}
                type="button"
                className="visual-index-legend-item"
                aria-pressed={highlightedPhylum === entry.phylum}
                onClick={() =>
                  setHighlightedPhylum((current) =>
                    current === entry.phylum ? null : entry.phylum
                  )
                }
                style={{ "--phylum-accent": entry.accent } as CSSProperties}
              >
                <span className="visual-index-legend-dot" aria-hidden />
                {entry.label}
              </button>
            ))}
          </div>
        ))}
      </div>

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
            <ShapeGroupGrid section={section} highlightedPhylum={highlightedPhylum} />
          </section>
        ))}
      </div>
    </>
  );
}
