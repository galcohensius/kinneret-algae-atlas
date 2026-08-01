import type { Metadata } from "next";
import Link from "next/link";
import { getAbout } from "../../lib/about-server";
import { fixScientificTypography } from "../../lib/scientific-text";

export const metadata: Metadata = {
  title: "About – Kinneret Algae Atlas",
  description:
    "Vision, collaborators, and background for the Atlas of Kinneret Microalgae by Dr. Tamar Zohary and Dr. Alla Alster.",
  alternates: {
    canonical: "https://kinneret-algae-atlas.org/about/",
  },
};

export default async function AboutPage() {
  const about = await getAbout();

  return (
    <main className="algae-detail about-page">
      <p className="algae-detail-nav">
        <Link href="/#algae-index">← Algae index</Link>
        {" · "}
        <Link href="/glossary/">Glossary</Link>
        {" · "}
        <Link href="/supplements/">Supplementary material</Link>
      </p>

      <header className="algae-detail-header">
        <h1>{about.title}</h1>
      </header>

      <article className="card algae-profile about-card">
        {about.sections.our_vision.length > 0 ? (
          <section className="narrative-block" aria-labelledby="vision-heading">
            <h2 id="vision-heading" className="section-heading">
              Our vision
            </h2>
            <div className="algae-prose">
              {about.sections.our_vision.map((para, i) => (
                <p key={`vision-${i}`}>{fixScientificTypography(para)}</p>
              ))}
            </div>
          </section>
        ) : null}

        {about.sections.how_to_use.length > 0 ? (
          <section className="narrative-block" aria-labelledby="how-to-heading">
            <h2 id="how-to-heading" className="section-heading">
              How to use this atlas
            </h2>
            <div className="algae-prose">
              {about.sections.how_to_use.map((para, i) => (
                <p key={`how-${i}`}>{fixScientificTypography(para)}</p>
              ))}
            </div>
          </section>
        ) : about.sections.how_to_use_pending ? (
          <section className="narrative-block" aria-labelledby="how-to-heading">
            <h2 id="how-to-heading" className="section-heading">
              How to use this atlas
            </h2>
            <p className="muted">This section is being prepared.</p>
          </section>
        ) : null}

        {about.collaborators.length > 0 ? (
          <section className="narrative-block" aria-labelledby="collaborators-heading">
            <h2 id="collaborators-heading" className="section-heading">
              Our collaborators
            </h2>
            <div className="about-collaborators">
              {about.collaborators.map((person) => (
                <section
                  key={person.id}
                  className="about-person"
                  aria-labelledby={`person-${person.id}`}
                >
                  <h3 id={`person-${person.id}`} className="about-person-name">
                    {person.name}
                  </h3>
                  <div className="algae-prose">
                    {person.paragraphs.map((para, i) => (
                      <p key={`${person.id}-${i}`}>{fixScientificTypography(para)}</p>
                    ))}
                  </div>
                  {person.links.length > 0 ? (
                    <ul className="about-person-links">
                      {person.links.map((href) => (
                        <li key={href}>
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            {href.includes("scholar.google")
                              ? "Google Scholar"
                              : href.replace(/^https?:\/\//, "")}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </section>
        ) : null}
      </article>

      <p className="algae-detail-nav algae-detail-nav-end">
        <Link href="/#algae-index">← Algae index</Link>
      </p>
    </main>
  );
}
