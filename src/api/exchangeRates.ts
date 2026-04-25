export interface ExchangeRateResponse {
  base: string;
  rates: Record<string, number>;
  date: string;
}

export async function fetchExchangeRates(baseCurrency: string, targetCurrencies: string[]): Promise<ExchangeRateResponse> {
  const uniqueTargets = [...new Set(targetCurrencies.filter((currency) => currency !== baseCurrency))];

  if (uniqueTargets.length === 0) {
    return { base: baseCurrency, rates: { [baseCurrency]: 1 }, date: new Date().toISOString() };
  }

  const endpoint = `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${uniqueTargets.join(",")}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Unable to fetch live exchange rates");
  }

  const data = (await response.json()) as ExchangeRateResponse;
  return {
    ...data,
    rates: {
      ...data.rates,
      [baseCurrency]: 1,
    },
  };
}