export interface CalculatorInsight {
  insight: string;
  tip: string;
  warning?: string;
}

interface EMIInsightInput {
  principal: number;
  totalInterest: number;
  tenure: number;
}

interface SIPInsightInput {
  invested: number;
  returns: number;
  inflation: number;
}

export function getEMIInsights({
  principal,
  totalInterest,
  tenure,
}: EMIInsightInput): CalculatorInsight {
  if (principal <= 0 || tenure <= 0) {
    return {
      insight: "Add a loan amount and tenure to see repayment guidance.",
      tip: "A shorter tenure usually reduces the overall interest burden.",
    };
  }

  const interestRatio = principal > 0 ? totalInterest / principal : 0;
  const insight = interestRatio >= 0.5
    ? "This loan spends a meaningful share of the total repayment on interest."
    : "This tenure keeps the interest burden relatively controlled compared with the loan amount.";
  const tip = tenure >= 15
    ? "If your monthly budget allows it, trimming the tenure can lower total interest sharply."
    : "Small prepayments during the loan term can reduce the remaining interest further.";
  const warning = interestRatio > 0.7
    ? "Total interest is more than 70% of the principal."
    : undefined;

  return { insight, tip, warning };
}

export function getSIPInsights({
  invested,
  returns,
  inflation,
}: SIPInsightInput): CalculatorInsight {
  if (invested <= 0) {
    return {
      insight: "Add a monthly contribution to project future value.",
      tip: "Regular investing benefits most from consistency over long periods.",
    };
  }

  const insight = returns >= inflation + 2
    ? "Your expected return is comfortably ahead of inflation, which supports real wealth growth."
    : "Your expected return is only modestly ahead of inflation, so time and contribution size matter more.";
  const tip = invested >= 100000
    ? "Staying invested for the full term can let compounding do more of the heavy lifting."
    : "Increasing the monthly SIP gradually can have a larger long-term effect than chasing higher returns.";
  const warning = returns < inflation
    ? "Expected return is below inflation, so purchasing power may shrink in real terms."
    : undefined;

  return { insight, tip, warning };
}
