import Link from "next/link";
import { getAllAlgae, searchAlgae } from "../../lib/algae";

type AlgaeIndexSectionProps = {
  query: string;
};

export default async function AlgaeIndexSection({ query }: AlgaeIndexSectionProps) {
  const records = query.trim() ? await searchAlgae(query) : await getAllAlgae();

  return (
    <section
      id="algae-index"
      className="home-algae-index"
      aria-labelledby="algae-index-heading"
    >
      <h2 id="algae-index-heading" className="algae-index-title">
        Algae index
      </h2>
      <p className="muted">
        Browse algae species extracted from Lake Kinneret research documents.
      </p>

      <form method="get" action="/" className="algae-index-search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search scientific name..."
        />
      </form>

      <p className="muted algae-index-count">{records.length} records</p>

      <div className="algae-list-grid">
        {records.map((record) => (
          <article className="card algae-list-card" key={record.slug}>
            {record.images[0] ? (
              <img
                className="algae-thumb"
                src={record.images[0]}
                alt={`${record.title} thumbnail`}
              />
            ) : (
              <div className="algae-thumb algae-thumb-placeholder">No image</div>
            )}
            <h3 className="algae-list-card-title">
              <Link href={`/algae/${record.slug}`}>{record.title}</Link>
            </h3>
          </article>
        ))}
      </div>
    </section>
  );
}
