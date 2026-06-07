/** Bangladeshi Taka (৳) — Unicode U+09F3 */
export const BDT_SYMBOL = '\u09F3';

function formatBDTNumber(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Full BDT string for tables, receipts, and plain text (e.g. `৳3,500.00`).
 * Other currencies use `Intl` currency formatting.
 */
export function formatCurrency(amount: number, currency = 'BDT'): string {
  if (currency === 'BDT') {
    return `${BDT_SYMBOL}${formatBDTNumber(amount)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Splits currency into symbol + numeric amount for richer UI (different weights, colors, `tabular-nums` on digits only).
 */
export function splitCurrencyDisplay(
  amount: number,
  currency = 'BDT'
): { symbol: string; amount: string } {
  if (currency === 'BDT') {
    return { symbol: BDT_SYMBOL, amount: formatBDTNumber(amount) };
  }
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).formatToParts(amount);
  let symbol = '';
  let amountStr = '';
  for (const p of parts) {
    if (p.type === 'currency') symbol += p.value;
    else amountStr += p.value;
  }
  return { symbol: symbol.trim(), amount: amountStr.trim() };
}
