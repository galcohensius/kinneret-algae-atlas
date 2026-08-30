"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { VisualIndexCell } from "../../lib/visual-index-layout";
import { splitIntoBalancedRows } from "../../lib/split-balanced-rows";
import TaxonItalicName from "./TaxonItalicName";

type VisualIndexGridProps = {
  cells: VisualIndexCell[];
};

type PhylumLegendEntry = {
  phylum: string;
  accent: string;
};

function buildPhylumLegend(cells: VisualIndexCell[]): PhylumLegendEntry[] {
  const seen = new Map<string, PhylumLegendEntry>();
  for (const cell of cells) {
    if (!seen.has(cell.phylum)) {
      seen.set(cell.phylum, { phylum: cell.phylum, accent: cell.accent });
    }
  }
  return [...seen.values()].sort((a, b) => a.phylum.localeCompare(b.phylum));
}

export default function VisualIndexGrid({ cells }: VisualIndexGridProps) {
  if (cells.length === 0) {
    return <p className="muted">No species available.</p>;
  }

  const cols = Math.max(...cells.map((cell) => cell.col)) + 1;
  const rows = Math.max(...cells.map((cell) => cell.row)) + 1;
  const legend = buildPhylumLegend(cells);
  const legendRows = splitIntoBalancedRows(legend, (entry) => entry.phylum.length);

  return (
    <>
      <nav className="visual-index-legend" aria-label="Phylum colors">
        {legendRows.map((row, rowIndex) => (
          <div key={`legend-row-${rowIndex}`} className="visual-index-legend-row">
            {row.map((entry) => (
              <span
                key={entry.phylum}
                className="visual-index-legend-item"
                style={{ "--phylum-accent": entry.accent } as CSSProperties}
              >
                <span className="visual-index-legend-dot" aria-hidden />
                {entry.phylum}
              </span>
            ))}
          </div>
        ))}
      </nav>

      <div
        className="visual-index-grid"
        style={
          {
            "--visual-index-cols": cols,
            "--visual-index-rows": rows,
          } as CSSProperties
        }
      >
        {cells.map((cell) => (
          <Link
            key={cell.slug}
            href={`/algae/${cell.slug}/`}
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
    </>
  );
}
