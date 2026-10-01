const WEEKS_PER_YEAR = 52;

/** The yearly price spread across the weeks it covers. */
export const weeklyEquivalent = (annualAmount: number): number =>
  annualAmount / WEEKS_PER_YEAR;

/**
 * How much yearly saves against a year of the regular weekly price, rounded
 * down so the badge never overstates it. Null when there is no saving.
 */
export const annualSavingsPercent = (
  annualAmount: number,
  weeklyAmount: number
): number | null => {
  if (!(annualAmount > 0) || !(weeklyAmount > 0)) return null;
  const percent = Math.floor(
    (1 - annualAmount / (weeklyAmount * WEEKS_PER_YEAR)) * 100
  );
  return percent > 0 ? percent : null;
};

/** Store currency formatting in the person's locale; null if it cannot. */
export const formatStorePrice = (
  amount: number,
  currencyCode: string,
  locale: string
): string | null => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return null;
  }
};

/**
 * Formats `amount` exactly the way the store formatted `template` (symbol,
 * position, grouping and decimal marks), so a derived price such as the
 * yearly plan's weekly cost reads like the store's own prices beside it.
 */
export const formatLikeStorePrice = (
  template: string,
  amount: number
): string | null => {
  const match = template.match(/\d(?:[\d.,\s  ']*\d)?/);
  if (!match || !Number.isFinite(amount)) return null;
  const numberPart = match[0];
  const decimalMatch = numberPart.match(/([.,])(\d{1,3})$/);
  // Three trailing digits after a mark are grouping ("1.590"), not decimals.
  const hasDecimals = Boolean(decimalMatch && decimalMatch[2].length < 3);
  const decimalMark = hasDecimals ? decimalMatch![1] : null;
  const fractionDigits = hasDecimals ? decimalMatch![2].length : 0;
  const integerPart = hasDecimals
    ? numberPart.slice(0, -decimalMatch![0].length)
    : numberPart;
  const groupMark = integerPart.match(/[.,\s  ']/)?.[0] ?? null;

  const [whole, fraction] = amount.toFixed(fractionDigits).split('.');
  const grouped = groupMark
    ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, groupMark)
    : whole;
  const formatted =
    decimalMark && fraction ? `${grouped}${decimalMark}${fraction}` : grouped;
  return template.replace(numberPart, formatted);
};
