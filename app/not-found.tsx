import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found – Kinneret Algae Atlas",
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "var(--text-primary)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
        Page not found
      </h1>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        The species or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/#algae-index"
        style={{
          marginTop: "0.5rem",
          color: "var(--link)",
          textDecoration: "underline",
          fontSize: "0.95rem",
        }}
      >
        ← Back to species index
      </Link>
    </main>
  );
}
