import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import TaxonItalicName from "../components/TaxonItalicName";
import { getAllSupplements } from "../../lib/supplements";
import { getAllAlgae } from "../../lib/algae";
import { getPhylumAccent, phylumToSlug } from "../../lib/phylum-catalog";
import { publicAssetPath } from "../../lib/public-path";

export const metadata: Metadata = {
  title: "Supplementary Material – Kinneret Algae Atlas",
  description: "Supplementary guides and comparisons for species in the Kinneret Algae Atlas.",
};

export default async function SupplementsIndexPage() {
  const supplements = await getAllSupplements();
  const algae = await getAllAlgae();
  const phylumBySlug = new Map(algae.map((record) => [record.slug, (record.sections.phylum ?? "").trim()]));

  const grouped = new Map<
    string,
    {
      phylum: string;
      slug: string;
      accent: string;
      items: typeof supplements;
    }
  >();

  for (const supplement of supplements) {
    const phyla = Array.from(
      new Set(
        supplement.linkedTaxa
          .map((slug) => phylumBySlug.get(slug) ?? "")
          .map((name) => name.trim())
          .filter(Boolean)
      )
    );
    const phylum = phyla.length === 1 ? phyla[0] : phyla.length > 1 ? "Mixed phyla" : "Unclassified";
    const slug = phylumToSlug(phylum);
    const existing = grouped.get(slug);
    if (existing) {
      existing.items.push(supplement);
      continue;
    }
    grouped.set(slug, {
      phylum,
      slug,
      accent: getPhylumAccent(phylum),
      items: [supplement],
    });
  }
  const groupedSupplements = [...grouped.values()];

  return (
    <main className="algae-detail">
      <p className="algae-detail-nav">
        <Link href="/#algae-index">← Algae index</Link>
        {" · "}
        <Link href="/about/">About</Link>
        {" · "}
        <Link href="/glossary/">Glossary</Link>
      </p>

      <header className="algae-detail-header">
        <h1>Supplementary Material</h1>
      </header>

      <div className="home-below-hero" style={{ padding: "0 1rem 1rem" }}>
        {supplements.length === 0 ? (
          <p className="muted">No supplements available.</p>
        ) : (
          <div className="phylum-catalog">
            {groupedSupplements.map((group) => (
              <section
                key={group.slug}
                id={`phylum-${group.slug}`}
                className={
                  group.items.length === 1
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
                    <span className="phylum-catalog-count muted"> ({group.items.length})</span>
                  </h2>
                  <div className="algae-list-grid">
                    {group.items.map((s) => {
                      const thumb = s.images[0] ? publicAssetPath(s.images[0]) : null;
                      return (
                        <Link
                          href={`/supplements/${s.slug}/`}
                          className="algae-list-card-link"
                          key={s.slug}
                        >
                          <article className="card algae-list-card">
                            {thumb ? (
                              <img
                                className="algae-thumb"
                                src={thumb}
                                alt={`${s.title} thumbnail`}
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="algae-thumb algae-thumb-placeholder">No image</div>
                            )}
                            <h3 className="algae-list-card-title">
                              <TaxonItalicName taxon={s.title} className="algae-taxon" />
                            </h3>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <p className="algae-detail-nav algae-detail-nav-end">
        <Link href="/#algae-index">← Algae index</Link>
      </p>
    </main>
  );
}
