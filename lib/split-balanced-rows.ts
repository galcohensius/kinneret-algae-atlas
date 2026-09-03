/**
 * Split items into consecutive rows of similar total label length (home phylum
 * strip, visual-index legend). Every row keeps at least two items so no row ends
 * up with a lone orphan; when that is impossible, everything stays on one row.
 */
export function splitIntoBalancedRows<T>(
  items: T[],
  labelLength: (item: T) => number,
  rowCount = 2
): T[][] {
  const minPerRow = Math.max(2, Math.floor(items.length / (rowCount + 1)));
  if (rowCount < 2 || items.length < rowCount * minPerRow) {
    return [items];
  }

  const lengths = items.map(labelLength);
  const rowTotal = (start: number, end: number) =>
    lengths.slice(start, end).reduce((sum, n) => sum + n, 0);

  let bestBounds: number[] = [];
  let bestSpread = Number.POSITIVE_INFINITY;
  // Candidates are enumerated in ascending order, so ties keep the earliest split.
  for (const bounds of rowBounds(items.length, rowCount, minPerRow)) {
    const totals = bounds.slice(1).map((end, i) => rowTotal(bounds[i], end));
    const spread = Math.max(...totals) - Math.min(...totals);
    if (spread < bestSpread) {
      bestSpread = spread;
      bestBounds = bounds;
    }
  }
  return bestBounds.slice(1).map((end, i) => items.slice(bestBounds[i], end));
}

/** All `[0, cut1, ..., n]` boundaries carving `n` items into `rows` consecutive rows. */
function rowBounds(n: number, rows: number, minPerRow: number, prefix = [0]): number[][] {
  const start = prefix[prefix.length - 1];
  if (rows === 1) {
    return [[...prefix, n]];
  }
  const out: number[][] = [];
  for (let cut = start + minPerRow; cut <= n - (rows - 1) * minPerRow; cut += 1) {
    out.push(...rowBounds(n, rows - 1, minPerRow, [...prefix, cut]));
  }
  return out;
}
