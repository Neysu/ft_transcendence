"use client";

import { useLanguage } from "./LanguageProvider";

/**
 * LanguageToggle Component
 * 
 * A button that displays the next language code and allows users to switch
 * between English, French, and Spanish. Shows what language you'll switch TO.
 */
export default function LanguageToggle() {
  // Access current language and toggle function from context
  const { language, toggleLanguage } = useLanguage();

  const nextLanguages = { en: "FR", fr: "ES", es: "EN" } as const;

  return (
    // Language toggle button - shows next language code
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
      {/* Display next language */}
      {nextLanguages[language]}
    </button>
  );
}
