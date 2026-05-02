/**
 * Detects and parses pipe-delimited, newline-separated table data embedded
 * inside plain text (as produced by the Word-to-JSON extraction pipeline).
 *
 * A "table row" is any line that contains at least one " | " (pipe surrounded
 * by spaces) and is non-empty after trimming.  Consecutive table rows form one
 * table block; the first row is treated as the header.
 */

export type TextBlock = {
  type: "text";
  text: string;
};

export type TableBlock = {
  type: "table";
  /** First entry is the header row, the rest are data rows. */
  rows: string[][];
};

export type ContentBlock = TextBlock | TableBlock;

/** Returns true if the line looks like a table row (contains a " | " divider). */
function isTableRow(line: string): boolean {
  return line.includes(" | ") && line.trim().length > 0;
}

/**
 * Splits `text` into alternating TextBlocks and TableBlocks.
 * Adjacent table rows are grouped into a single TableBlock.
 * TextBlocks preserve their original newlines.
 */
export function parseTextWithTables(text: string): ContentBlock[] {
  const lines = text.split("\n");
  const blocks: ContentBlock[] = [];
  let textLines: string[] = [];
  let tableRows: string[][] = [];

  const flushText = () => {
    if (textLines.length > 0) {
      blocks.push({ type: "text", text: textLines.join("\n") });
      textLines = [];
    }
  };
  const flushTable = () => {
    if (tableRows.length > 0) {
      blocks.push({ type: "table", rows: tableRows });
      tableRows = [];
    }
  };

  for (const line of lines) {
    if (isTableRow(line)) {
      flushText();
      tableRows.push(line.split("|").map((c) => c.trim()));
    } else {
      flushTable();
      textLines.push(line);
    }
  }

  flushTable();
  flushText();

  return blocks;
}

/** Returns true if the given text contains any embedded table rows. */
export function textContainsTables(text: string): boolean {
  return text.split("\n").some(isTableRow);
}
