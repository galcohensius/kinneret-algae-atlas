"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export const ORIGIN_PARAM = "from";
export const VISUAL_INDEX_ORIGIN = "visual-index";

function DefaultBackLink() {
  return <Link href="/#algae-index">← Back to algae index</Link>;
}

function OriginAwareBackLink() {
  const searchParams = useSearchParams();
  if (searchParams.get(ORIGIN_PARAM) === VISUAL_INDEX_ORIGIN) {
    return <Link href="/visual-index/">← Back to visual index</Link>;
  }
  return <DefaultBackLink />;
}

/** Back link that returns to the visual index when reached via ?from=visual-index. */
export default function BackToIndexLink() {
  return (
    <Suspense fallback={<DefaultBackLink />}>
      <OriginAwareBackLink />
    </Suspense>
  );
}
