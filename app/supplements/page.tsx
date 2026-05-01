import type { Metadata } from "next";
import Link from "next/link";
import TaxonItalicName from "../components/TaxonItalicName";
import { getAllSupplements } from "../../lib/supplements";

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
      </header>

      <article className="card algae-profile">
        {supplements.length === 0 ? (
          <p className="muted">No supplements available.</p>
        ) : (
          <ul className="supplement-taxa-links">
            {supplements.map((s) => (
              <li key={s.slug}>
                <Link href={`/supplements/${s.slug}/`}>
                  <TaxonItalicName taxon={s.title} className="algae-taxon" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>

      <p className="algae-detail-nav algae-detail-nav-end">
        <Link href="/#algae-index">← Algae index</Link>
      </p>
    </main>
  );
}
