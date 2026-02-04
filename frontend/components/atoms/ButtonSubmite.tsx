"use client";
import React from "react";
import { useLanguage } from "@/components/LanguageProvider";

export interface ButtonSubmiteProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Atom: ButtonSubmite
 * A theme-aware submit button with smooth transitions and scale animations.
 */
export const ButtonSubmite: React.FC<ButtonSubmiteProps> = ({ className = "", ...props }) => {
  const { language } = useLanguage();
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

  // Text for each language
  const text = language === "fr" ? "Soumettre" : language === "es" ? "Enviar" : "Submit";

  // Theme-based background color
  // Green theme: #9BFA32, Purple theme: #9D33FA
  const backgroundColor = theme === "purple" ? "#9D33FA" : "#9BFA32";

  return (
    <button
      className={`px-8 py-3 font-semibold rounded-lg transition-transform hover:scale-105 active:scale-95 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
      style={{ backgroundColor }}
      {...props}
    >
      {text}
    </button>
  );
};
