"use client";

import { useProfileThemeMode } from "./useProfileThemeMode";

type ProfileInfoRow = {
  label: string;
  value: string;
  breakValue?: boolean;
};

type ProfileInfoRowsCardProps = {
  rows: ProfileInfoRow[];
  title?: string;
};

export function ProfileInfoRowsCard({ rows, title }: ProfileInfoRowsCardProps) {
  const themeMode = useProfileThemeMode();
  const containerClass =
    themeMode === "purple"
      ? "border-violet-300/50 bg-white/76 shadow-violet-300/15"
      : "border-white/60 bg-white/60 shadow-emerald-200/15";
  const rowClass =
    themeMode === "purple"
      ? "bg-violet-50/80"
      : "bg-white/55";

  return (
    <section className={`rounded-3xl border backdrop-blur-md p-5 shadow-sm ${containerClass}`}>
      {title ? <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 pb-3">{title}</h2> : null}
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={`flex items-center justify-between gap-6 rounded-xl p-3 ${rowClass} ${index < rows.length - 1 ? "mb-3" : ""}`}
        >
          <span className="text-xs font-semibold text-slate-700 uppercase">{row.label}</span>
          <span className={`text-lg font-semibold text-slate-900 text-right ${row.breakValue ? "break-all" : ""}`}>
            {row.value}
          </span>
        </div>
      ))}
    </section>
  );
}
