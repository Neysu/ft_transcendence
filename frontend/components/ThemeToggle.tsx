"use client";

import { useEffect, useState } from "react";

/**
 * ThemeToggle Component
 * 
 * A toggle switch button that allows users to switch between light and dark themes.
 * The component manages theme state and persists the user's preference in localStorage.
 * When toggled, it sets a data-theme attribute on the document element which triggers
 * CSS variable changes defined in globals.css.
 */

export default function ThemeToggle() {
  // Track current theme state ("green" or "purple")
  const [theme, setTheme] = useState<"green" | "purple">("green");

  // On component mount, restore saved theme preference from localStorage
  useEffect(() => {
    // Check for saved theme preference or default to green
    const savedTheme = localStorage.getItem("theme") as "green" | "purple" | null;
    const initialTheme = savedTheme || "green";
    setTheme(initialTheme);
    // Set data-theme attribute on <html> element to activate theme CSS
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  /**
   * Toggle between green and purple themes
   * Updates state, localStorage, and the document's data-theme attribute
   */
  const toggleTheme = () => {
    const newTheme = theme === "green" ? "purple" : "green";
    setTheme(newTheme);
    // Apply theme to document root for CSS variable updates
    document.documentElement.setAttribute("data-theme", newTheme);
    // Persist user preference
    localStorage.setItem("theme", newTheme);
  };

  return (
    // Toggle switch button - background color is green when theme is purple, purple when theme is green
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-5 focus:ring-offset-2 focus:ring-primary"
      style={{
        backgroundColor:
          theme === "purple"
            ? "#9BFA32" // green background when purple theme
            : "#9D33FA", // purple background when green theme
      }}
      aria-label="Toggle theme"
    >
      {/* Switch knob - slides left/right based on theme */}
      <span
        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform"
        style={{
          // Position: right side when purple, left side when green
          transform: theme === "purple" ? "translateX(2rem)" : "translateX(0.25rem)",
        }}
      />
    </button>
  );
}
