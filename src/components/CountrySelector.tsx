import { toFlagEmoji } from "../utils/format";
import type { CountryConfig } from "../countries/types";

interface CountrySelectorProps {
  countries: CountryConfig[];
  selectedCountryCode: string;
  onCountryChange: (countryCode: string) => void;
}

export function CountrySelector({ countries, selectedCountryCode, onCountryChange }: CountrySelectorProps) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-slate-100">
      <span>Country</span>
      <select
        className="bg-transparent text-slate-100 outline-none"
        value={selectedCountryCode}
        onChange={(event) => onCountryChange(event.target.value)}
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code} className="bg-slate-900">
            {toFlagEmoji(country.flag)} {country.name} ({country.currency})
          </option>
        ))}
      </select>
    </label>
  );
}