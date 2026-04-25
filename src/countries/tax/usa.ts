import type { TaxBreakdown } from "../types";

const USA_BANDS = [
  { cap: 11600, rate: 0.1, label: "10% bracket" },
  { cap: 47150, rate: 0.12, label: "12% bracket" },
  { cap: 100525, rate: 0.22, label: "22% bracket" },
  { cap: 191950, rate: 0.24, label: "24% bracket" },
  { cap: 243725, rate: 0.32, label: "32% bracket" },
  { cap: 609350, rate: 0.35, label: "35% bracket" },
  { cap: Number.POSITIVE_INFINITY, rate: 0.37, label: "37% bracket" },
];

export function calculateUsaTax(annualIncome: number): TaxBreakdown {
  const taxableIncome = Math.max(annualIncome - 14600, 0);
  let previousCap = 0;
  let totalTax = 0;

  const bands = USA_BANDS.map((band) => {
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