import type { Metadata } from "next";
import Link from "next/link";
import TaxonItalicName from "../components/TaxonItalicName";
import { getAllSupplements } from "../../lib/supplements";
import { publicAssetPath } from "../../lib/public-path";

export const metadata: Metadata = {
  title: "Supplementary Material – Kinneret Algae Atlas",
  description: "Supplementary guides and comparisons for species in the Kinneret Algae Atlas.",
};

export default async function SupplementsIndexPage() {
  const supplements = await getAllSupplements();

  return (
    <main className="algae-detail">
      <p className="algae-detail-nav">
        <Link href="/#algae-index">← Algae index</Link>
      </p>

      <header className="algae-detail-header">
        <h1>Supplementary Material</h1>
        <p className="glossary-intro muted">
          Morphology and ecology terms used across the atlas are defined in the{" "}
          <Link href="/glossary/">glossary</Link>.
        </p>
      </header>

      <div className="home-below-hero" style={{ padding: "0 1rem 1rem" }}>
        {supplements.length === 0 ? (
          <p className="muted">No supplements available.</p>
        ) : (
          <div className="algae-list-grid">
            {supplements.map((s) => {
              const thumb = s.images[0] ? publicAssetPath(s.images[0]) : null;
              return (
                <article className="card algae-list-card" key={s.slug}>
                  {thumb ? (
                    <img
                      className="algae-thumb"
                      src={thumb}
                      alt={`${s.title} thumbnail`}
                    />
                  ) : (
                    <div className="algae-thumb algae-thumb-placeholder">No image</div>
                  )}
                  <h3 className="algae-list-card-title">
                    <Link href={`/supplements/${s.slug}/`}>
                      <TaxonItalicName taxon={s.title} className="algae-taxon" />
                    </Link>
                  </h3>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <p className="algae-detail-nav algae-detail-nav-end">
        <Link href="/#algae-index">← Algae index</Link>
      </p>
    </main>
  );
}
