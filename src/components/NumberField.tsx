interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({ label, value, onChange, min = 0, max, step = 0.1 }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        inputMode="decimal"
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
      />
    </label>
  );
}
