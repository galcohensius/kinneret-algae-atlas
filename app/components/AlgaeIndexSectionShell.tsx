import { Suspense } from "react";
import { getAllAlgae } from "../../lib/algae";
import AlgaeIndexSection from "./AlgaeIndexSection";

/** Suspense boundary required for useSearchParams in the client index. */
export default async function AlgaeIndexSectionShell() {
  const records = await getAllAlgae();
  return (
    <Suspense fallback={<AlgaeIndexFallback />}>
      <AlgaeIndexSection records={records} />
    </Suspense>
  );
}

function AlgaeIndexFallback() {
  return (
    <section className="home-algae-index" aria-busy="true">
      <h2 className="algae-index-title">Algae index</h2>
      <p className="muted">Loading…</p>
    </section>
  );
}
