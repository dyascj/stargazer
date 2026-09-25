/** Grouped en-US number with exactly `digits` decimals: 27,600 or 5.20. */
export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}
