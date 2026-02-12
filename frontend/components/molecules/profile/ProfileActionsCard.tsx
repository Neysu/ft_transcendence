"use client";

import type { ReactNode } from "react";
import { useProfileThemeMode } from "./useProfileThemeMode";

type ProfileActionsCardProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function ProfileActionsCard({ children, className = "", title }: ProfileActionsCardProps) {
  const themeMode = useProfileThemeMode();
  const containerClass =
    themeMode === "purple"
      ? "border-violet-300/50 bg-white/76 shadow-violet-300/15"
      : "border-white/60 bg-white/60 shadow-emerald-200/15";

  return (
    <section className={`rounded-3xl border backdrop-blur-md p-5 shadow-sm ${containerClass}`}>
      {title ? <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 pb-3">{title}</h2> : null}
      <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>{children}</div>
    </section>
  );
}
