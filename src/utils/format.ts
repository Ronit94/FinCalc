export function toFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join("");
}

export function formatCurrency(amount: number, currencyCode: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function convertCurrency(amount: number, rates: Record<string, number>, targetCurrency: string): number | null {
  const rate = rates[targetCurrency];
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }
  return amount * rate;
}