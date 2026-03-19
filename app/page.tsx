import Image from "next/image";
import AlgaeIndexSection from "./components/AlgaeIndexSection";

type HomePageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolved = searchParams ? await searchParams : {};
  const query = resolved.q ?? "";

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
          <p className="home-hero-lead">Dr. Tamar Zohary</p>
        </div>
      </div>

      <div className="home-below-hero">
        <AlgaeIndexSection query={query} />
      </div>
    </main>
  );
}
