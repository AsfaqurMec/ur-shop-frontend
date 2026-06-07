/** Line summaries shown in cart/checkout. */
export function storefrontSelectionsSummary(
  rows: Array<{ label: string; value: string }> | undefined | null
): Array<{ label: string; value: string }> {
  if (!rows?.length) return [];
  return rows;
}
