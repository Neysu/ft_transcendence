"use client";
import React from "react";

export interface CardPanelProps {
  children: React.ReactNode;
  className?: string;
  opacity?: number; // Optional opacity prop (0-1)
}

/**
 * Molecule: CardPanel
 * A reusable card/panel container with theme-aware background and shadow.
 */
export const CardPanel: React.FC<CardPanelProps> = ({ children, className = "", opacity = 0.95 }) => {
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
  const bgColor = theme === "purple" ? "#D9D9D9" : "#E6FFD6";
  const border = theme === "purple" ? "border-[#9D33FA]" : "border-[#9BFA32]";

  return (
    <div
      className={`w-full lg:w-3/4 mx-auto h-[33vh] rounded-2xl shadow-lg border ${border} p-8 flex flex-col items-center ${className}`}
      style={{ backgroundColor: bgColor, opacity }}
    >
      {children}
    </div>
  );
};
