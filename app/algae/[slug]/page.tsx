import { Fragment } from "react";
import { notFound } from "next/navigation";
import BackToIndexLink from "../../components/BackToIndexLink";
import CiteThisRecordBlock from "../../components/CiteThisRecordBlock";
import TaxonItalicName from "../../components/TaxonItalicName";
import ExpandableFiguresGrid from "../../components/ExpandableFiguresGrid";
import GlossaryAwarePlainText from "../../components/GlossaryAwarePlainText";
import GlossaryAwareRichText from "../../components/GlossaryAwareRichText";
import GlossaryAwareText from "../../components/GlossaryAwareText";
import { GlossaryLinkScopeProvider } from "../../components/GlossaryLinkScopeProvider";
import PreviousNameHeader from "../../components/PreviousNameHeader";
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
  galleryEnlargeAriaLabel,
  galleryImageAlt,
} from "../../../lib/gallery-image-meta";
import {
  partitionEcologyAndLaterFigures,
  partitionPlateAndGalleryImages,
  type PlateFigureSlot,
} from "../../../lib/partition-plate-images";
import { buildCitationBundle } from "../../../lib/cite-this-record";

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
  colony_shape: "Colony shape",
  cell_diameter_d: "Cell diameter (D)",
  cell_length_l: "Cell length (L)",
  biovolume_per_cell: "Cell biovolume",
  biovolume_equation: "Biovolume equation",
  filament_length: "Filament length",
  cells_per_filament: "Cells per filament",
  colony_diameter: "Colony diameter",
  cells_per_colony: "Cells per colony",
  indicator_species: "Indicator species",
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
  "colony_shape",
  "cell_diameter_d",
  "cell_length_l",
  "biovolume_per_cell",
  "biovolume_equation",
  "filament_length",
  "cells_per_filament",
  "colony_diameter",
  "cells_per_colony"
] as const;

const QUICK_FACT_BODY_KEYS = QUICK_FACT_KEYS.filter((key) => key !== "previous_name_used");

// Narrative order: Ecology → Physiological features → Environmental conditions.
// Figures 1–2 sit after Ecology; Figures 3+ after Environmental conditions (no gallery heading).
const NARRATIVE_AFTER_PLATE_KEYS = [
  "ecology",
  "physiological_features",
  "environmental_conditions"
] as const;

function toDisplayLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] ?? fieldName.replace(/_/g, " ");
}

function FigureGalleryBlock({
  figures,
  recordTitle,
  startIndex,
}: {
  figures: PlateFigureSlot[];
  recordTitle: string;
  startIndex: number;
}) {
  return (
    <section className="figures-section">
      <ExpandableFiguresGrid
        figures={figures.map((slot, index) => ({
          src: slot.src,
          alt: galleryImageAlt(recordTitle, slot.src, startIndex + index),
          caption: slot.caption,
          captionRich: slot.captionRich,
          enlargeAriaLabel: galleryEnlargeAriaLabel(slot.src, startIndex + index),
        }))}
      />
    </section>
  );
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

export async function generateMetadata({ params }: AlgaeDetailPageProps) {
  const { slug } = await params;
  const record = await getAlgaBySlug(slug);
  if (!record) return {};
  const excerpt = record.ecology?.replace(/\s+/g, " ").slice(0, 160).trimEnd();
  return {
    title: `${record.scientificName} – Kinneret Algae Atlas`,
    ...(excerpt && { description: excerpt }),
    alternates: {
      canonical: `https://kinneret-algae-atlas.org/algae/${record.slug}`,
    },
  };
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
  const indicatorSpecies = sections.indicator_species?.trim() ?? "";
  const indicatorSpeciesRich = record.sectionsRich?.indicator_species ?? [];
  const morphological = sections.morphological_features?.trim() ?? "";
  const morphologicalRich = record.sectionsRich?.morphological_features ?? [];
  const {
    plateFigures,
    galleryImages,
    galleryCaptions,
    galleryCaptionsRich,
  } = partitionPlateAndGalleryImages(
    record.images,
    record.imageCaptions,
    record.imageCaptionsRich
  );
  const { ecologyFigures, laterFigures } = partitionEcologyAndLaterFigures(
    galleryImages,
    galleryCaptions,
    galleryCaptionsRich
  );
  const hasQuickFacts = QUICK_FACT_BODY_KEYS.some((key) => (sections[key]?.trim() ?? "").length > 0);
  const previousNamePlain = sections.previous_name_used?.trim() ?? "";
  const citation = buildCitationBundle(record.recordUpdated);
  const speciesJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: record.scientificName,
    termCode: record.slug,
    url: `https://kinneret-algae-atlas.org/algae/${record.slug}`,
    description: (sections.ecology ?? sections.morphological_features ?? "").trim().slice(0, 320),
    inDefinedTermSet: "https://kinneret-algae-atlas.org/#algae-index",
    isPartOf: {
      "@type": "Dataset",
      name: "Kinneret Algae Atlas",
      url: "https://kinneret-algae-atlas.org/",
    },
    citation: [citation.recordCitation, citation.atlasAttribution],
  };

  return (
    <GlossaryLinkScopeProvider>
      <main className="algae-detail">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(speciesJsonLd) }}
        />
        <p className="algae-detail-nav">
          <BackToIndexLink />
        </p>

      <header className="algae-detail-header">
        <h1 className="algae-title">
          <TaxonItalicName taxon={record.scientificName} className="algae-taxon" />
          {record.nameAuthority ? (
            <>
              {" "}
              <span className="algae-name-authority">{record.nameAuthority}</span>
            </>
          ) : null}
        </h1>
        {previousNamePlain ? (
          <PreviousNameHeader
            label={toDisplayLabel("previous_name_used")}
            plain={previousNamePlain}
          />
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
                    <dd>
                      {richValue.length > 0 ? (
                        <GlossaryAwareRichText segments={richValue} />
                      ) : (
                        <GlossaryAwareText text={value} />
                      )}
                    </dd>
                  </Fragment>
                );
              })}
            </dl>
          </section>
        ) : null}

        {indicatorSpecies ? (
          <section className="narrative-block" aria-labelledby="indicator-heading">
            <h2 id="indicator-heading" className="section-heading">
              {toDisplayLabel("indicator_species")}
            </h2>
            <div className="algae-prose">
              {indicatorSpeciesRich.length > 0 ? (
                <GlossaryAwareRichText segments={indicatorSpeciesRich} />
              ) : (
                <GlossaryAwarePlainText text={indicatorSpecies} />
              )}
            </div>
          </section>
        ) : null}

        {morphological ? (
          <section className="narrative-block" aria-labelledby="morph-heading">
            <h2 id="morph-heading" className="section-heading">
              {toDisplayLabel("morphological_features")}
            </h2>
            <div className="algae-prose">
              {morphologicalRich.length > 0 ? (
                <GlossaryAwareRichText segments={morphologicalRich} />
              ) : (
                <GlossaryAwarePlainText text={morphological} />
              )}
            </div>
          </section>
        ) : null}

        {plateFigures.map((slot, idx) => (
          <figure className="plate-figure" key={`${slot.src}-${idx}`}>
            <img
              src={slot.src}
              alt={galleryImageAlt(record.title, slot.src, idx)}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
            />
            <figcaption className="muted">
              {slot.captionRich && slot.captionRich.length > 0 ? (
                <RichText segments={slot.captionRich} />
              ) : slot.caption.trim() ? (
                slot.caption
              ) : (
                "Microscopy and composite figures as in the source document (plate / panels)."
              )}
            </figcaption>
          </figure>
        ))}

        {NARRATIVE_AFTER_PLATE_KEYS.map((key) => {
          const value = sections[key]?.trim();
          const sectionBlock =
            value ? (
              <section className="narrative-block" aria-labelledby={`${key}-heading`}>
                <h2 id={`${key}-heading`} className="section-heading">
                  {toDisplayLabel(key)}
                </h2>
                <div className="algae-prose">
                  {(record.sectionsRich?.[key] ?? []).length > 0 ? (
                    <GlossaryAwareRichText segments={record.sectionsRich[key]} />
                  ) : (
                    <GlossaryAwarePlainText text={value} />
                  )}
                </div>
              </section>
            ) : null;

          const figuresAfter =
            key === "ecology"
              ? ecologyFigures
              : key === "environmental_conditions" && value
                ? laterFigures
                : [];

          if (!sectionBlock && figuresAfter.length === 0) return null;

          return (
            <Fragment key={key}>
              {sectionBlock}
              {figuresAfter.length > 0 ? (
                <FigureGalleryBlock
                  figures={figuresAfter}
                  recordTitle={record.title}
                  startIndex={key === "ecology" ? 0 : ecologyFigures.length}
                />
              ) : null}
            </Fragment>
          );
        })}

        {/* Figures 3+ when Environmental conditions section is absent */}
        {!sections.environmental_conditions?.trim() && laterFigures.length > 0 ? (
          <FigureGalleryBlock
            figures={laterFigures}
            recordTitle={record.title}
            startIndex={ecologyFigures.length}
          />
        ) : null}

        <CiteThisRecordBlock recordUpdatedIso={record.recordUpdated} />

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
          <BackToIndexLink />
        </p>
      </main>
    </GlossaryLinkScopeProvider>
  );
}
