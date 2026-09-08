"use client";

import { useEffect } from "react";
import Link from "next/link";
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
      <p>
        Redirecting… <Link href={`/${HOME_VISUAL_INDEX_HASH}`}>Open the visual index</Link>
      </p>
    </main>
  );
}
