/**
 * Split phylum labels into two balanced rows (same strategy as the home algae index).
 * Avoids a lone item on the second row when there are enough entries to spread evenly.
 */
export function splitIntoBalancedRows<T>(
  items: T[],
  labelLength: (item: T) => number
): T[][] {
  if (items.length <= 1) {
    return [items];
  }

  // Three items fit better on one row than 2 + 1.
  if (items.length === 3) {
    return [items];
  }

  let bestSplit = Math.ceil(items.length / 2);
  let bestDiff = Number.POSITIVE_INFINITY;
  const minSplit = Math.max(2, Math.floor(items.length / 3));
  const maxSplit = Math.min(items.length - 2, Math.ceil((2 * items.length) / 3));

  if (minSplit > maxSplit) {
    return [items];
  }

  for (let split = minSplit; split <= maxSplit; split += 1) {
    const left = items.slice(0, split).reduce((sum, item) => sum + labelLength(item), 0);
    const right = items.slice(split).reduce((sum, item) => sum + labelLength(item), 0);
    const diff = Math.abs(left - right);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = split;
    }
  }

  return [items.slice(0, bestSplit), items.slice(bestSplit)];
}
