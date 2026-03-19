import Link from "next/link";
import { getAllAlgae, searchAlgae } from "../lib/algae";

type HomePageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = resolvedSearchParams.q ?? "";
  const records = query ? await searchAlgae(query) : await getAllAlgae();

  return (
    <main>
      <h1>Kinneret Algae Atlas</h1>
      <p className="muted">
        Browse algae species extracted from Lake Kinneret research documents.
      </p>

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

      {records.map((record) => (
        <article className="card" key={record.slug}>
          <h2 style={{ marginTop: 0 }}>
            <Link href={`/algae/${record.slug}`}>{record.title}</Link>
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {record.ecology ?? record.morphology ?? record.notes ?? "No summary available."}
          </p>
        </article>
      ))}
    </main>
  );
}
