"use client";

import { useEffect, useState } from "react";
import { ATLAS_CITE_URL, formatRecordUpdatedLong } from "../../lib/cite-this-record";

type CiteThisRecordBlockProps = {
  recordUpdatedIso: string | null;
};

export default function CiteThisRecordBlock({ recordUpdatedIso }: CiteThisRecordBlockProps) {
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

  const iso =
    recordUpdatedIso && /^\d{4}-\d{2}-\d{2}$/.test(recordUpdatedIso.trim())
      ? recordUpdatedIso.trim()
      : new Date().toISOString().slice(0, 10);
  const lastUpdatedLong = formatRecordUpdatedLong(iso);

  return (
    <section className="cite-this-record" aria-label="How to cite this record">
      <p className="cite-this-record-text muted">
        <strong>Cite this record as:</strong>{" "}
        Tamar Zohary, Alla Alster. {lastUpdatedLong}. Electronic publication.
        Israel Oceanographic &amp; Limnological Research.{" "}
        <a href={ATLAS_CITE_URL}>{ATLAS_CITE_URL}</a>
        <span suppressHydrationWarning>
          {searchedOn == null ? " Searched on —." : ` Searched on ${searchedOn}.`}
        </span>
      </p>
    </section>
  );
}
