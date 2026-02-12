"use client";
import React from "react";

export type ButtonCircleBackProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Atom: ButtonCircleBack
 * A circular button with a left arrow, used for navigation.
 */
export const ButtonCircleBack: React.FC<ButtonCircleBackProps> = ({ className = "", ...props }) => {
  // Detect theme from document
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

  // Theme-aware color
  const bg = theme === "purple"
    ? "bg-[#D9D9D9] hover:bg-[#bdbdbd]"
    : "bg-[#9D33FA] hover:bg-[#7c25c2]";
  const text = theme === "purple" ? "text-[#3A0766]" : "text-[#D9D9D9]";

  return (
    <button
      className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-colors transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${bg} ${text} ${className}`}
      aria-label="Go back"
      {...props}
    >
      {/* Left arrow SVG */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
};
