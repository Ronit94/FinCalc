import type { TaxBreakdown, TaxRegime } from "../types";

const INDIA_OLD_BANDS = [
  { cap: 250000, rate: 0, label: "Up to 2.5L" },
  { cap: 500000, rate: 0.05, label: "2.5L-5L" },
  { cap: 1000000, rate: 0.2, label: "5L-10L" },
  { cap: Number.POSITIVE_INFINITY, rate: 0.3, label: "Above 10L" },
];

const INDIA_NEW_BANDS = [
  { cap: 300000, rate: 0, label: "Up to 3L" },
  { cap: 700000, rate: 0.05, label: "3L-7L" },
  { cap: 1000000, rate: 0.1, label: "7L-10L" },
  { cap: 1200000, rate: 0.15, label: "10L-12L" },
  { cap: 1500000, rate: 0.2, label: "12L-15L" },
  { cap: Number.POSITIVE_INFINITY, rate: 0.3, label: "Above 15L" },
];

function calculateByBands(annualIncome: number, standardDeduction: number, bandsInput: typeof INDIA_NEW_BANDS): TaxBreakdown {
  const taxableIncome = Math.max(annualIncome - standardDeduction, 0);
  let previousCap = 0;
  let totalTax = 0;

  const bands = bandsInput
    .map((band) => {
      const taxableAmount = Math.max(Math.min(taxableIncome, band.cap) - previousCap, 0);
      previousCap = band.cap;
      const tax = taxableAmount * band.rate;
      totalTax += tax;
      return { label: `${band.label} (${Math.round(band.rate * 100)}%)`, taxableAmount, tax };
    })
    .filter((entry) => entry.taxableAmount > 0);

  const cess = totalTax * 0.04;
  totalTax += cess;
  bands.push({ label: "Health & education cess (4%)", taxableAmount: taxableIncome, tax: cess });

  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    bands,
  };
}

export function calculateIndiaTax(annualIncome: number, regime: TaxRegime): TaxBreakdown {
  if (regime === "old") {
    return calculateByBands(annualIncome, 50000, INDIA_OLD_BANDS);
  }

  return calculateByBands(annualIncome, 75000, INDIA_NEW_BANDS);
}