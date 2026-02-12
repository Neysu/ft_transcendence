"use client";

import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { type ReactNode } from "react";

type ProfileShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ProfileShell({
  children,
  className = "",
  contentClassName = "",
}: ProfileShellProps) {
  return (
    <main className="relative min-h-[calc(100vh-160px)] px-4 sm:px-6 py-8 sm:py-10 flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-55">
        <div
          className="absolute top-12 left-8 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--profile-shell-orb-1)" }}
        />
        <div
          className="absolute bottom-10 right-0 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--profile-shell-orb-2)" }}
        />
      </div>
      <CardPanel className={`w-full max-w-6xl h-auto min-h-[68vh] !px-4 sm:!px-6 md:!px-8 mx-auto ${className}`}>
        <CardPanelSolid className={`relative overflow-visible flex-1 !w-full !mx-0 h-auto !p-4 sm:!p-6 md:!p-8 ${contentClassName}`}>
          <div
            className="absolute inset-x-0 top-0 h-24 pointer-events-none"
            style={{ backgroundImage: "var(--profile-shell-top-overlay)" }}
          />
          <div className="absolute -top-12 -right-8 h-40 w-40 rounded-full bg-white/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-white/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 w-full max-w-none mx-auto">{children}</div>
        </CardPanelSolid>
      </CardPanel>
    </main>
  );
}
