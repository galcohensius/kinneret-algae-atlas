"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export const ORIGIN_PARAM = "from";
export const VISUAL_INDEX_ORIGIN = "visual-index";

function DefaultBackLink() {
  return <Link href="/#algae-index">← Back to algae index</Link>;
}

function VisualIndexBackLink() {
  return <Link href="/visual-index/">← Back to visual index</Link>;
}

/** Back link that returns to the visual index when reached via ?from=visual-index. */
export default function BackToIndexLink() {
  const [fromVisualIndex, setFromVisualIndex] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFromVisualIndex(params.get(ORIGIN_PARAM) === VISUAL_INDEX_ORIGIN);
  }, []);

  return fromVisualIndex ? <VisualIndexBackLink /> : <DefaultBackLink />;
}
