import type { TaxBreakdown } from "../types";

const UK_BANDS = [
  { cap: 12570, rate: 0, label: "Personal allowance" },
  { cap: 50270, rate: 0.2, label: "Basic rate" },
  { cap: 125140, rate: 0.4, label: "Higher rate" },
  { cap: Number.POSITIVE_INFINITY, rate: 0.45, label: "Additional rate" },
];

export function calculateUkTax(annualIncome: number): TaxBreakdown {
  let previousCap = 0;
  let totalTax = 0;

  const bands = UK_BANDS.map((band) => {
    const taxableAmount = Math.max(Math.min(annualIncome, band.cap) - previousCap, 0);
    previousCap = band.cap;
    const tax = taxableAmount * band.rate;
    totalTax += tax;
    return { label: `${band.label} (${Math.round(band.rate * 100)}%)`, taxableAmount, tax };
  }).filter((entry) => entry.taxableAmount > 0 || entry.tax > 0);

  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    bands,
  };
}