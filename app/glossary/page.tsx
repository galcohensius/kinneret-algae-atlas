import type { Metadata } from "next";
import GlossaryPageClient from "../components/GlossaryPageClient";
import { groupEntriesByLetter } from "../../lib/glossary";
import { getGlossary } from "../../lib/glossary-server";
import { buildCitationBundle } from "../../lib/cite-this-record";
import { absoluteUrl, socialPreviewMetadata } from "../../lib/site";
import { publicImageDimensions } from "../../lib/image-dimensions";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Definitions of morphological and ecological terms used in the Kinneret Algae Atlas species descriptions.",
  alternates: {
    canonical: absoluteUrl("/glossary/"),
  },
  ...socialPreviewMetadata({
    title: "Glossary",
    description:
      "Definitions of morphological and ecological terms used in the Kinneret Algae Atlas species descriptions.",
    path: "/glossary/",
  }),
};

export default async function GlossaryPage() {
  const index = await getGlossary();
  const groups = groupEntriesByLetter(index.data.entries);
  const citation = buildCitationBundle(index.data.record_updated);
  const glossaryJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: index.data.title,
    url: absoluteUrl("/glossary/"),
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
      <header className="algae-detail-header">
        <h1>Glossary</h1>
      </header>

      <article className="card algae-profile glossary-card">
        <GlossaryPageClient
          title={index.data.title}
          recordUpdated={index.data.record_updated}
          letters={index.letters}
          groups={groups}
          plates={(index.data.plates ?? []).map((plate) => ({
            ...plate,
            ...publicImageDimensions(plate.src),
          }))}
        />
      </article>
    </main>
  );
}
