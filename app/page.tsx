import Image from "next/image";
import type { Metadata } from "next";
import {
  ALLA_ALSTER_PROFILE_URL,
  TAMAR_ZOHARY_PROFILE_URL,
} from "../lib/collaborator-profile-links";
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
    sameAs: [
      "https://kinneret-algae-atlas.org/about/",
      "https://kinneret-algae-atlas.org/llms.txt",
    ],
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
              href={TAMAR_ZOHARY_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Dr. Tamar Zohary
            </a>
            {" & "}
            <a
              href={ALLA_ALSTER_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Dr. Alla Alster
            </a>
          </p>
          <p className="home-hero-affiliation">
            <a
              href="https://www.ocean.org.il/%d7%94%d7%9e%d7%9b%d7%95%d7%9f-%d7%9c%d7%97%d7%a7%d7%a8-%d7%94%d7%9b%d7%a0%d7%a8%d7%aa/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kinneret Limnological Institute
            </a>
            {", "}
            <a
              href="https://www.ocean.org.il/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Israel Oceanographic and Limnological Research
            </a>
          </p>
        </div>
      </div>

      <div className="home-below-hero">
        <AlgaeIndexSectionShell />
      </div>
    </main>
  );
}
