import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fetchExchangeRates } from "./api/exchangeRates";
import { detectUserCountryCode } from "./api/geo";
import { CountrySelector } from "./components/CountrySelector";
import { InfoTooltip } from "./components/InfoTooltip";
import { NumberField } from "./components/NumberField";
import { SEO } from "./components/SEO";
import { Section } from "./components/Section";
import { COUNTRY_CONFIGS, COUNTRY_MAP } from "./countries/config";
import { calculateTaxByCountry } from "./countries/tax";
import type { TaxRegime } from "./countries/types";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { SEO_KEYWORDS } from "./seo/seoConfig";
import {
  calculateCompoundAmount,
  calculateConsumptionTax,
  calculateEmiOutput,
  calculateIndiaGratuity,
  calculateMonthlyEmi,
  calculateRecurringInvestmentOutput,
  calculateRetirementContribution,
  calculateSimpleInterest,
  calculateTermDepositMaturity,
  calculateUaeGratuity,
} from "./utils/calculations";
import { compareTenure } from "./utils/comparison";
import { convertCurrency, formatCurrency, formatPercent, toFlagEmoji } from "./utils/format";

const PREFS_KEY = "fincalc-global-prefs-v1";
const DEFAULT_SIP_INFLATION = 4.5;

type SalaryMode = "monthly" | "annual";
type InvestmentMode = "sip" | "lumpsum";

interface InvestmentForm {
  monthly?: number;
  amount?: number;
  rate?: number;
  years?: number;
}

interface InvestmentResult {
  futureValue: number;
  invested: number;
  gains: number;
}

const DEFAULT_INVESTMENT_FORM: Record<InvestmentMode, InvestmentForm> = {
  sip: {
    monthly: 5000,
    rate: 10,
    years: 10,
  },
  lumpsum: {
    amount: 100000,
    rate: 10,
    years: 10,
  },
};

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
  const [investmentMode, setInvestmentMode] = useState<InvestmentMode>("sip");
  const [investmentForm, setInvestmentForm] = useState<InvestmentForm>(DEFAULT_INVESTMENT_FORM.sip);
  const [investmentResult, setInvestmentResult] = useState<InvestmentResult | null>(null);
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
  const [showEmiExplanation, setShowEmiExplanation] = useState(false);
  const [showInvestmentExplanation, setShowInvestmentExplanation] = useState(false);
  const [copiedResult, setCopiedResult] = useState<"emi" | "investment" | null>(null);

  const selectedCountry = COUNTRY_MAP[selectedCountryCode] ?? COUNTRY_CONFIGS[0];
  const allCurrencies = useMemo(
    () => [...new Set(COUNTRY_CONFIGS.map((country) => country.currency))],
    []
  );
  const numericInputs = useMemo(() => ({
    salaryInput,
    taxableIncome,
    consumptionAmount,
    consumptionRate,
    gratuitySalary,
    gratuityYears,
    retirementIncome,
    retirementEmployeeRate,
    retirementEmployerRate,
    loanPrincipal,
    loanYears,
    loanRate,
    homeLoanPrincipal,
    homeLoanYears,
    homeLoanRate,
    carLoanPrincipal,
    carLoanYears,
    carLoanRate,
    personalLoanPrincipal,
    personalLoanYears,
    personalLoanRate,
    termDepositPrincipal,
    termDepositRate,
    termDepositYears,
    termDepositCompounds,
    simplePrincipal,
    simpleRate,
    simpleYears,
    compoundPrincipal,
    compoundRate,
    compoundYears,
    compoundCompounds,
    compareIncome,
    comparePrincipal,
    compareRate,
    compareYears,
  }), [
    salaryInput,
    taxableIncome,
    consumptionAmount,
    consumptionRate,
    gratuitySalary,
    gratuityYears,
    retirementIncome,
    retirementEmployeeRate,
    retirementEmployerRate,
    loanPrincipal,
    loanYears,
    loanRate,
    homeLoanPrincipal,
    homeLoanYears,
    homeLoanRate,
    carLoanPrincipal,
    carLoanYears,
    carLoanRate,
    personalLoanPrincipal,
    personalLoanYears,
    personalLoanRate,
    termDepositPrincipal,
    termDepositRate,
    termDepositYears,
    termDepositCompounds,
    simplePrincipal,
    simpleRate,
    simpleYears,
    compoundPrincipal,
    compoundRate,
    compoundYears,
    compoundCompounds,
    compareIncome,
    comparePrincipal,
    compareRate,
    compareYears,
  ]);
  const debouncedInputs = useDebouncedValue(numericInputs, 300);
  const debouncedInvestmentForm = useDebouncedValue(investmentForm, 300);

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

  useEffect(() => {
    if (!copiedResult) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedResult(null);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedResult]);

  useEffect(() => {
    setInvestmentForm(DEFAULT_INVESTMENT_FORM[investmentMode]);
    setInvestmentResult(null);
  }, [investmentMode]);

  useEffect(() => {
    const rate = debouncedInvestmentForm.rate;
    const years = debouncedInvestmentForm.years;

    if (!rate || !years || rate <= 0 || years <= 0) {
      setInvestmentResult(null);
      return;
    }

    if (investmentMode === "sip") {
      const monthly = debouncedInvestmentForm.monthly;
      if (!monthly || monthly <= 0) {
        setInvestmentResult(null);
        return;
      }

      const result = calculateRecurringInvestmentOutput(
        monthly,
        rate,
        years,
        DEFAULT_SIP_INFLATION
      );

      setInvestmentResult({
        futureValue: result.result,
        invested: result.invested,
        gains: result.gains,
      });
      return;
    }

    const amount = debouncedInvestmentForm.amount;
    if (!amount || amount <= 0) {
      setInvestmentResult(null);
      return;
    }

    const futureValue = calculateCompoundAmount(amount, rate, years, 1);
    setInvestmentResult({
      futureValue,
      invested: amount,
      gains: Math.max(futureValue - amount, 0),
    });
  }, [debouncedInvestmentForm, investmentMode]);

  const salaryAnnual = salaryMode === "monthly" ? debouncedInputs.salaryInput * 12 : debouncedInputs.salaryInput;
  const taxBreakdown = calculateTaxByCountry(selectedCountry.code, debouncedInputs.taxableIncome, taxRegime);
  const netSalary = Math.max(salaryAnnual - taxBreakdown.totalTax, 0);
  const consumptionTaxAmount = calculateConsumptionTax(debouncedInputs.consumptionAmount, debouncedInputs.consumptionRate);
  const gratuityAmount = selectedCountry.code === "IN"
    ? calculateIndiaGratuity(debouncedInputs.gratuitySalary, debouncedInputs.gratuityYears)
    : selectedCountry.code === "AE"
      ? calculateUaeGratuity(debouncedInputs.gratuitySalary, debouncedInputs.gratuityYears)
      : null;

  const retirement = calculateRetirementContribution(
    debouncedInputs.retirementIncome,
    debouncedInputs.retirementEmployeeRate,
    debouncedInputs.retirementEmployerRate
  );

  const universalEmiOutput = calculateEmiOutput(
    debouncedInputs.loanPrincipal,
    debouncedInputs.loanRate,
    debouncedInputs.loanYears
  );
  const universalEmi = universalEmiOutput.result;
  const homeLoanEmi = calculateMonthlyEmi(
    debouncedInputs.homeLoanPrincipal,
    debouncedInputs.homeLoanRate,
    debouncedInputs.homeLoanYears
  );
  const carLoanEmi = calculateMonthlyEmi(
    debouncedInputs.carLoanPrincipal,
    debouncedInputs.carLoanRate,
    debouncedInputs.carLoanYears
  );
  const personalLoanEmi = calculateMonthlyEmi(
    debouncedInputs.personalLoanPrincipal,
    debouncedInputs.personalLoanRate,
    debouncedInputs.personalLoanYears
  );
  const emiComparison = compareTenure({
    principal: debouncedInputs.loanPrincipal,
    rate: debouncedInputs.loanRate,
    tenure: debouncedInputs.loanYears,
  });

  const termDepositMaturity = calculateTermDepositMaturity(
    debouncedInputs.termDepositPrincipal,
    debouncedInputs.termDepositRate,
    debouncedInputs.termDepositYears,
    debouncedInputs.termDepositCompounds
  );

  const simpleInterest = calculateSimpleInterest(
    debouncedInputs.simplePrincipal,
    debouncedInputs.simpleRate,
    debouncedInputs.simpleYears
  );
  const compoundAmount = calculateCompoundAmount(
    debouncedInputs.compoundPrincipal,
    debouncedInputs.compoundRate,
    debouncedInputs.compoundYears,
    debouncedInputs.compoundCompounds
  );

  const compareA = COUNTRY_MAP[compareCountryA] ?? COUNTRY_CONFIGS[0];
  const compareB = COUNTRY_MAP[compareCountryB] ?? COUNTRY_CONFIGS[1];
  const compareTaxA = calculateTaxByCountry(compareA.code, debouncedInputs.compareIncome, compareA.taxRegimes[0] ?? "default");
  const compareTaxB = calculateTaxByCountry(compareB.code, debouncedInputs.compareIncome, compareB.taxRegimes[0] ?? "default");
  const compareEmiA = calculateMonthlyEmi(
    debouncedInputs.comparePrincipal,
    debouncedInputs.compareRate,
    debouncedInputs.compareYears
  );
  const compareEmiB = calculateMonthlyEmi(
    debouncedInputs.comparePrincipal,
    debouncedInputs.compareRate,
    debouncedInputs.compareYears
  );

  const fxTargets = COUNTRY_CONFIGS.filter((country) => country.currency !== selectedCountry.currency).slice(0, 3);
  const homepageSeo = selectedCountry.code === "IN"
    ? {
      title: "Global Financial Calculator | EMI, SIP, Tax & Investment Tools",
      description: "Free financial calculator for India. Calculate EMI, SIP returns, tax, and investment growth instantly.",
      keywords: [...SEO_KEYWORDS.core, ...SEO_KEYWORDS.comparison],
    }
    : {
      title: `${selectedCountry.name} Financial Calculator | EMI, SIP, Tax & Investment Tools`,
      description: `Use our ${selectedCountry.name} financial calculator to estimate EMI, tax, SIP growth, and investment returns with country-aware settings.`,
      keywords: [...SEO_KEYWORDS.core, ...SEO_KEYWORDS.comparison],
    };

  const copyResult = async (type: "emi" | "investment") => {
    const text = type === "emi"
      ? `EMI: ${formatCurrency(universalEmiOutput.result, selectedCountry.currency, selectedCountry.locale)}, Total Interest: ${formatCurrency(universalEmiOutput.totalInterest, selectedCountry.currency, selectedCountry.locale)}`
      : `Future Value: ${formatCurrency(investmentResult?.futureValue ?? 0, selectedCountry.currency, selectedCountry.locale)}, Invested: ${formatCurrency(investmentResult?.invested ?? 0, selectedCountry.currency, selectedCountry.locale)}, Estimated Gains: ${formatCurrency(investmentResult?.gains ?? 0, selectedCountry.currency, selectedCountry.locale)}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedResult(type);
    } catch {
      setCopiedResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title={homepageSeo.title}
        description={homepageSeo.description}
        keywords={homepageSeo.keywords}
      />
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
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              {selectedCountry.code === "IN" ? "All-in-One Financial Calculator India" : `${selectedCountry.name} Financial Calculator`}
            </h1>
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
            <svg viewBox="0 0 440 300" className="h-auto w-full" aria-hidden="true" focusable="false">
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
              <NumberField label={`Principal (${selectedCountry.currency})`} value={loanPrincipal} onChange={setLoanPrincipal} min={1000} max={100000000} step={1000} />
              <NumberField label="Annual Interest Rate (%)" value={loanRate} onChange={setLoanRate} min={0} max={40} step={0.1} />
              <NumberField label="Tenure (years)" value={loanYears} onChange={setLoanYears} min={1} max={40} step={1} />
              <p className="text-xl font-semibold text-cyan-200">{formatCurrency(universalEmi, selectedCountry.currency, selectedCountry.locale)} / month</p>
              <p className="text-sm text-slate-300">Total Interest: {formatCurrency(universalEmiOutput.totalInterest, selectedCountry.currency, selectedCountry.locale)}</p>
              <p className="text-sm text-slate-300">{universalEmiOutput.insight}</p>
              <p className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{universalEmiOutput.tip}</p>
              {universalEmiOutput.warning ? (
                <p className="text-sm text-red-300">{universalEmiOutput.warning}</p>
              ) : null}
              {debouncedInputs.loanYears > 5 ? (
                <p className="text-sm text-slate-300">
                  If you reduce tenure by 5 years, you save {formatCurrency(emiComparison.saveIfShorter, selectedCountry.currency, selectedCountry.locale)}
                </p>
              ) : null}
              <p className="text-sm text-slate-300">
                If you increase tenure by 5 years, you pay {formatCurrency(emiComparison.extraIfLonger, selectedCountry.currency, selectedCountry.locale)} more
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmiExplanation((current) => !current)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200"
                >
                  Explain Calculation
                </button>
                <button
                  type="button"
                  onClick={() => void copyResult("emi")}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200"
                >
                  Copy Result
                </button>
                {copiedResult === "emi" ? <span className="text-sm text-cyan-200">Copied</span> : null}
              </div>
              {showEmiExplanation ? (
                <p className="text-sm text-slate-300">
                  EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
                </p>
              ) : null}
            </div>

            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
              <InfoTooltip label="Home, Car, Personal" description="Country switching updates preset rates. You can always override manually." />
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-slate-300">Home Loan</p>
                  <p>{formatCurrency(homeLoanEmi, selectedCountry.currency, selectedCountry.locale)}/mo</p>
                  <NumberField label="Rate" value={homeLoanRate} onChange={setHomeLoanRate} min={0} max={40} step={0.1} />
                  <NumberField label="Years" value={homeLoanYears} onChange={setHomeLoanYears} min={1} step={1} max={35} />
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-slate-300">Car Loan</p>
                  <p>{formatCurrency(carLoanEmi, selectedCountry.currency, selectedCountry.locale)}/mo</p>
                  <NumberField label="Rate" value={carLoanRate} onChange={setCarLoanRate} min={0} max={40} step={0.1} />
                  <NumberField label="Years" value={carLoanYears} onChange={setCarLoanYears} min={1} step={1} max={10} />
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-slate-300">Personal Loan</p>
                  <p>{formatCurrency(personalLoanEmi, selectedCountry.currency, selectedCountry.locale)}/mo</p>
                  <NumberField label="Rate" value={personalLoanRate} onChange={setPersonalLoanRate} min={0} max={45} step={0.1} />
                  <NumberField label="Years" value={personalLoanYears} onChange={setPersonalLoanYears} min={1} step={1} max={8} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <NumberField label="Home Principal" value={homeLoanPrincipal} onChange={setHomeLoanPrincipal} min={1000} max={100000000} step={1000} />
                <NumberField label="Car Principal" value={carLoanPrincipal} onChange={setCarLoanPrincipal} min={1000} max={10000000} step={500} />
                <NumberField label="Personal Principal" value={personalLoanPrincipal} onChange={setPersonalLoanPrincipal} min={1000} max={1000000} step={100} />
              </div>
            </div>
          </motion.div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">How this works</h3>
              <p>
                This EMI calculator India estimate uses your loan amount, annual interest rate, and repayment tenure to show a monthly EMI, total interest, and how changing tenure affects repayment cost.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Frequently Asked Questions</h3>
              <p><strong>What is EMI calculator?</strong> It helps you estimate the fixed monthly repayment for a loan using principal, rate, and tenure.</p>
              <p><strong>How is EMI calculated?</strong> The formula converts annual interest into a monthly rate and spreads repayment across the chosen number of months.</p>
            </div>
          </div>
        </Section>

        <Section title="Investment Calculators" subtitle="Term Deposit, Recurring Investment, Simple Interest, and Compound Interest.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Term Deposit</h3>
              <NumberField label="Initial Deposit" value={termDepositPrincipal} onChange={setTermDepositPrincipal} min={100} max={100000000} step={1000} />
              <NumberField label="Annual Rate (%)" value={termDepositRate} onChange={setTermDepositRate} min={0} max={30} step={0.1} />
              <NumberField label="Years" value={termDepositYears} onChange={setTermDepositYears} min={1} max={50} step={1} />
              <NumberField label="Compounds / Year" value={termDepositCompounds} onChange={setTermDepositCompounds} step={1} min={1} max={12} />
              <p className="text-cyan-200">Maturity: {formatCurrency(termDepositMaturity, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Investment Calculator</h3>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Calculation Type</span>
                <select
                  value={investmentMode}
                  onChange={(event) => setInvestmentMode(event.target.value as InvestmentMode)}
                  className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2"
                >
                  <option value="sip" className="bg-slate-900">SIP</option>
                  <option value="lumpsum" className="bg-slate-900">Lumpsum</option>
                </select>
              </label>
              {investmentMode === "sip" ? (
                <NumberField
                  label="Monthly Investment"
                  value={investmentForm.monthly ?? 0}
                  onChange={(value) => setInvestmentForm({ ...investmentForm, monthly: value })}
                  min={100}
                  max={1000000}
                  step={1000}
                />
              ) : (
                <NumberField
                  label="Total Investment"
                  value={investmentForm.amount ?? 0}
                  onChange={(value) => setInvestmentForm({ ...investmentForm, amount: value })}
                  min={1000}
                  max={100000000}
                  step={1000}
                />
              )}
              <NumberField
                label="Expected Return (%)"
                value={investmentForm.rate ?? 0}
                onChange={(value) => setInvestmentForm({ ...investmentForm, rate: value })}
                min={0.1}
                max={30}
                step={0.1}
              />
              <NumberField
                label="Duration (years)"
                value={investmentForm.years ?? 0}
                onChange={(value) => setInvestmentForm({ ...investmentForm, years: value })}
                min={1}
                max={40}
                step={1}
              />
              {!investmentResult ? (
                <p className="text-sm text-red-300">Enter positive values to calculate the investment result.</p>
              ) : (
                <>
                  <p className="text-cyan-200">Future Value: {formatCurrency(investmentResult.futureValue, selectedCountry.currency, selectedCountry.locale)}</p>
                  <p className="text-sm text-slate-300">Invested: {formatCurrency(investmentResult.invested, selectedCountry.currency, selectedCountry.locale)}</p>
                  <p className="text-sm text-slate-300">Estimated Gains: {formatCurrency(investmentResult.gains, selectedCountry.currency, selectedCountry.locale)}</p>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvestmentExplanation((current) => !current)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200"
                >
                  Explain Calculation
                </button>
                <button
                  type="button"
                  onClick={() => void copyResult("investment")}
                  disabled={!investmentResult}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200"
                >
                  Copy Result
                </button>
                {copiedResult === "investment" ? <span className="text-sm text-cyan-200">Copied</span> : null}
              </div>
              {investmentMode === "sip" ? (
                <p className="text-xs text-slate-400">Inflation check uses a {DEFAULT_SIP_INFLATION.toFixed(1)}% assumption.</p>
              ) : null}
              {showInvestmentExplanation ? (
                <p className="text-sm text-slate-300">
                  {investmentMode === "sip"
                    ? "Future Value = M x [((1+r)^n - 1) / r] x (1+r)"
                    : "Future Value = P x (1+r)^N"}
                </p>
              ) : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Simple Interest</h3>
              <NumberField label="Principal" value={simplePrincipal} onChange={setSimplePrincipal} min={100} max={100000000} step={1000} />
              <NumberField label="Rate (%)" value={simpleRate} onChange={setSimpleRate} min={0} max={30} step={0.1} />
              <NumberField label="Years" value={simpleYears} onChange={setSimpleYears} min={1} max={40} step={1} />
              <p className="text-cyan-200">Interest: {formatCurrency(simpleInterest, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Compound Interest</h3>
              <NumberField label="Principal" value={compoundPrincipal} onChange={setCompoundPrincipal} min={100} max={100000000} step={1000} />
              <NumberField label="Rate (%)" value={compoundRate} onChange={setCompoundRate} min={0} max={30} step={0.1} />
              <NumberField label="Years" value={compoundYears} onChange={setCompoundYears} min={1} max={50} step={1} />
              <NumberField label="Compounds / Year" value={compoundCompounds} onChange={setCompoundCompounds} step={1} min={1} max={12} />
              <p className="text-cyan-200">Maturity: {formatCurrency(compoundAmount, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">How this works</h3>
              <p>
                This SIP calculator India view lets you compare monthly SIP investing with a lumpsum investment so you can understand expected growth, future value, and long-term compounding more clearly.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Frequently Asked Questions</h3>
              <p><strong>How is SIP calculated?</strong> The calculator compounds each monthly investment over the selected duration using the expected annual return.</p>
              <p><strong>Which is better SIP or lumpsum?</strong> SIP can help average entry points over time, while lumpsum can work well when money is available upfront and investment horizon is long.</p>
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
              <NumberField label={`Gross ${salaryMode === "annual" ? "Annual" : "Monthly"} Salary`} value={salaryInput} onChange={setSalaryInput} min={0} max={100000000} step={1000} />
              <p className="text-sm text-slate-300">Approx annual net after selected tax model</p>
              <p className="text-cyan-200">{formatCurrency(netSalary, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Tax Calculator ({selectedCountry.name})</h3>
              <NumberField label="Annual Taxable Income" value={taxableIncome} onChange={setTaxableIncome} min={0} max={100000000} step={1000} />
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
              <NumberField label="Net Amount" value={consumptionAmount} onChange={setConsumptionAmount} min={0} max={10000000} step={100} />
              <NumberField label={`${selectedCountry.consumptionTax.label} Rate (%)`} value={consumptionRate} onChange={setConsumptionRate} min={0} max={35} step={0.1} />
              <p className="text-cyan-200">Tax: {formatCurrency(consumptionTaxAmount, selectedCountry.currency, selectedCountry.locale)}</p>
              <p className="text-slate-300">Gross: {formatCurrency(debouncedInputs.consumptionAmount + consumptionTaxAmount, selectedCountry.currency, selectedCountry.locale)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="text-lg font-semibold">Gratuity Calculator</h3>
              {!selectedCountry.gratuitySupported ? (
                <p className="text-sm text-amber-200">Available for India and UAE based on local labor structures.</p>
              ) : (
                <>
                  <NumberField label="Last Drawn Monthly Basic" value={gratuitySalary} onChange={setGratuitySalary} min={0} max={10000000} step={100} />
                  <NumberField label="Years of Service" value={gratuityYears} onChange={setGratuityYears} step={1} min={1} max={40} />
                  <p className="text-cyan-200">Estimated Gratuity: {formatCurrency(gratuityAmount ?? 0, selectedCountry.currency, selectedCountry.locale)}</p>
                </>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Retirement Contribution Calculator ({selectedCountry.retirementPlanLabel})</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <NumberField label="Annual Income" value={retirementIncome} onChange={setRetirementIncome} min={0} max={100000000} step={1000} />
                <NumberField label="Employee Rate (%)" value={retirementEmployeeRate} onChange={setRetirementEmployeeRate} min={0} max={30} step={0.1} />
                <NumberField label="Employer Rate (%)" value={retirementEmployerRate} onChange={setRetirementEmployerRate} min={0} max={20} step={0.1} />
              </div>
              <div className="grid gap-2 text-sm text-slate-200 md:grid-cols-3">
                <p>Employee: {formatCurrency(retirement.employeeContribution, selectedCountry.currency, selectedCountry.locale)}</p>
                <p>Employer: {formatCurrency(retirement.employerContribution, selectedCountry.currency, selectedCountry.locale)}</p>
                <p>Total: {formatCurrency(retirement.annualTotal, selectedCountry.currency, selectedCountry.locale)}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">How this works</h3>
              <p>
                This income tax calculator India section estimates tax from your annual income and supports old vs new regime comparison where available, making it easier to review tax impact and salary planning.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Frequently Asked Questions</h3>
              <p><strong>What is an income tax calculator?</strong> It estimates annual tax liability based on taxable income and the rules applied for the selected country or regime.</p>
              <p><strong>How does old vs new regime comparison help?</strong> It shows how different deduction rules and slab structures can change the final tax payable.</p>
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
              <NumberField label="Annual Income" value={compareIncome} onChange={setCompareIncome} min={0} max={100000000} step={1000} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <NumberField label="Loan Principal" value={comparePrincipal} onChange={setComparePrincipal} min={1000} max={100000000} step={1000} />
              <NumberField label="Interest Rate (%)" value={compareRate} onChange={setCompareRate} min={0} max={40} step={0.1} />
              <NumberField label="Tenure (Years)" value={compareYears} onChange={setCompareYears} min={1} max={40} step={1} />
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
