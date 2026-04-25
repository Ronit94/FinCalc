import type { TaxBreakdown } from "../types";

const CANADA_BANDS = [
  { cap: 57375, rate: 0.15, label: "15% bracket" },
  { cap: 114750, rate: 0.205, label: "20.5% bracket" },
  { cap: 177882, rate: 0.26, label: "26% bracket" },
  { cap: 253414, rate: 0.29, label: "29% bracket" },
  { cap: Number.POSITIVE_INFINITY, rate: 0.33, label: "33% bracket" },
];

export function calculateCanadaTax(annualIncome: number): TaxBreakdown {
  const taxableIncome = Math.max(annualIncome - 15705, 0);
  let previousCap = 0;
  let totalTax = 0;

  const bands = CANADA_BANDS.map((band) => {
    const taxableAmount = Math.max(Math.min(taxableIncome, band.cap) - previousCap, 0);
    previousCap = band.cap;
    const tax = taxableAmount * band.rate;
    totalTax += tax;
    return { label: band.label, taxableAmount, tax };
  }).filter((entry) => entry.taxableAmount > 0);

  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    bands,
  };
}