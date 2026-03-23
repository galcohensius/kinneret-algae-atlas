import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import ExpandableFiguresGrid from "../../components/ExpandableFiguresGrid";
import { RichText } from "../../components/RichText";
import { citationToScholarSearchUrl, splitFurtherReadingCitations } from "../../../lib/further-reading";
import { getAlgaBySlug, getAllAlgae } from "../../../lib/algae";

type AlgaeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const FIELD_LABELS: Record<string, string> = {
  previously_identified: "Previously identified",
  organization: "Organization",
  color: "Color",
  cell_shape: "Cell shape",
  cell_size_or_diameter: "Cell size (or diameter)",
  biovolume_per_cell: "Biovolume/cell",
  biovolume_equation: "Biovolume equation",
  morphological_features: "Morphological features",
  diagnostic_features: "Diagnostic features",
  ecology: "Ecology",
  further_reading: "Further reading"
};

/** Matches typical Word layout: short facts first, then long-form sections. */
const QUICK_FACT_KEYS = [
  "previously_identified",
  "organization",
  "color",
  "cell_shape",
  "cell_size_or_diameter",
  "biovolume_per_cell",
  "biovolume_equation"
] as const;

const NARRATIVE_AFTER_PLATE_KEYS = ["diagnostic_features", "ecology", "further_reading"] as const;

function toDisplayLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] ?? fieldName.replace(/_/g, " ");
}

function FurtherReadingList({ text }: { text: string }) {
  const items = splitFurtherReadingCitations(text);
  return (
    <ol className="further-reading-list">
      {items.map((citation, index) => (
        <li key={`${index}-${citation.slice(0, 24)}`}>
          <a
            href={citationToScholarSearchUrl(citation)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {citation}
          </a>
        </li>
      ))}
    </ol>
  );
}

export async function generateStaticParams() {
  const algae = await getAllAlgae();
  return algae.map((record) => ({ slug: record.slug }));
}

export default async function AlgaeDetailPage({ params }: AlgaeDetailPageProps) {
  const { slug } = await params;
  const record = await getAlgaBySlug(slug);

  if (!record) {
    notFound();
  }

  const sections = record.sections;
  const morphological = sections.morphological_features?.trim() ?? "";
  const morphologicalRich = record.sectionsRich?.morphological_features ?? [];
  const plateImage = record.images[0];
  const plateCaption = record.imageCaptions[0];
  const extraFigures = record.images.slice(1);
  const extraFigureCaptions = record.imageCaptions.slice(1);
  const hasQuickFacts = QUICK_FACT_KEYS.some((key) => (sections[key]?.trim() ?? "").length > 0);

  return (
    <main className="algae-detail">
      <p className="algae-detail-nav">
        <Link href="/#algae-index">← Back to algae index</Link>
      </p>

      <header className="algae-detail-header">
        <h1 className="algae-title">{record.title}</h1>
      </header>

      <article className="card algae-profile">
        {hasQuickFacts ? (
          <section className="quick-facts" aria-labelledby="quick-facts-heading">
            <h2 id="quick-facts-heading" className="section-heading">
              Overview
            </h2>
            <dl className="quick-facts-list">
              {QUICK_FACT_KEYS.map((key) => {
                const value = sections[key]?.trim();
                if (!value) return null;
                const richValue = record.sectionsRich?.[key] ?? [];
                return (
                  <Fragment key={key}>
                    <dt>{toDisplayLabel(key)}</dt>
                    <dd>{richValue.length > 0 ? <RichText segments={richValue} /> : value}</dd>
                  </Fragment>
                );
              })}
            </dl>
          </section>
        ) : null}

        {morphological ? (
          <section className="narrative-block" aria-labelledby="morph-heading">
            <h2 id="morph-heading" className="section-heading">
              {toDisplayLabel("morphological_features")}
            </h2>
            <div className="algae-prose">{morphologicalRich.length > 0 ? <RichText segments={morphologicalRich} /> : morphological}</div>
          </section>
        ) : null}

        {plateImage ? (
          <figure className="plate-figure">
            <img src={plateImage} alt={`${record.title} — microscopy / plate (from source)`} />
            <figcaption className="muted">
              {plateCaption ?? "Microscopy and composite figures as in the source document (plate / panels)."}
            </figcaption>
          </figure>
        ) : null}

        {NARRATIVE_AFTER_PLATE_KEYS.map((key) => {
          const value = sections[key]?.trim();
          if (!value) return null;
          if (key === "further_reading") {
            return (
              <section
                className="narrative-block further-reading-block"
                key={key}
                aria-labelledby={`${key}-heading`}
              >
                <h2 id={`${key}-heading`} className="section-heading">
                  {toDisplayLabel(key)}
                </h2>
                <FurtherReadingList text={value} />
              </section>
            );
          }
          return (
            <section className="narrative-block" key={key} aria-labelledby={`${key}-heading`}>
              <h2 id={`${key}-heading`} className="section-heading">
                {toDisplayLabel(key)}
              </h2>
              <div className="algae-prose">
                {(record.sectionsRich?.[key] ?? []).length > 0 ? (
                  <RichText segments={record.sectionsRich[key]} />
                ) : (
                  value
                )}
              </div>
            </section>
          );
        })}

        {extraFigures.length > 0 ? (
          <section className="figures-section" aria-labelledby="figures-heading">
            <h2 id="figures-heading" className="section-heading">
              Additional figures
            </h2>
            <ExpandableFiguresGrid
              figures={extraFigures.map((imagePath, index) => ({
                src: imagePath,
                alt: `${record.title} — figure ${index + 2}`,
                caption: extraFigureCaptions[index]
              }))}
            />
          </section>
        ) : null}
      </article>
    </main>
  );
}
