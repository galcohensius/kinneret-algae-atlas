import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import ExpandableFiguresGrid from "../../components/ExpandableFiguresGrid";
import { RichText } from "../../components/RichText";
import type { RichSegment } from "../../../lib/algae-types";
import {
  citationToScholarSearchUrl,
  normalizeFurtherReadingWhitespace,
  splitFurtherReadingIndexed,
} from "../../../lib/further-reading";
import { sliceRichSegmentsByPlainRange } from "../../../lib/rich-segments";
import { getAlgaBySlug, getAllAlgae } from "../../../lib/algae";
import {
  additionalGallerySectionTitle,
  galleryEnlargeAriaLabel,
  galleryImageAlt,
} from "../../../lib/gallery-image-meta";
import { partitionPlateAndGalleryImages } from "../../../lib/partition-plate-images";

type AlgaeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const FIELD_LABELS: Record<string, string> = {
  phylum: "Phylum",
  class: "Class",
  order: "Order",
  habitat: "Habitat",
  previous_name_used: "Previous name used",
  organization: "Organization",
  color: "Color",
  cell_shape: "Cell shape",
  cell_diameter_d: "Cell diameter (D)",
  cell_length_l: "Cell length (L)",
  biovolume_per_cell: "Cell biovolume",
  biovolume_equation: "Biovolume equation",
  morphological_features: "Morphological features",
  distinctive_attributes: "Distinctive features",
  ecology: "Ecology",
  physiological_features: "Physiological features",
  environmental_conditions: "Environmental conditions",
  further_reading: "Further reading"
};

/**
 * Quick-facts order: taxonomy/habitat/distinctive traits first, then organization and size.
 * `previous_name_used` is rendered in the page header (under the species title); it stays in
 * this list only so its logical position is between habitat and distinctive_attributes.
 */
const QUICK_FACT_KEYS = [
  "phylum",
  "class",
  "order",
  "habitat",
  "previous_name_used",
  "distinctive_attributes",
  "organization",
  "color",
  "cell_shape",
  "cell_diameter_d",
  "cell_length_l",
  "biovolume_per_cell",
  "biovolume_equation"
] as const;

const QUICK_FACT_BODY_KEYS = QUICK_FACT_KEYS.filter((key) => key !== "previous_name_used");

// Render "Further reading" after "Additional figures" (site requirement).
const NARRATIVE_AFTER_PLATE_KEYS = [
  "ecology",
  "physiological_features",
  "environmental_conditions"
] as const;

function toDisplayLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] ?? fieldName.replace(/_/g, " ");
}

function FurtherReadingList({
  text,
  segments,
}: {
  text: string;
  segments?: RichSegment[];
}) {
  const indexed = splitFurtherReadingIndexed(text.trim());
  const joined = (segments ?? []).map((s) => s.text).join("");
  const canRich =
    (segments?.length ?? 0) > 0 &&
    normalizeFurtherReadingWhitespace(joined) === normalizeFurtherReadingWhitespace(text.trim());

  return (
    <ol className="further-reading-list">
      {indexed.map((item, index) => {
        const sliced =
          canRich && segments
            ? sliceRichSegmentsByPlainRange(segments, item.normStart, item.normEnd)
            : [];
        const useRich = canRich && sliced.some((s) => s.text.length > 0);
        return (
          <li key={`${index}-${item.citation.slice(0, 24)}`}>
            <a
              href={citationToScholarSearchUrl(item.citation)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {useRich ? (
                <>
                  <RichText segments={sliced} />
                  {item.needsTrailingPeriod ? "." : null}
                </>
              ) : (
                item.citation
              )}
            </a>
          </li>
        );
      })}
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
  const {
    plateImage,
    plateCaption,
    plateCaptionRich,
    galleryImages,
    galleryCaptions,
    galleryCaptionsRich,
  } = partitionPlateAndGalleryImages(
    record.images,
    record.imageCaptions,
    record.imageCaptionsRich
  );
  const extraFigures = galleryImages;
  const extraFigureCaptions = galleryCaptions;
  const hasQuickFacts = QUICK_FACT_BODY_KEYS.some((key) => (sections[key]?.trim() ?? "").length > 0);
  const previousNamePlain = sections.previous_name_used?.trim() ?? "";
  const previousNameRich = record.sectionsRich?.previous_name_used ?? [];

  return (
    <main className="algae-detail">
      <p className="algae-detail-nav">
        <Link href="/#algae-index">← Back to algae index</Link>
      </p>

      <header className="algae-detail-header">
        <h1 className="algae-title">
          <span className="algae-taxon">{record.scientificName}</span>
          {record.nameAuthority ? (
            <>
              {" "}
              <span className="algae-name-authority">{record.nameAuthority}</span>
            </>
          ) : null}
        </h1>
        {previousNamePlain ? (
          <p className="algae-previous-name-line">
            <span className="algae-previous-name-label">{toDisplayLabel("previous_name_used")}: </span>
            {previousNameRich.length > 0 ? (
              <RichText segments={previousNameRich} />
            ) : (
              previousNamePlain
            )}
          </p>
        ) : null}
      </header>

      <article className="card algae-profile">
        {hasQuickFacts ? (
          <section className="quick-facts" aria-label="Taxonomy, size, and biovolume">
            <dl className="quick-facts-list">
              {QUICK_FACT_BODY_KEYS.map((key) => {
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
              {plateCaptionRich && plateCaptionRich.length > 0 ? (
                <RichText segments={plateCaptionRich} />
              ) : plateCaption?.trim() ? (
                plateCaption
              ) : (
                "Microscopy and composite figures as in the source document (plate / panels)."
              )}
            </figcaption>
          </figure>
        ) : null}

        {NARRATIVE_AFTER_PLATE_KEYS.map((key) => {
          const value = sections[key]?.trim();
          if (!value) return null;
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
              {additionalGallerySectionTitle(extraFigures)}
            </h2>
            <ExpandableFiguresGrid
              figures={extraFigures.map((imagePath, index) => ({
                src: imagePath,
                alt: galleryImageAlt(record.title, imagePath, index),
                caption: extraFigureCaptions[index],
                captionRich: galleryCaptionsRich[index],
                enlargeAriaLabel: galleryEnlargeAriaLabel(imagePath, index),
              }))}
            />
          </section>
        ) : null}

        {sections.further_reading?.trim() ? (
          <section
            className="narrative-block further-reading-block"
            aria-labelledby="further_reading-heading"
          >
            <h2 id="further_reading-heading" className="section-heading">
              {toDisplayLabel("further_reading")}
            </h2>
            <FurtherReadingList
              text={sections.further_reading.trim()}
              segments={record.sectionsRich?.further_reading}
            />
          </section>
        ) : null}
      </article>

      <p className="algae-detail-nav algae-detail-nav-end">
        <Link href="/#algae-index">← Back to algae index</Link>
      </p>
    </main>
  );
}
