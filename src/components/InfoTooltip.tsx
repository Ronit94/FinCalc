interface InfoTooltipProps {
  label: string;
  description: string;
}

export function InfoTooltip({ label, description }: InfoTooltipProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-100">
      {label}
      <span
        title={description}
        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-white/30 text-xs text-slate-200"
      >
        i
      </span>
    </span>
  );
}