"use client";

import { Fragment } from "react";
import { linkGlossaryInPlainText } from "../../lib/glossary-link";
import { glossaryIndex } from "../../lib/glossary-client";
import GlossaryTerm from "./GlossaryTerm";
import { useClaimFirstGlossaryOccurrence } from "./GlossaryLinkScopeProvider";

type GlossaryAwareTextProps = {
  text: string;
  /** When false, render plain text only (e.g. further reading citations). */
  enableGlossary?: boolean;
};

export default function GlossaryAwareText({
  text,
  enableGlossary = true,
}: GlossaryAwareTextProps) {
  const claimFirstOccurrence = useClaimFirstGlossaryOccurrence();

  if (!enableGlossary || !text) {
    return <>{text}</>;
  }

  const parts = linkGlossaryInPlainText(text, glossaryIndex.matchPhrases);

  return (
    <>
      {parts.map((part, i) =>
        part.type === "text" ? (
          <Fragment key={i}>{part.text}</Fragment>
        ) : !claimFirstOccurrence(part.slug) ? (
          <Fragment key={`${i}-${part.slug}-plain`}>{part.text}</Fragment>
        ) : (
          <GlossaryTerm
            key={`${i}-${part.slug}-${part.text}`}
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
