"use client";

import React from "react";

export interface TextInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
  disabled?: boolean;
}

/**
 * Atom: TextInput
 * A reusable text input field with theme support.
 */
export const TextInput: React.FC<TextInputProps> = ({
  placeholder = "Enter text...",
  value,
  onChange,
  className = "",
  type = "text",
  disabled = false,
}) => {
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

  // Theme-based colors
  const borderColor = theme === "purple" ? "#9D33FA" : "#9BFA32";
  const backgroundColor = theme === "purple" ? "#F5F5F5" : "#F5F5F5";
  const textColor = theme === "purple" ? "#000000" : "inherit";

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        color: textColor,
      }}
    />
  );
};
