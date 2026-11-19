import Link from "next/link";
import type { RichSegment } from "../../lib/algae-types";
import { RichText } from "./RichText";
import {
  formatStudyAreaCoordinatesDecimal,
  formatStudyAreaFooterLine,
  studyAreaGoogleMapsUrl,
  studyAreaOpenStreetMapUrl,
} from "../../lib/study-area";

type StudyAreaBlockProps =
  | { variant: "footer" }
  /** paragraphs: the About Word file's Study area text. */
  | { variant: "full"; paragraphs: RichSegment[][] };

export default function StudyAreaBlock(props: StudyAreaBlockProps) {
  const { variant } = props;
  if (variant === "footer") {
    return (
      <footer className="study-area-footer" aria-label="Study area">
        <p className="study-area-footer-line muted">
          {formatStudyAreaFooterLine()}
          {" · "}
          <Link href="/about/#study-area-heading">Coordinates and maps</Link>
        </p>
      </footer>
    );
  }

  return (
    <section className="study-area-full" aria-labelledby="study-area-heading">
      <h2 id="study-area-heading" className="section-heading">
        Study area
      </h2>
      <div className="study-area-details algae-prose">
        {props.paragraphs.map((para, i) => (
          <p key={`study-area-${i}`}>
            <RichText segments={para} />
          </p>
        ))}
        <p>
          Coordinates: <strong>{formatStudyAreaCoordinatesDecimal()}</strong>
        </p>
        <p className="study-area-map-links">
          <Link href={studyAreaOpenStreetMapUrl()} target="_blank" rel="noopener noreferrer">
            Open in OpenStreetMap
          </Link>
          {" · "}
          <Link href={studyAreaGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
            Open in Google Maps
          </Link>
        </p>
      </div>
    </section>
  );
}
