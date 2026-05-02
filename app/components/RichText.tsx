import { Fragment } from "react";
import type { RichSegment } from "../../lib/algae-types";
import { parseTextWithTables, textContainsTables } from "../../lib/inline-tables";

export type { RichSegment };

function InlineTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null;
  const [headerRow, ...dataRows] = rows;
  return (
    <table className="inline-data-table">
      <thead>
        <tr>
          {headerRow.map((cell, i) => (
            <th key={i}>{cell}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataRows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderSegmentContent(text: string, italic: boolean, bold: boolean) {
  if (bold && italic) return <em><strong>{text}</strong></em>;
  if (italic) return <em>{text}</em>;
  if (bold) return <strong>{text}</strong>;
  return <Fragment>{text}</Fragment>;
}

/** Renders a plain-text string, converting any embedded pipe tables to HTML. */
export function PlainTextWithTables({ text }: { text: string }) {
  if (!textContainsTables(text)) {
    return <>{text}</>;
  }
  const blocks = parseTextWithTables(text);
  return (
    <>
      {blocks.map((block, i) =>
        block.type === "table" ? (
          <InlineTable key={i} rows={block.rows} />
        ) : (
          <span key={i}>{block.text}</span>
        )
      )}
    </>
  );
}

export function RichText({ segments }: { segments: RichSegment[] }) {
  return (
    <>
      {segments.map((seg, index) => {
        if (!seg.text) return null;

        if (textContainsTables(seg.text)) {
          const blocks = parseTextWithTables(seg.text);
          return (
            <Fragment key={index}>
              {blocks.map((block, bi) => {
                if (block.type === "table") {
                  return <InlineTable key={bi} rows={block.rows} />;
                }
                const content = renderSegmentContent(block.text, seg.italic, seg.bold);
                const body = seg.href ? (
                  <a className="rich-inline-link" href={seg.href} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : content;
                return <span key={bi}>{body}</span>;
              })}
            </Fragment>
          );
        }

        const content = renderSegmentContent(seg.text, seg.italic, seg.bold);
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

