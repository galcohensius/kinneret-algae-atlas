"use client";

import { Fragment } from "react";
import type { RichSegment } from "../../lib/algae-types";
import { linkGlossaryInPlainText } from "../../lib/glossary-link";
import { glossaryIndex } from "../../lib/glossary-client";
import { sliceRichSegmentsByPlainRange } from "../../lib/rich-segments";
import { textContainsTables } from "../../lib/inline-tables";
import GlossaryTerm from "./GlossaryTerm";
import { RichText } from "./RichText";

type GlossaryAwareRichTextProps = {
  segments: RichSegment[];
  enableGlossary?: boolean;
};

function isGlossaryEligibleSegment(seg: RichSegment): boolean {
  return Boolean(seg.text) && !seg.href && !textContainsTables(seg.text);
}

/** Link glossary terms across Word run boundaries (italic splits). */
function GlossaryLinkedRichBlock({ segments }: { segments: RichSegment[] }) {
  const plain = segments.map((s) => s.text).join("");
  const parts = linkGlossaryInPlainText(plain, glossaryIndex.matchPhrases);
  let cursor = 0;

  return (
    <>
      {parts.map((part, i) => {
        const start = cursor;
        const end = cursor + part.text.length;
        cursor = end;

        if (part.type === "text") {
          const sliced = sliceRichSegmentsByPlainRange(segments, start, end);
          return sliced.length > 0 ? (
            <RichText key={`t-${i}-${start}`} segments={sliced} />
          ) : null;
        }

        return (
          <GlossaryTerm
            key={`g-${i}-${part.slug}-${start}`}
            matchedText={part.text}
            slug={part.slug}
            term={part.term}
            definition={part.definition}
          />
        );
      })}
    </>
  );
}

export default function GlossaryAwareRichText({
  segments,
  enableGlossary = true,
}: GlossaryAwareRichTextProps) {
  if (!enableGlossary) {
    return <RichText segments={segments} />;
  }

  const blocks: { kind: "glossary" | "other"; segments: RichSegment[] }[] = [];
  let glossaryRun: RichSegment[] = [];

  const flushGlossary = () => {
    if (glossaryRun.length > 0) {
      blocks.push({ kind: "glossary", segments: glossaryRun });
      glossaryRun = [];
    }
  };

  for (const seg of segments) {
    if (isGlossaryEligibleSegment(seg)) {
      glossaryRun.push(seg);
    } else {
      flushGlossary();
      blocks.push({ kind: "other", segments: [seg] });
    }
  }
  flushGlossary();

  return (
    <>
      {blocks.map((block, index) =>
        block.kind === "glossary" ? (
          <Fragment key={`glossary-${index}`}>
            <GlossaryLinkedRichBlock segments={block.segments} />
          </Fragment>
        ) : (
          <RichText key={`other-${index}`} segments={block.segments} />
        )
      )}
    </>
  );
}
