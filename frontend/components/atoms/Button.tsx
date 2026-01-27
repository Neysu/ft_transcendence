"use client";
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

/**
 * Atom: Button
 * A simple, reusable button atom with theme-aware styling.
 */
export const ButtonBasic1: React.FC<ButtonProps> = ({ variant = "primary", children, className = "", ...props }) => {
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
  let base = "";
  if (variant === "primary") {
    base = theme === "purple"
      ? "bg-[#E1DDB1] text-[#3A0766] hover:bg-[#BEBCA1]"
      : "bg-[#9D33FA] text-[#D9D9D9] hover:bg-purple-700";
  } else {
    base = "bg-[#E1DDB1] text-[#3A0766] border border-[#3A0766] hover:bg-[#BEBCA1]";
  }

  return (
    <button
      className={`w-56 h-16 flex items-center justify-center rounded-full font-semibold shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${base} ${className}`}
      {...props}
    >
      <span className="truncate w-full px-2 text-center block">{children}</span>
    </button>
  );
};
