"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HOME_VISUAL_INDEX_HASH } from "../../lib/index-view";

/** `/visual-index/` → home in the "By morphotype" view (static export cannot use server redirect()). */
export default function VisualIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${HOME_VISUAL_INDEX_HASH}`);
  }, [router]);

  return (
    <main className="algae-redirect">
      <p>Redirecting…</p>
    </main>
  );
}
