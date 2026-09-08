"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HOME_VISUAL_INDEX_HASH,
  ORIGIN_PARAM,
  VISUAL_INDEX_ORIGIN,
} from "../../lib/index-view";

const DEFAULT_BACK_LINK = { href: "/#algae-index", label: "← Back to algae index" };
const VISUAL_INDEX_BACK_LINK = {
  href: `/${HOME_VISUAL_INDEX_HASH}`,
  label: "← Back to visual index",
};

/** Back link that returns to whichever index view the visitor came from (?from=...). */
export default function BackToIndexLink() {
  const [target, setTarget] = useState(DEFAULT_BACK_LINK);

  useEffect(() => {
    const origin = new URLSearchParams(window.location.search).get(ORIGIN_PARAM);
    setTarget(origin === VISUAL_INDEX_ORIGIN ? VISUAL_INDEX_BACK_LINK : DEFAULT_BACK_LINK);
  }, []);

  return <Link href={target.href}>{target.label}</Link>;
}
