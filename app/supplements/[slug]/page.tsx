import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "../../components/RichText";
import ExpandableFiguresGrid from "../../components/ExpandableFiguresGrid";
import TaxonItalicName from "../../components/TaxonItalicName";
import GlossaryAwarePlainText from "../../components/GlossaryAwarePlainText";
import GlossaryAwareRichText from "../../components/GlossaryAwareRichText";
import { GlossaryLinkScopeProvider } from "../../components/GlossaryLinkScopeProvider";
import { getAllSupplements, getSupplementBySlug } from "../../../lib/supplements";
import { getAllAlgae } from "../../../lib/algae";
import { publicAssetPath } from "../../../lib/public-path";
import { partitionPlateAndGalleryImages } from "../../../lib/partition-plate-images";
import { galleryImageAlt, galleryEnlargeAriaLabel, additionalGallerySectionTitle } from "../../../lib/gallery-image-meta";

type SupplementDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: SupplementDetailPageProps) {
  const { slug } = await params;
  const supplement = await getSupplementBySlug(slug);
  if (!supplement) return {};
  return {
    title: `${supplement.title} – Kinneret Algae Atlas`,
  };
}

export async function generateStaticParams() {
  const supplements = await getAllSupplements();
  return supplements.map((s) => ({ slug: s.slug }));
}

export default async function SupplementDetailPage({ params }: SupplementDetailPageProps) {
  const { slug } = await params;
  const supplement = await getSupplementBySlug(slug);

  if (!supplement) {
    notFound();
  }

  const allAlgae = await getAllAlgae();
  const algaeBySlug = new Map(allAlgae.map((r) => [r.slug, r.scientificName]));

  const images = supplement.images.map((p) => publicAssetPath(p));
  const { plateFigures, galleryImages, galleryCaptions, galleryCaptionsRich } =
    partitionPlateAndGalleryImages(images, supplement.imageCaptions, supplement.imageCaptionsRich);

  const sectionEntries = Object.entries(supplement.sections);

  return (
    <GlossaryLinkScopeProvider>
      <main className="algae-detail">
        <p className="algae-detail-nav">
          <Link href="/supplements/">← Supplementary material</Link>
          <Link href="/#algae-index">Algae index</Link>
        </p>

        <header className="algae-detail-header">
          <p className="supplement-label muted">Supplement</p>
          <h1 className="algae-title">
            <TaxonItalicName taxon={supplement.title} className="algae-taxon" />
          </h1>
        </header>

        <article className="card algae-profile">
          {sectionEntries.map(([key, text]) => {
            const rich = supplement.sectionsRich[key] ?? [];
            return (
              <section key={key} className="narrative-block">
                <div className="algae-prose">
                  {rich.length > 0 ? (
                    <GlossaryAwareRichText segments={rich} />
                  ) : (
                    <GlossaryAwarePlainText text={text} />
                  )}
                </div>
              </section>
            );
          })}

          {plateFigures.map((slot, idx) => (
            <figure className="plate-figure" key={`${slot.src}-${idx}`}>
              <img
                src={slot.src}
                alt={galleryImageAlt(supplement.title, slot.src, idx)}
              />
              {slot.caption.trim() || (slot.captionRich && slot.captionRich.length > 0) ? (
                <figcaption className="muted">
                  {slot.captionRich && slot.captionRich.length > 0 ? (
                    <GlossaryAwareRichText segments={slot.captionRich} />
                  ) : (
                    <GlossaryAwarePlainText text={slot.caption} />
                  )}
                </figcaption>
              ) : null}
            </figure>
          ))}

          {galleryImages.length > 0 ? (
            <section className="figures-section" aria-labelledby="supp-figures-heading">
              <h2 id="supp-figures-heading" className="section-heading">
                {additionalGallerySectionTitle(galleryImages)}
              </h2>
              <ExpandableFiguresGrid
                figures={galleryImages.map((imagePath, index) => ({
                  src: imagePath,
                  alt: galleryImageAlt(supplement.title, imagePath, index),
                  caption: galleryCaptions[index],
                  captionRich: galleryCaptionsRich[index],
                  enlargeAriaLabel: galleryEnlargeAriaLabel(imagePath, index),
                }))}
              />
            </section>
          ) : null}

          {supplement.linkedTaxa.length > 0 ? (
            <section className="narrative-block supplement-referenced-block" aria-labelledby="supp-referenced-heading">
              <h2 id="supp-referenced-heading" className="section-heading">
                Referenced in
              </h2>
              <div className="supplement-taxa-buttons">
                {supplement.linkedTaxa.map((taxonSlug) => (
                  <Link key={taxonSlug} href={`/algae/${taxonSlug}/`} className="taxon-button">
                    <TaxonItalicName
                      taxon={algaeBySlug.get(taxonSlug) ?? taxonSlug.replace(/-/g, " ")}
                      className="algae-taxon"
                    />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <p className="algae-detail-nav algae-detail-nav-end">
          <Link href="/supplements/">← Supplementary material</Link>
        </p>
      </main>
    </GlossaryLinkScopeProvider>
  );
}
