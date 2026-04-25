import { calculateCanadaTax } from "./canada";
import { calculateZeroTax } from "./generic";
import { calculateIndiaTax } from "./india";
import { calculateUkTax } from "./uk";
import { calculateUsaTax } from "./usa";
import type { TaxBreakdown, TaxRegime } from "../types";

export function calculateTaxByCountry(countryCode: string, annualIncome: number, regime: TaxRegime): TaxBreakdown {
  switch (countryCode) {
    case "US":
      return calculateUsaTax(annualIncome);
    case "IN":
      return calculateIndiaTax(annualIncome, regime);
    case "GB":
      return calculateUkTax(annualIncome);
    case "CA":
      return calculateCanadaTax(annualIncome);
    default:
      return calculateZeroTax(annualIncome);
  }
}