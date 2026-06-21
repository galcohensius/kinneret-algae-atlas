import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { publicAssetPath } from "../lib/public-path";
import AlgaeIndexSectionShell from "./components/AlgaeIndexSectionShell";
import { buildAtlasAttribution } from "../lib/cite-this-record";

export const metadata: Metadata = {
  title: "Kinneret Algae Atlas",
  description:
    "Atlas of Kinneret microalgae by Dr. Tamar Zohary and Dr. Alla Alster, with species records, glossary definitions, and supplementary material.",
  alternates: {
    canonical: "https://kinneret-algae-atlas.org/",
  },
};

export default function HomePage() {
  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Kinneret Algae Atlas",
    url: "https://kinneret-algae-atlas.org/",
    description:
      "Atlas of Kinneret microalgae with species profiles, glossary terms, and supplementary material.",
    creator: [
      {
        "@type": "Person",
        name: "Dr. Tamar Zohary",
      },
      {
        "@type": "Person",
        name: "Dr. Alla Alster",
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "Israel Oceanographic & Limnological Research",
    },
    citation: buildAtlasAttribution(),
    license: "All rights reserved",
  };

  return (
    <main className="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <div className="home-hero">
        <Image
          src={publicAssetPath("/kinneret-lake.jpg")}
          alt="Lake Kinneret (Sea of Galilee), view from the eastern hills"
          fill
          priority
          sizes="100vw"
          className="home-hero-img"
        />
        <div className="home-hero-scrim" aria-hidden />
        <div className="home-hero-content">
          <h1>Atlas of Kinneret Microalgae</h1>
          <p className="home-hero-lead">
            <a
              href="https://scholar.google.com/citations?user=hwxUAKsAAAAJ&hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dr. Tamar Zohary
            </a>
            {" & "}
            <a
              href="https://www.linkedin.com/in/alla-alster-5876a422/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dr. Alla Alster
            </a>
          </p>
          <p className="home-hero-affiliation">
            Kinneret Limnological Institute, Israel Oceanographic and Limnological Research
          </p>
        </div>
      </div>

      <div className="home-below-hero">
        <AlgaeIndexSectionShell />
        <nav className="home-aux-links" aria-label="Reference material">
          <Link href="/glossary/">Glossary</Link>
          <Link href="/supplements/">Supplementary Material</Link>
        </nav>
      </div>
    </main>
  );
}
