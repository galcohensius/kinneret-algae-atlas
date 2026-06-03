"use client";

import { textContainsTables } from "../../lib/inline-tables";
import GlossaryAwareText from "./GlossaryAwareText";
import { PlainTextWithTables } from "./RichText";

type GlossaryAwarePlainTextProps = {
  text: string;
};

/** Glossary links in plain prose; pipe tables fall back without term linking. */
export default function GlossaryAwarePlainText({ text }: GlossaryAwarePlainTextProps) {
  if (textContainsTables(text)) {
    return <PlainTextWithTables text={text} />;
  }
  return <GlossaryAwareText text={text} />;
}
