import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlgaBySlug, getAllAlgae } from "../../../lib/algae";

type AlgaeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

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

  return (
    <main>
      <p>
        <Link href="/">Back to index</Link>
      </p>
      <h1>{record.title}</h1>
      <p className="muted">Source: {String(record.metadata.source_file ?? "Unknown source")}</p>

      {record.images.length > 0 ? (
        <section className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>Images</h2>
          <div className="gallery">
            {record.images.map((imagePath) => (
              <figure key={imagePath} className="gallery-item">
                <img src={imagePath} alt={`${record.title} reference`} />
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {Object.entries(record.sections).map(([sectionName, sectionValue]) => (
        <section className="card" key={sectionName}>
          <h2 className="section-title" style={{ textTransform: "capitalize", marginTop: 0 }}>
            {sectionName}
          </h2>
          {sectionValue
            .split(/(?<=\.)\s+/)
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`${sectionName}-${index}`}>{paragraph.trim()}</p>
            ))}
        </section>
      ))}
    </main>
  );
}
