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