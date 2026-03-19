import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Kinneret Algae Atlas</h1>
      <p className="muted">Lake Kinneret algae catalog with species pages and images.</p>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Explore the atlas</h2>
        <p>
          Browse all algae species extracted from research documents and open a dedicated page
          for each species.
        </p>
        <p style={{ marginBottom: 0 }}>
          <Link href="/algae">Go to algae index</Link>
        </p>
      </section>
    </main>
  );
}
