"use client";
import React from "react";
import { useLanguage } from "@/components/LanguageProvider";

export interface ButtonSubmiteProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Atom: ButtonSubmite
 * A square button with 37% opacity purple background and language-aware text.
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

  // Theme-based color
  // For purple theme: #9D33FA at 37% opacity; for green theme: #9BFA32 at 37% opacity
  const bg = theme === "purple"
    ? "bg-[#9D33FA]/[0.37] hover:bg-[#7c25c2]/[0.37]"
    : "bg-[#9BFA32]/[0.37] hover:bg-[#7cbe29]/[0.37]";
  const textColor = theme === "purple" ? "text-white" : "text-[#3A0766]";

  return (
    <button
      className={`min-w-16 h-16 px-4 ${bg} ${textColor} font-bold rounded-lg shadow-lg flex items-center justify-center text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${className}`}
      style={{ width: "auto" }}
      {...props}
    >
      {text}
    </button>
  );
};
