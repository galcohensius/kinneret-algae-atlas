"use client";

import { Fragment } from "react";
import type { RichSegment } from "../../lib/algae-types";
import { linkGlossaryInPlainText } from "../../lib/glossary-link";
import { glossaryIndex } from "../../lib/glossary-client";
import { textContainsTables } from "../../lib/inline-tables";
import GlossaryTerm from "./GlossaryTerm";
import { RichText } from "./RichText";

type GlossaryAwareRichTextProps = {
  segments: RichSegment[];
  enableGlossary?: boolean;
};

function StyledLiteral({
  text,
  italic,
  bold,
}: {
  text: string;
  italic: boolean;
  bold: boolean;
}) {
  if (bold && italic) return <em><strong>{text}</strong></em>;
  if (italic) return <em>{text}</em>;
  if (bold) return <strong>{text}</strong>;
  return <>{text}</>;
}

function GlossaryLinkedRun({
  text,
  italic,
  bold,
}: {
  text: string;
  italic: boolean;
  bold: boolean;
}) {
  const parts = linkGlossaryInPlainText(text, glossaryIndex.matchPhrases);
  return (
    <>
      {parts.map((part, i) =>
        part.type === "text" ? (
          <StyledLiteral key={i} text={part.text} italic={italic} bold={bold} />
        ) : (
          <GlossaryTerm
            key={`${i}-${part.slug}`}
            matchedText={part.text}
            slug={part.slug}
            term={part.term}
            definition={part.definition}
          />
        )
      )}
    </>
  );
}

export default function GlossaryAwareRichText({
  segments,
  enableGlossary = true,
}: GlossaryAwareRichTextProps) {
  return (
    <>
      {segments.map((seg, index) => {
        if (!seg.text) return null;

        const useGlossary = enableGlossary && !seg.href;

        if (seg.href) {
          const content = <StyledLiteral text={seg.text} italic={seg.italic} bold={seg.bold} />;
          return (
            <a
              key={index}
              className="rich-inline-link"
              href={seg.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </a>
          );
        }

        if (textContainsTables(seg.text)) {
          return <RichText key={index} segments={[seg]} />;
        }

        return (
          <span key={index}>
            {useGlossary ? (
              <GlossaryLinkedRun text={seg.text} italic={seg.italic} bold={seg.bold} />
            ) : (
              <StyledLiteral text={seg.text} italic={seg.italic} bold={seg.bold} />
            )}
          </span>
        );
      })}
    </>
  );
}
