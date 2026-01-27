"use client";
import React from "react";

export interface CardPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Molecule: CardPanel
 * A reusable card/panel container with theme-aware background and shadow.
 */
export const CardPanel: React.FC<CardPanelProps> = ({ children, className = "" }) => {
  // Theme detection
  const [theme, setTheme] = React.useState<string>("green");
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      setTheme(document.documentElement.getAttribute("data-theme") || "green");
    }
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "green");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Theme-based background
  // Purple theme: #D9D9D9; Green theme: light green #E6FFD6
  const bg = theme === "purple" ? "bg-[#D9D9D9]" : "bg-[#E6FFD6]";
  const border = theme === "purple" ? "border-[#9D33FA]" : "border-[#9BFA32]";

  return (
    <div
      className={`w-full lg:w-3/4 mx-auto h-[33vh] rounded-2xl shadow-lg border ${bg} ${border} p-8 flex flex-col items-center ${className}`}
    >
      {children}
    </div>
  );
};
