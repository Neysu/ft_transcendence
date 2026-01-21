"use client";

import { useLanguage } from "./LanguageProvider";

/**
 * LanguageToggle Component
 * 
 * A button that displays the opposite language code and allows users to switch
 * between English and French. Shows "FR" when English is active and "EN" when
 * French is active, making it clear what language you'll switch TO.
 */
export default function LanguageToggle() {
  // Access current language and toggle function from context
  const { language, toggleLanguage } = useLanguage();

  return (
    // Language toggle button - shows opposite language code
    <button
      onClick={toggleLanguage}
      className="px-4 py-2 rounded-lg font-medium transition-colors border"
      style={{
        // Use CSS variables from current theme
        backgroundColor: "var(--muted)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
      aria-label="Toggle language"
    >
      {/* Display opposite language: "FR" when English is active, "EN" when French is active */}
      {language === "en" ? "FR" : "EN"}
    </button>
  );
}
