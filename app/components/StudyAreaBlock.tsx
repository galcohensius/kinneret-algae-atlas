import Link from "next/link";
import { publicAssetPath } from "../../lib/public-path";
import {
  formatStudyAreaFooterLine,
  formatStudyAreaCoordinatesDecimal,
  formatStudyAreaCoordinatesDms,
  formatStudyAreaLakeName,
  STUDY_AREA,
  studyAreaGoogleMapsUrl,
  studyAreaOpenStreetMapUrl,
} from "../../lib/study-area";

type StudyAreaBlockProps = {
  variant: "footer" | "full";
};

export default function StudyAreaBlock({ variant }: StudyAreaBlockProps) {
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
      <div className="study-area-full-layout">
        <figure className="study-area-map-figure">
          <img
            src={publicAssetPath(STUDY_AREA.mapImage)}
            alt={STUDY_AREA.mapImageAlt}
            width={720}
            height={960}
            loading="lazy"
            decoding="async"
            className="study-area-map-image"
          />
          <figcaption className="muted study-area-map-caption">
            {STUDY_AREA.mapAttribution}{" "}
            <Link href={STUDY_AREA.mapSourceUrl} target="_blank" rel="noopener noreferrer">
              Source image
            </Link>
            . Lake center: {formatStudyAreaCoordinatesDecimal()}.
          </figcaption>
        </figure>
        <div className="study-area-details algae-prose">
          <p>
            This atlas documents microalgae from <strong>{formatStudyAreaLakeName()}</strong>, a
            freshwater lake in the <strong>{STUDY_AREA.stateProvince}</strong>,{" "}
            <strong>{STUDY_AREA.country}</strong>. The lake lies in the{" "}
            <strong>{STUDY_AREA.region}</strong>, at approximately{" "}
            <strong>{STUDY_AREA.elevationM} m</strong> elevation (below sea level).
          </p>
          <dl className="study-area-coords">
            <div>
              <dt>Decimal degrees</dt>
              <dd>
                {formatStudyAreaCoordinatesDecimal()} ({STUDY_AREA.geodeticDatum} — standard GPS
                coordinates)
              </dd>
            </div>
            <div>
              <dt>Degrees, minutes</dt>
              <dd>{formatStudyAreaCoordinatesDms()}</dd>
            </div>
            <div>
              <dt>Country code</dt>
              <dd>{STUDY_AREA.countryCode}</dd>
            </div>
          </dl>
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
      </div>
    </section>
  );
}
