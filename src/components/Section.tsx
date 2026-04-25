import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section className="space-y-6 border-t border-white/10 py-12">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="max-w-2xl text-sm text-slate-300">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}