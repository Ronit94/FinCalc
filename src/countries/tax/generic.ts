import type { TaxBreakdown } from "../types";

export function calculateZeroTax(annualIncome: number): TaxBreakdown {
  return {
    totalTax: 0,
    effectiveRate: 0,
    bands: [{ label: "No configured national income tax", taxableAmount: annualIncome, tax: 0 }],
  };
}