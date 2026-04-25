import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fetchExchangeRates } from "./api/exchangeRates";
import { detectUserCountryCode } from "./api/geo";
import { CountrySelector } from "./components/CountrySelector";
import { InfoTooltip } from "./components/InfoTooltip";
import { NumberField } from "./components/NumberField";
import { Section } from "./components/Section";
import { COUNTRY_CONFIGS, COUNTRY_MAP } from "./countries/config";
import { calculateTaxByCountry } from "./countries/tax";
import type { TaxRegime } from "./countries/types";
import {
  calculateCompoundAmount,
  calculateConsumptionTax,
  calculateIndiaGratuity,
  calculateMonthlyEmi,
  calculateRecurringInvestmentFutureValue,
  calculateRetirementContribution,
  calculateSimpleInterest,
  calculateTermDepositMaturity,
  calculateUaeGratuity,
} from "./utils/calculations";
import { convertCurrency, formatCurrency, formatPercent, toFlagEmoji } from "./utils/format";

const PREFS_KEY = "fincalc-global-prefs-v1";

type SalaryMode = "monthly" | "annual";

export default function App() {
  const [selectedCountryCode, setSelectedCountryCode] = useState("US");
  const [taxRegime, setTaxRegime] = useState<TaxRegime>("default");
  const [salaryMode, setSalaryMode] = useState<SalaryMode>("annual");
  const [salaryInput, setSalaryInput] = useState(85000);
  const [taxableIncome, setTaxableIncome] = useState(85000);
  const [consumptionAmount, setConsumptionAmount] = useState(1200);
  const [consumptionRate, setConsumptionRate] = useState(7.5);
  const [gratuitySalary, setGratuitySalary] = useState(2800);
  const [gratuityYears, setGratuityYears] = useState(6);
  const [retirementIncome, setRetirementIncome] = useState(85000);
  const [retirementEmployeeRate, setRetirementEmployeeRate] = useState(8);
  const [retirementEmployerRate, setRetirementEmployerRate] = useState(4);
  const [loanPrincipal, setLoanPrincipal] = useState(300000);
  const [loanYears, setLoanYears] = useState(20);
  const [loanRate, setLoanRate] = useState(6.5);
  const [homeLoanPrincipal, setHomeLoanPrincipal] = useState(500000);
  const [homeLoanYears, setHomeLoanYears] = useState(25);
  const [homeLoanRate, setHomeLoanRate] = useState(6.5);
  const [carLoanPrincipal, setCarLoanPrincipal] = useState(45000);
  const [carLoanYears, setCarLoanYears] = useState(6);
  const [carLoanRate, setCarLoanRate] = useState(6.5);
  const [personalLoanPrincipal, setPersonalLoanPrincipal] = useState(15000);
  const [personalLoanYears, setPersonalLoanYears] = useState(4);
  const [personalLoanRate, setPersonalLoanRate] = useState(6.5);
  const [termDepositPrincipal, setTermDepositPrincipal] = useState(25000);
  const [termDepositRate, setTermDepositRate] = useState(5.8);
  const [termDepositYears, setTermDepositYears] = useState(5);
  const [termDepositCompounds, setTermDepositCompounds] = useState(4);
  const [recurringMonthly, setRecurringMonthly] = useState(400);
  const [recurringRate, setRecurringRate] = useState(6.2);
  const [recurringYears, setRecurringYears] = useState(8);
  const [simplePrincipal, setSimplePrincipal] = useState(10000);
  const [simpleRate, setSimpleRate] = useState(6);
  const [simpleYears, setSimpleYears] = useState(4);
  const [compoundPrincipal, setCompoundPrincipal] = useState(10000);
  const [compoundRate, setCompoundRate] = useState(7.2);
  const [compoundYears, setCompoundYears] = useState(10);
  const [compoundCompounds, setCompoundCompounds] = useState(2);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
  const [exchangeDate, setExchangeDate] = useState<string>("");
  const [exchangeError, setExchangeError] = useState<string>("");
  const [compareCountryA, setCompareCountryA] = useState("US");
  const [compareCountryB, setCompareCountryB] = useState("IN");
  const [compareIncome, setCompareIncome] = useState(90000);
  const [comparePrincipal, setComparePrincipal] = useState(300000);
  const [compareRate, setCompareRate] = useState(6.5);
  const [compareYears, setCompareYears] = useState(20);

  const selectedCountry = COUNTRY_MAP[selectedCountryCode] ?? COUNTRY_CONFIGS[0];
  const allCurrencies = useMemo(
    () => [...new Set(COUNTRY_CONFIGS.map((country) => country.currency))],
    []
  );

  useEffect(() => {
    document.title = `FinCalc Global | ${selectedCountry.name} Financial Calculators`;
    const description = `Global loan, tax, salary, investment and retirement calculators configured for ${selectedCountry.name}.`;
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.append(metaDescription);
    }
    metaDescription.setAttribute("content", description);
  }, [selectedCountry.name]);

  useEffect(() => {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { countryCode?: string; taxRegime?: TaxRegime };
        if (parsed.countryCode && COUNTRY_MAP[parsed.countryCode]) {
          setSelectedCountryCode(parsed.countryCode);
        }
        if (parsed.taxRegime) {
          setTaxRegime(parsed.taxRegime);
        }
        return;
      } catch {
        localStorage.removeItem(PREFS_KEY);
      }
    }

    void detectUserCountryCode().then((countryCode) => {
      if (countryCode && COUNTRY_MAP[countryCode]) {
        setSelectedCountryCode(countryCode);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ countryCode: selectedCountry.code, taxRegime })
    );
  }, [selectedCountry.code, taxRegime]);

  useEffect(() => {
    const firstRegime = selectedCountry.taxRegimes[0] ?? "default";
    if (!selectedCountry.taxRegimes.includes(taxRegime)) {
      setTaxRegime(firstRegime);
    }
  }, [selectedCountry, taxRegime]);

  useEffect(() => {
    const defaultRate = selectedCountry.loanRateRange.defaultRate;
    setLoanRate(defaultRate);
    setHomeLoanRate(defaultRate);
    setCarLoanRate(defaultRate + 0.4);
    setPersonalLoanRate(defaultRate + 1.2);
    setConsumptionRate(selectedCountry.consumptionTax.defaultRate);

    setRetirementEmployeeRate(selectedCountry.retirementDefaultRate);
    const employerDefault = selectedCountry.code === "IN" ? 12 : selectedCountry.code === "US" ? 4 : 3;
    setRetirementEmployerRate(employerDefault);
  }, [selectedCountry]);

  useEffect(() => {
    let cancelled = false;
    setExchangeError("");

    void fetchExchangeRates(selectedCountry.currency, allCurrencies)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setExchangeRates(response.rates);
        setExchangeDate(response.date);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setExchangeError("Live FX unavailable. Showing calculator outputs in selected currency only.");
      });

    return () => {
      cancelled = true;
    };
  }, [allCurrencies, selectedCountry.currency]);

  const salaryAnnual = salaryMode === "monthly" ? salaryInput * 12 : salaryInput;
  const taxBreakdown = calculateTaxByCountry(selectedCountry.code, taxableIncome, taxRegime);
  const netSalary = Math.max(salaryAnnual - taxBreakdown.totalTax, 0);
  const consumptionTaxAmount = calculateConsumptionTax(consumptionAmount, consumptionRate);
  const gratuityAmount = selectedCountry.code === "IN"
    ? calculateIndiaGratuity(gratuitySalary, gratuityYears)
    : selectedCountry.code === "AE"
      ? calculateUaeGratuity(gratuitySalary, gratuityYears)
      : null;

  const retirement = calculateRetirementContribution(
    retirementIncome,
    retirementEmployeeRate,
    retirementEmployerRate
  );

  const universalEmi = calculateMonthlyEmi(loanPrincipal, loanRate, loanYears);
  const homeLoanEmi = calculateMonthlyEmi(homeLoanPrincipal, homeLoanRate, homeLoanYears);
  const carLoanEmi = calculateMonthlyEmi(carLoanPrincipal, carLoanRate, carLoanYears);
  const personalLoanEmi = calculateMonthlyEmi(personalLoanPrincipal, personalLoanRate, personalLoanYears);

  const termDepositMaturity = calculateTermDepositMaturity(
    termDepositPrincipal,
    termDepositRate,
    termDepositYears,
    termDepositCompounds
  );

  const recurringFutureValue = calculateRecurringInvestmentFutureValue(
    recurringMonthly,
    recurringRate,
    recurringYears
  );

  const simpleInterest = calculateSimpleInterest(simplePrincipal, simpleRate, simpleYears);
  const compoundAmount = calculateCompoundAmount(
    compoundPrincipal,
    compoundRate,
    compoundYears,
    compoundCompounds
  );

  const compareA = COUNTRY_MAP[compareCountryA] ?? COUNTRY_CONFIGS[0];
  const compareB = COUNTRY_MAP[compareCountryB] ?? COUNTRY_CONFIGS[1];
  const compareTaxA = calculateTaxByCountry(compareA.code, compareIncome, compareA.taxRegimes[0] ?? "default");
  const compareTaxB = calculateTaxByCountry(compareB.code, compareIncome, compareB.taxRegimes[0] ?? "default");
  const compareEmiA = calculateMonthlyEmi(comparePrincipal, compareRate, compareYears);
  const compareEmiB = calculateMonthlyEmi(comparePrincipal, compareRate, compareYears);

  const fxTargets = COUNTRY_CONFIGS.filter((country) => country.currency !== selectedCountry.currency).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight">FinCalc Global</div>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
              {toFlagEmoji(selectedCountry.flag)} {selectedCountry.currency}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CountrySelector
              countries={COUNTRY_CONFIGS}
              selectedCountryCode={selectedCountry.code}
              onCountryChange={setSelectedCountryCode}
            />
            <div className="rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-200">Language: EN</div>
          </div>
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden border-b border-white/10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.25),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(79,70,229,0.3),transparent_45%)]" />
        <div className="relative mx-auto grid min-h-[58vh] w-full max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.16em] text-cyan-200">Global Financial Intelligence</p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">FinCalc Global</h1>
            <p className="max-w-xl text-slate-200">
              Unified calculators for loans, taxes, salary, investments, and benefits. Switch country and currency to update every model in real time.
            </p>
            <p className="text-sm text-slate-300">
              Active preset: {selectedCountry.name} loan range {selectedCountry.loanRateRange.min}% to {selectedCountry.loanRateRange.max}%
            </p>
          </div>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mx-auto w-full max-w-md"
          >
            <svg viewBox="0 0 440 300" className="h-auto w-full">
              <rect x="0" y="0" width="440" height="300" rx="28" fill="rgba(2,6,23,0.72)" />
              <circle cx="220" cy="150" r="82" stroke="rgba(34,211,238,0.7)" strokeWidth="2" fill="none" />
              <path d="M138 150h164M220 68v164M162 104c18 12 98 12 116 0M162 196c18-12 98-12 116 0" stroke="rgba(148,163,184,0.75)" strokeWidth="2" fill="none" />
              <path d="M70 234l56-44 42 20 64-70 44 24 84-98" stroke="rgba(34,197,94,0.85)" strokeWidth="4" fill="none" />
            </svg>
          </motion.div>
        </div>
      </motion.section>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="flex flex-wrap gap-4 py-6 text-sm text-slate-300">
          <span>
            1 {selectedCountry.currency} = {fxTargets.map((target) => `${(exchangeRates[target.currency] ?? 0).toFixed(3)} ${target.currency}`).join(" | ")}
          </span>
          <span>{exchangeDate ? `Rates date: ${exchangeDate}` : "Fetching live rates..."}</span>
          {exchangeError ? <span className="text-amber-300">{exchangeError}</span> : null}
        </div>

        <Section title="EMI & Loan Calculators" subtitle="Universal formulas with country presets and manual APR controls.">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
              <InfoTooltip label="Universal EMI" description="EMI is the fixed monthly repayment for a loan. APR includes annual interest impact." />
              <NumberField label={`Principal (${selectedCountry.currency})`} value={loanPrincipal} onChange={setLoanPrincipal} step={100} />
              <NumberField label="Annual Interest Rate (%)" value={loanRate} onChange={setLoanRate} min={0} max={40} />
              <NumberField label="Tenure (years)" value={loanYears} onChange={setLoanYears} min={1} max={40} step={1} />
              <p className="text-xl font-semibold text-cyan-200">{formatCurrency(universalEmi, selectedCountry.currency, selectedCountry.locale)} / month</p>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
              <InfoTooltip label="Home, Car, Personal" description="Country switching updates preset rates. You can always override manually." />
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-slate-300">Home Loan</p>
                  <p>{formatCurrency(homeLoanEmi, selectedCountry.currency, selectedCountry.locale)}/mo</p>
                  <NumberField label="Rate" value={homeLoanRate} onChange={setHomeLoanRate} max={40} />
                  <NumberField label="Years" value={homeLoanYears} onChange={setHomeLoanYears} step={1} max={35} />
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-slate-300">Car Loan</p>
                  <p>{formatCurrency(carLoanEmi, selectedCountry.currency, selectedCountry.locale)}/mo</p>
                  <NumberField label="Rate" value={carLoanRate} onChange={setCarLoanRate} max={40} />
                  <NumberField label="Years" value={carLoanYears} onChange={setCarLoanYears} step={1} max={10} />
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-slate-300">Personal Loan</p>
                  <p>{formatCurrency(personalLoanEmi, selectedCountry.currency, selectedCountry.locale)}/mo</p>
                  <NumberField label="Rate" value={personalLoanRate} onChange={setPersonalLoanRate} max={45} />
                  <NumberField label="Years" value={personalLoanYears} onChange={setPersonalLoanYears} step={1} max={8} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <NumberField label="Home Principal" value={homeLoanPrincipal} onChange={setHomeLoanPrincipal} step={1000} />
                <NumberField label="Car Principal" value={carLoanPrincipal} onChange={setCarLoanPrincipal} step={500} />
                <NumberField label="Personal Principal" value={personalLoanPrincipal} onChange={setPersonalLoanPrincipal} step={100} />
              </div>
            </div>
          </motion.div>
        </Section>

        <Section title="Investment Calculators" subtitle="Term Deposit, Recurring Investment, Simple Interest, and Compound Interest.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Term Deposit</h3>
              <NumberField label="Initial Deposit" value={termDepositPrincipal} onChange={setTermDepositPrincipal} step={100} />
              <NumberField label="Annual Rate (%)" value={termDepositRate} onChange={setTermDepositRate} />
              <NumberField label="Years" value={termDepositYears} onChange={setTermDepositYears} step={1} />
              <NumberField label="Compounds / Year" value={termDepositCompounds} onChange={setTermDepositCompounds} step={1} min={1} max={12} />
              <p className="text-cyan-200">Maturity: {formatCurrency(termDepositMaturity, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Recurring Investment</h3>
              <NumberField label="Monthly Contribution" value={recurringMonthly} onChange={setRecurringMonthly} step={10} />
              <NumberField label="Annual Return (%)" value={recurringRate} onChange={setRecurringRate} />
              <NumberField label="Years" value={recurringYears} onChange={setRecurringYears} step={1} />
              <p className="text-cyan-200">Future Value: {formatCurrency(recurringFutureValue, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Simple Interest</h3>
              <NumberField label="Principal" value={simplePrincipal} onChange={setSimplePrincipal} step={100} />
              <NumberField label="Rate (%)" value={simpleRate} onChange={setSimpleRate} />
              <NumberField label="Years" value={simpleYears} onChange={setSimpleYears} step={1} />
              <p className="text-cyan-200">Interest: {formatCurrency(simpleInterest, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Compound Interest</h3>
              <NumberField label="Principal" value={compoundPrincipal} onChange={setCompoundPrincipal} step={100} />
              <NumberField label="Rate (%)" value={compoundRate} onChange={setCompoundRate} />
              <NumberField label="Years" value={compoundYears} onChange={setCompoundYears} step={1} />
              <NumberField label="Compounds / Year" value={compoundCompounds} onChange={setCompoundCompounds} step={1} min={1} max={12} />
              <p className="text-cyan-200">Maturity: {formatCurrency(compoundAmount, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>
          </div>
        </Section>

        <Section title="Income, Tax & Benefits" subtitle="Country-aware tax rules, consumption tax mode, gratuity, and retirement contributions.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Salary Calculator</h3>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setSalaryMode("annual")}
                  className={`rounded-lg px-3 py-1 ${salaryMode === "annual" ? "bg-cyan-500/20 text-cyan-200" : "bg-white/5"}`}
                >
                  Annual
                </button>
                <button
                  type="button"
                  onClick={() => setSalaryMode("monthly")}
                  className={`rounded-lg px-3 py-1 ${salaryMode === "monthly" ? "bg-cyan-500/20 text-cyan-200" : "bg-white/5"}`}
                >
                  Monthly
                </button>
              </div>
              <NumberField label={`Gross ${salaryMode === "annual" ? "Annual" : "Monthly"} Salary`} value={salaryInput} onChange={setSalaryInput} step={100} />
              <p className="text-sm text-slate-300">Approx annual net after selected tax model</p>
              <p className="text-cyan-200">{formatCurrency(netSalary, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Tax Calculator ({selectedCountry.name})</h3>
              <NumberField label="Annual Taxable Income" value={taxableIncome} onChange={setTaxableIncome} step={100} />
              {selectedCountry.taxRegimes.length > 1 ? (
                <label className="flex flex-col gap-2 text-sm text-slate-300">
                  <span>Tax Regime</span>
                  <select
                    value={taxRegime}
                    onChange={(event) => setTaxRegime(event.target.value as TaxRegime)}
                    className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2"
                  >
                    {selectedCountry.taxRegimes.map((regimeOption) => (
                      <option key={regimeOption} value={regimeOption} className="bg-slate-900">
                        {regimeOption.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <p className="text-cyan-200">Tax: {formatCurrency(taxBreakdown.totalTax, selectedCountry.currency, selectedCountry.locale)}</p>
              <p className="text-slate-300">Effective Rate: {formatPercent(taxBreakdown.effectiveRate)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">{selectedCountry.consumptionTax.label} Calculator</h3>
              <InfoTooltip label={selectedCountry.consumptionTax.label} description="GST is used in India, VAT in many regions, Sales Tax in the USA." />
              <NumberField label="Net Amount" value={consumptionAmount} onChange={setConsumptionAmount} step={10} />
              <NumberField label={`${selectedCountry.consumptionTax.label} Rate (%)`} value={consumptionRate} onChange={setConsumptionRate} min={0} max={35} />
              <p className="text-cyan-200">Tax: {formatCurrency(consumptionTaxAmount, selectedCountry.currency, selectedCountry.locale)}</p>
              <p className="text-slate-300">Gross: {formatCurrency(consumptionAmount + consumptionTaxAmount, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Gratuity Calculator</h3>
              {!selectedCountry.gratuitySupported ? (
                <p className="text-sm text-amber-200">Available for India and UAE based on local labor structures.</p>
              ) : (
                <>
                  <NumberField label="Last Drawn Monthly Basic" value={gratuitySalary} onChange={setGratuitySalary} step={50} />
                  <NumberField label="Years of Service" value={gratuityYears} onChange={setGratuityYears} step={1} min={1} max={40} />
                  <p className="text-cyan-200">Estimated Gratuity: {formatCurrency(gratuityAmount ?? 0, selectedCountry.currency, selectedCountry.locale)}</p>
                </>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Retirement Contribution Calculator ({selectedCountry.retirementPlanLabel})</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <NumberField label="Annual Income" value={retirementIncome} onChange={setRetirementIncome} step={100} />
                <NumberField label="Employee Rate (%)" value={retirementEmployeeRate} onChange={setRetirementEmployeeRate} min={0} max={30} />
                <NumberField label="Employer Rate (%)" value={retirementEmployerRate} onChange={setRetirementEmployerRate} min={0} max={20} />
              </div>
              <div className="grid gap-2 text-sm text-slate-200 md:grid-cols-3">
                <p>Employee: {formatCurrency(retirement.employeeContribution, selectedCountry.currency, selectedCountry.locale)}</p>
                <p>Employer: {formatCurrency(retirement.employerContribution, selectedCountry.currency, selectedCountry.locale)}</p>
                <p>Total: {formatCurrency(retirement.annualTotal, selectedCountry.currency, selectedCountry.locale)}</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Compare Countries" subtitle="Bonus view: compare monthly EMI and annual tax estimate side by side.">
          <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Country A</span>
                <select value={compareCountryA} onChange={(event) => setCompareCountryA(event.target.value)} className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2">
                  {COUNTRY_CONFIGS.map((country) => (
                    <option key={country.code} value={country.code} className="bg-slate-900">
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Country B</span>
                <select value={compareCountryB} onChange={(event) => setCompareCountryB(event.target.value)} className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2">
                  {COUNTRY_CONFIGS.map((country) => (
                    <option key={country.code} value={country.code} className="bg-slate-900">
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>
              <NumberField label="Annual Income" value={compareIncome} onChange={setCompareIncome} step={100} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <NumberField label="Loan Principal" value={comparePrincipal} onChange={setComparePrincipal} step={1000} />
              <NumberField label="Interest Rate (%)" value={compareRate} onChange={setCompareRate} />
              <NumberField label="Tenure (Years)" value={compareYears} onChange={setCompareYears} step={1} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <motion.div
                key={compareA.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 p-4"
              >
                <p className="font-semibold">{compareA.name}</p>
                <p className="text-sm text-slate-300">Tax: {formatCurrency(compareTaxA.totalTax, compareA.currency, compareA.locale)}</p>
                <p className="text-sm text-slate-300">EMI: {formatCurrency(compareEmiA, compareA.currency, compareA.locale)}/mo</p>
              </motion.div>

              <motion.div
                key={compareB.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 p-4"
              >
                <p className="font-semibold">{compareB.name}</p>
                <p className="text-sm text-slate-300">Tax: {formatCurrency(compareTaxB.totalTax, compareB.currency, compareB.locale)}</p>
                <p className="text-sm text-slate-300">EMI: {formatCurrency(compareEmiB, compareB.currency, compareB.locale)}/mo</p>
              </motion.div>
            </div>
          </div>
        </Section>

        <section className="border-t border-white/10 py-8 text-sm text-slate-400">
          <p>
            All calculators support manual overrides. For currencies with live FX values, results can be converted from the active base.
          </p>
          <p>
            Example conversion: {formatCurrency(universalEmi, selectedCountry.currency, selectedCountry.locale)} equals {fxTargets[0] ? (() => {
              const converted = convertCurrency(universalEmi, exchangeRates, fxTargets[0].currency);
              return converted === null
                ? "N/A"
                : formatCurrency(converted, fxTargets[0].currency, fxTargets[0].locale);
            })() : "N/A"}
          </p>
        </section>
      </main>
    </div>
  );
}
