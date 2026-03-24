import Image from "next/image";
import { publicAssetPath } from "../lib/public-path";
import AlgaeIndexSectionShell from "./components/AlgaeIndexSectionShell";

export default function HomePage() {
  return (
    <main className="home">
      <div className="home-hero">
        <Image
          src={publicAssetPath("/kinneret-lake.jpg")}
          alt="Lake Kinneret (Sea of Galilee), view from the eastern hills"
          fill
          priority
          sizes="100vw"
          className="home-hero-img"
        />
        <div className="home-hero-scrim" aria-hidden />
        <div className="home-hero-content">
          <h1>Atlas of Kinneret Microalgae</h1>
          <p className="home-hero-lead">
            <a
              href="https://scholar.google.com/citations?user=hwxUAKsAAAAJ&hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tamar Zohary
            </a>
            {", "}
            <a
              href="https://www.linkedin.com/in/alla-alster-5876a422/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Alla Alster
            </a>
            {", and "}
            <a
              href="https://github.com/galcohensius"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gal Cohensius
            </a>
          </p>
        </div>
      </div>

      <div className="home-below-hero">
        <AlgaeIndexSectionShell />
      </div>
    </main>
  );
}
