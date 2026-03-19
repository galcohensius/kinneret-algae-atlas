import { Suspense } from "react";
import AlgaeLegacyRedirect from "./AlgaeLegacyRedirect";

/** Old `/algae` URL → home (preserves `?q=`). Client redirect for static export. */
export default function AlgaeIndexLegacyRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="algae-redirect">
          <p>Redirecting…</p>
        </main>
      }
    >
      <AlgaeLegacyRedirect />
    </Suspense>
  );
}
