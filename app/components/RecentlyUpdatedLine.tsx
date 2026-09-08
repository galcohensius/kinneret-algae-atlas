import { Fragment } from "react";
import Link from "next/link";
import type { AlgaeCatalogRecord } from "../../lib/algae-types";
import { selectRecentlyUpdated } from "../../lib/recently-updated";
import TaxonItalicName from "./TaxonItalicName";

/** `YYYY-MM-DD` as e.g. `30 Aug 2026`, compact enough for a one-line footer note. */
function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.trim().split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Footer note naming the species in the latest update batch; a freshness marker, not navigation. */
export default function RecentlyUpdatedLine({ records }: { records: AlgaeCatalogRecord[] }) {
  const recentlyUpdated = selectRecentlyUpdated(records);
  if (recentlyUpdated.length === 0) return null;

  return (
    <p className="muted recently-updated-line" aria-label="Recently updated species">
      Last updated{" "}
      <span className="recently-updated-date">
        ({formatShortDate(recentlyUpdated[0].recordUpdated ?? "")})
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
