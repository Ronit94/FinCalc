import { getEMIInsights, getSIPInsights, type CalculatorInsight } from "./insights";

export function calculateMonthlyEmi(principal: number, annualRate: number, tenureYears: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = tenureYears * 12;

  if (months <= 0 || principal <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return principal / months;
  }

  const factor = (1 + monthlyRate) ** months;
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function calculateTotalInterest(principal: number, monthlyPayment: number, tenureYears: number): number {
  const months = Math.max(tenureYears * 12, 0);
  return Math.max(monthlyPayment * months - principal, 0);
}

export interface EmiCalculatorOutput extends CalculatorInsight {
  result: number;
  totalInterest: number;
}

export function calculateEmiOutput(
  principal: number,
  annualRate: number,
  tenureYears: number,
): EmiCalculatorOutput {
  const result = calculateMonthlyEmi(principal, annualRate, tenureYears);
  const totalInterest = calculateTotalInterest(principal, result, tenureYears);

  return {
    result,
    totalInterest,
    ...getEMIInsights({ principal, totalInterest, tenure: tenureYears }),
  };
}

export function calculateSimpleInterest(principal: number, annualRate: number, years: number): number {
  return (principal * annualRate * years) / 100;
}

export function calculateCompoundAmount(principal: number, annualRate: number, years: number, compoundsPerYear: number): number {
  if (compoundsPerYear <= 0) {
    return principal;
  }
  return principal * (1 + annualRate / 100 / compoundsPerYear) ** (compoundsPerYear * years);
}

export function calculateRecurringInvestmentFutureValue(monthlyContribution: number, annualRate: number, years: number): number {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (months <= 0) {
    return 0;
  }
  if (monthlyRate === 0) {
    return monthlyContribution * months;
  }
  return monthlyContribution * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
}

export interface SIPCalculatorOutput extends CalculatorInsight {
  result: number;
  invested: number;
  gains: number;
}

export function calculateRecurringInvestmentOutput(
  monthlyContribution: number,
  annualRate: number,
  years: number,
  inflation: number,
): SIPCalculatorOutput {
  const result = calculateRecurringInvestmentFutureValue(monthlyContribution, annualRate, years);
  const invested = Math.max(monthlyContribution, 0) * Math.max(years * 12, 0);
  const gains = Math.max(result - invested, 0);

  return {
    result,
    invested,
    gains,
    ...getSIPInsights({ invested, returns: annualRate, inflation }),
  };
}

export function calculateTermDepositMaturity(principal: number, annualRate: number, years: number, compoundsPerYear: number): number {
  return calculateCompoundAmount(principal, annualRate, years, compoundsPerYear);
}

export function calculateConsumptionTax(netAmount: number, rate: number): number {
  return (netAmount * rate) / 100;
}

export function calculateIndiaGratuity(lastDrawnMonthlyBasic: number, yearsWorked: number): number {
  return (lastDrawnMonthlyBasic * 15 * yearsWorked) / 26;
}

export function calculateUaeGratuity(lastDrawnMonthlyBasic: number, yearsWorked: number): number {
  const dailyWage = lastDrawnMonthlyBasic / 30;
  if (yearsWorked <= 5) {
    return dailyWage * 21 * yearsWorked;
  }
  return dailyWage * (21 * 5 + 30 * (yearsWorked - 5));
}

export function calculateRetirementContribution(annualIncome: number, employeeRate: number, employerRate: number): {
  employeeContribution: number;
  employerContribution: number;
  annualTotal: number;
} {
  const employeeContribution = (annualIncome * employeeRate) / 100;
  const employerContribution = (annualIncome * employerRate) / 100;
  return {
    employeeContribution,
    employerContribution,
    annualTotal: employeeContribution + employerContribution,
  };
}
