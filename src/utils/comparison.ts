import { calculateEmiOutput } from "./calculations";

interface CompareTenureInput {
  principal: number;
  rate: number;
  tenure: number;
}

export function compareTenure({
  principal,
  rate,
  tenure,
}: CompareTenureInput): { saveIfShorter: number; extraIfLonger: number } {
  const baseline = calculateEmiOutput(principal, rate, tenure);
  const shorterTenure = Math.max(tenure - 5, 1);
  const longerTenure = tenure + 5;

  const shorter = calculateEmiOutput(principal, rate, shorterTenure);
  const longer = calculateEmiOutput(principal, rate, longerTenure);

  return {
    saveIfShorter: Math.max(baseline.totalInterest - shorter.totalInterest, 0),
    extraIfLonger: Math.max(longer.totalInterest - baseline.totalInterest, 0),
  };
}
