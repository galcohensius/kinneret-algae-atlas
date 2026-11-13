"use client";

import { useEffect, useState } from "react";
import { buildRecordCitation } from "../../lib/cite-this-record";

type CiteThisRecordBlockProps = {
  recordUpdatedIso: string | null;
  authors?: readonly string[];
  label?: string;
};

export default function CiteThisRecordBlock({
  recordUpdatedIso,
  authors,
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

  const recordCitation = buildRecordCitation(recordUpdatedIso, authors);

  return (
    <section className="cite-this-record" aria-label={label}>
      <p className="cite-this-record-text muted">
        <strong>{label}</strong> {recordCitation}
        <span suppressHydrationWarning>
          {searchedOn == null ? " Searched on —." : ` Searched on ${searchedOn}.`}
        </span>
      </p>
    </section>
  );
}
