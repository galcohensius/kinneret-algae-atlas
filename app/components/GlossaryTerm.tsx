"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { glossaryEntryHref } from "../../lib/glossary-href";

type GlossaryTermProps = {
  matchedText: string;
  slug: string;
  term: string;
  definition: string;
};

export default function GlossaryTerm({
  matchedText,
  slug,
  term,
  definition,
}: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popoverId = useId();
  const href = glossaryEntryHref(slug);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, close]);

  return (
    <span className="glossary-term-wrap" ref={wrapRef}>
      <button
        type="button"
        className="glossary-term-trigger"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((v) => !v)}
      >
        {matchedText}
      </button>
      {open ? (
        <span
          id={popoverId}
          role="tooltip"
          className="glossary-popover"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="glossary-popover-term">{term}</span>
          <span className="glossary-popover-def">{definition}</span>
          <Link className="glossary-popover-link" href={href} onClick={close}>
            Glossary →
          </Link>
        </span>
      ) : null}
    </span>
  );
}
