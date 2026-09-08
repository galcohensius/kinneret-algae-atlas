import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AlgaeLegacyRedirect from "./AlgaeLegacyRedirect";

export const metadata: Metadata = {
  title: "Species index",
  robots: { index: false },
};

/** Old `/algae` URL → home (preserves `?q=`). Client redirect for static export. */
export default function AlgaeIndexLegacyRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="algae-redirect">
          <p>
            Redirecting… <Link href="/#algae-index">Open the species index</Link>
          </p>
        </main>
      }
    >
      <AlgaeLegacyRedirect />
    </Suspense>
  );
}
