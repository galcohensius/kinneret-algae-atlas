import type { Metadata } from "next";
import Link from "next/link";
import GlossaryPageClient from "../components/GlossaryPageClient";
import { groupEntriesByLetter } from "../../lib/glossary";
import { getGlossary } from "../../lib/glossary-server";
import { buildCitationBundle } from "../../lib/cite-this-record";

export const metadata: Metadata = {
  title: "Glossary – Kinneret Algae Atlas",
  description:
    "Definitions of morphological and ecological terms used in the Kinneret Algae Atlas species descriptions.",
  alternates: {
    canonical: "https://kinneret-algae-atlas.org/glossary/",
  },
};

export default async function GlossaryPage() {
  const index = await getGlossary();
  const groups = groupEntriesByLetter(index.data.entries);
  const citation = buildCitationBundle(index.data.record_updated);
  const glossaryJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: index.data.title,
    url: "https://kinneret-algae-atlas.org/glossary/",
    description:
      "Definitions of morphological and ecological terms used in Kinneret Algae Atlas records.",
    hasDefinedTerm: index.data.entries.slice(0, 25).map((entry) => ({
      "@type": "DefinedTerm",
      name: entry.term,
      termCode: entry.slug,
      description: entry.definition,
    })),
    citation: [citation.recordCitation, citation.atlasAttribution],
  };

  return (
    <main className="algae-detail glossary-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(glossaryJsonLd) }}
      />
      <p className="algae-detail-nav">
        <Link href="/#algae-index">← Algae index</Link>
        {" · "}
        <Link href="/supplements/">Supplementary material</Link>
      </p>

      <header className="algae-detail-header">
        <h1>Glossary</h1>
      </header>

      <article className="card algae-profile glossary-card">
        <GlossaryPageClient
          title={index.data.title}
          recordUpdated={index.data.record_updated}
          letters={index.letters}
          groups={groups}
          plates={index.data.plates ?? []}
        />
      </article>

      <p className="algae-detail-nav algae-detail-nav-end">
        <Link href="/#algae-index">← Algae index</Link>
      </p>
    </main>
  );
}
