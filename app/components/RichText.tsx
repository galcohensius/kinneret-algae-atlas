import { Fragment } from "react";
import type { RichSegment } from "../../lib/algae-types";

export type { RichSegment };

export function RichText({ segments }: { segments: RichSegment[] }) {
  return (
    <>
      {segments.map((seg, index) => {
        if (!seg.text) return null;
        const content = seg.bold && seg.italic ? (
          <em>
            <strong>{seg.text}</strong>
          </em>
        ) : seg.italic ? (
          <em>{seg.text}</em>
        ) : seg.bold ? (
          <strong>{seg.text}</strong>
        ) : (
          <Fragment>{seg.text}</Fragment>
        );

        const body = seg.href ? (
          <a
            className="rich-inline-link"
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        ) : (
          content
        );

        return <span key={index}>{body}</span>;
      })}
    </>
  );
}

