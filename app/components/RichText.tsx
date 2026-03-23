import { Fragment } from "react";

export type RichSegment = {
  text: string;
  italic: boolean;
  bold: boolean;
};

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

        return <span key={index}>{content}</span>;
      })}
    </>
  );
}

