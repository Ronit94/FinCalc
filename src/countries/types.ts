export type TaxRegime = "default" | "old" | "new";

export interface TaxBreakdown {
  totalTax: number;
  effectiveRate: number;
  bands: Array<{ label: string; taxableAmount: number; tax: number }>;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  loanRateRange: { min: number; max: number; defaultRate: number };
  consumptionTax: {
    label: "GST" | "VAT" | "Sales Tax";
    defaultRate: number;
  };
  gratuitySupported: boolean;
  retirementPlanLabel: string;
  retirementDefaultRate: number;
  taxRegimes: TaxRegime[];
}