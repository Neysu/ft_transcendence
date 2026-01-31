"use client";
import React from "react";

export interface CardPanelSolidProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Molecule: CardPanelSolid
 * A reusable card/panel container with theme-aware background and shadow.
 * Solid (non-transparent) background.
 */
export const CardPanelSolid: React.FC<CardPanelSolidProps> = ({ children, className = "", style }) => {
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

  // Theme-based solid background
  // Purple theme: #D9D9D9; Green theme: #E6FFD6
  const bgColor = theme === "purple" ? "#D9D9D9" : "#E6FFD6";
  return (
    <div
      className={`w-full lg:w-3/4 mx-auto h-[33vh] rounded-2xl shadow-lg p-8 flex flex-col items-center ${className}`}
      style={{ backgroundColor: bgColor, ...style }}
    >
      {children}
    </div>
  );
};
