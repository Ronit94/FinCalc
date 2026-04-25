export async function detectUserCountryCode(): Promise<string | null> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { country_code?: string };
    return data.country_code ?? null;
  } catch {
    return null;
  }
}