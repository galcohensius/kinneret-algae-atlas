import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <div className="home-hero">
        <Image
          src="/kinneret-lake.jpg"
          alt="Lake Kinneret (Sea of Galilee), view from the eastern hills"
          fill
          priority
          sizes="100vw"
          className="home-hero-img"
        />
        <div className="home-hero-scrim" aria-hidden />
        <div className="home-hero-content">
          <h1>Kinneret Algae Atlas</h1>
          <p className="home-hero-lead">
            Lake Kinneret algae catalog with species pages and images.
          </p>
          <Link className="home-hero-cta" href="/algae">
            Explore the algae index
          </Link>
        </div>
      </div>

      <div className="home-below-hero">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>About this atlas</h2>
          <p>
            Browse algae species extracted from Lake Kinneret research documents. Each species has
            its own page with structured fields, ecology, and figures from the source materials.
          </p>
          <p style={{ marginBottom: 0 }}>
            <Link href="/algae">Go to algae index →</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
