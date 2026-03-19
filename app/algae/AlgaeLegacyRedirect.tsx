"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** `/algae?q=` → `/?q=` (static export cannot use server redirect()). */
export default function AlgaeLegacyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    router.replace(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }, [router, searchParams]);

  return (
    <main className="algae-redirect">
      <p>Redirecting…</p>
    </main>
  );
}
