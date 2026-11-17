"use client";

import { useEffect, useState } from "react";
import { buildCitationParts, type CitedRecord } from "../../lib/cite-this-record";
import TaxonItalicName from "./TaxonItalicName";

type CiteThisRecordBlockProps = {
  recordUpdatedIso: string | null;
  authors?: readonly string[];
  /** Omit to cite the atlas as a whole. */
  record?: CitedRecord;
  label?: string;
};

export default function CiteThisRecordBlock({
  recordUpdatedIso,
  authors,
  record,
  label = "Cite this record as:",
}: CiteThisRecordBlockProps) {
  const [searchedOn, setSearchedOn] = useState<string | null>(null);

  useEffect(() => {
    setSearchedOn(
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  const { lead, taxon, tail } = buildCitationParts(recordUpdatedIso, authors, record);

  return (
    <section className="cite-this-record" aria-label={label}>
      <p className="cite-this-record-text muted">
        <strong>{label}</strong> {lead}
        {taxon ? <TaxonItalicName taxon={taxon} /> : null}
        {tail}
        <span suppressHydrationWarning>
          {searchedOn == null ? " Searched on —." : ` Searched on ${searchedOn}.`}
        </span>
      </p>
    </section>
  );
}
