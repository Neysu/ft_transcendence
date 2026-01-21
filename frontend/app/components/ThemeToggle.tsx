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
  // Track current theme state ("light" or "dark")
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // On component mount, restore saved theme preference from localStorage
  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    // Set data-theme attribute on <html> element to activate theme CSS
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  /**
   * Toggle between light and dark themes
   * Updates state, localStorage, and the document's data-theme attribute
   */
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    // Apply theme to document root for CSS variable updates
    document.documentElement.setAttribute("data-theme", newTheme);
    // Persist user preference
    localStorage.setItem("theme", newTheme);
  };

  return (
    // Toggle switch button - background color changes based on theme
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-5 focus:ring-offset-2 focus:ring-primary"
      style={{
        // Background: primary color when dark, muted when light
        backgroundColor: theme === "dark" ? "var(--primary)" : "var(--muted)",
      }}
      aria-label="Toggle theme"
    >
      {/* Switch knob - slides left/right based on theme */}
      <span
        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform"
        style={{
          // Position: right side when dark, left side when light
          transform: theme === "dark" ? "translateX(2rem)" : "translateX(0.25rem)",
        }}
      />
    </button>
  );
}
