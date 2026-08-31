import Link from "next/link";
import { publicAssetPath } from "../../lib/public-path";
import { STUDY_AREA } from "../../lib/study-area";

type StudyAreaMapFigureProps = {
  className?: string;
};

export default function StudyAreaMapFigure({ className }: StudyAreaMapFigureProps) {
  const figureClass = className
    ? `study-area-map-figure ${className}`
    : "study-area-map-figure";

  return (
    <figure className={figureClass}>
      <img
        src={publicAssetPath(STUDY_AREA.mapImage)}
        alt={STUDY_AREA.mapImageAlt}
        width={800}
        height={1204}
        loading="lazy"
        decoding="async"
        className="study-area-map-image"
      />
      <figcaption className="muted study-area-map-caption">
        {STUDY_AREA.mapAttribution}{" "}
        <Link href={STUDY_AREA.mapSourceUrl} target="_blank" rel="noopener noreferrer">
          Source image
        </Link>
        .
      </figcaption>
    </figure>
  );
}
