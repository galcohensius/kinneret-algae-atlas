import { Fragment } from "react";
import Link from "next/link";
import type { AlgaeCatalogRecord } from "../../lib/algae-types";
import { formatRecordUpdated } from "../../lib/cite-this-record";
import { selectRecentlyUpdated } from "../../lib/recently-updated";
import TaxonItalicName from "./TaxonItalicName";

/** Footer note naming the species in the latest update batch; a freshness marker, not navigation. */
export default function RecentlyUpdatedLine({ records }: { records: AlgaeCatalogRecord[] }) {
  const recentlyUpdated = selectRecentlyUpdated(records);
  if (recentlyUpdated.length === 0) return null;

  return (
    <p className="muted recently-updated-line" aria-label="Recently updated species">
      Last updated{" "}
      <span className="recently-updated-date">
        ({formatRecordUpdated(recentlyUpdated[0].recordUpdated ?? "", "short")})
      </span>
      :{" "}
      {recentlyUpdated.map((record, index) => (
        <Fragment key={record.slug}>
          {index > 0 ? <span aria-hidden> &middot; </span> : null}
          <Link href={`/algae/${record.slug}/`}>
            <TaxonItalicName taxon={record.scientificName} className="algae-taxon" />
          </Link>
        </Fragment>
      ))}
    </p>
  );
}
