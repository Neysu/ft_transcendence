"use client";

import type { ReactNode } from "react";
import { useProfileThemeMode } from "./useProfileThemeMode";

type ProfileNoticeCardProps = {
  children: ReactNode;
  tone?: "neutral" | "error";
};

export function ProfileNoticeCard({ children, tone = "neutral" }: ProfileNoticeCardProps) {
  const themeMode = useProfileThemeMode();

  if (tone === "error") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center text-red-700 shadow-sm">
        {children}
      </div>
    );
  }

  const neutralClass =
    themeMode === "purple"
      ? "border-violet-300/50 bg-white/78 text-slate-900"
      : "border-white/60 bg-white/62 text-slate-900";

  return (
    <div className={`w-full max-w-md rounded-2xl border px-6 py-4 text-center shadow-sm ${neutralClass}`}>
      {children}
    </div>
  );
}
