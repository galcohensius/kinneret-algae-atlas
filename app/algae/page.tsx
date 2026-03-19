import Link from "next/link";
import { getAllAlgae, searchAlgae } from "../../lib/algae";

type AlgaeIndexPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function AlgaeIndexPage({ searchParams }: AlgaeIndexPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = resolvedSearchParams.q ?? "";
  const records = query ? await searchAlgae(query) : await getAllAlgae();

  return (
    <main>
      <p>
        <Link href="/">Back to home</Link>
      </p>
      <h1>Algae index</h1>
      <p className="muted">Browse algae species extracted from Lake Kinneret research documents.</p>

      <form method="get" style={{ marginBottom: "1rem" }}>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search scientific name..."
          style={{ width: "100%", maxWidth: "360px", padding: "0.5rem" }}
        />
      </form>

      <p className="muted">{records.length} records</p>

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
            <h2 style={{ margin: 0 }}>
              <Link href={`/algae/${record.slug}`}>{record.title}</Link>
            </h2>
          </article>
        ))}
      </div>
    </main>
  );
}
