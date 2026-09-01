import type { Metadata } from "next";
import Link from "next/link";
import VisualIndexGrid from "../components/VisualIndexGrid";
import { getAllAlgae } from "../../lib/algae";
import { buildVisualIndexCells } from "../../lib/visual-index-layout";
import { socialPreviewMetadata } from "../../lib/site";

export const metadata: Metadata = {
  title: "Visual index – Kinneret Algae Atlas",
  description:
    "Browse Kinneret microalgae by appearance. Similar morphotypes cluster together; phylum is shown by color ring.",
  alternates: {
    canonical: "https://kinneret-algae-atlas.org/visual-index/",
  },
  ...socialPreviewMetadata({
    title: "Visual index",
    description:
      "Browse Kinneret microalgae by appearance. Similar morphotypes cluster together; phylum is shown by color ring.",
    path: "/visual-index/",
  }),
};

export default async function VisualIndexPage() {
  const records = await getAllAlgae();
  const cells = buildVisualIndexCells(records);

  return (
    <main className="algae-detail visual-index-page">
      <p className="algae-detail-nav">
        <Link href="/#algae-index">← Algae index</Link>
        {" · "}
        <Link href="/about/">About</Link>
        {" · "}
        <Link href="/glossary/">Glossary</Link>
        {" · "}
        <Link href="/supplements/">Supplementary material</Link>
      </p>

      <header className="algae-detail-header">
        <h1>Visual index</h1>
        <p className="muted visual-index-lead">
          Browse species by appearance — similar shapes cluster together. Color ring = phylum.
          Hover or focus a picture to see the name; tap on touch devices.
        </p>
      </header>

      <article className="card visual-index-card">
        <VisualIndexGrid cells={cells} />
      </article>
    </main>
  );
}
