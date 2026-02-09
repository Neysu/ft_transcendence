"use client";
import React from "react";

export interface ButtonLargeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

/**
 * Atom: ButtonLarge
 * A large, square-shaped button atom with theme-aware styling.
 * Used for primary actions like game mode selection.
 */
export const ButtonLarge: React.FC<ButtonLargeProps> = ({ variant = "primary", children, className = "", ...props }) => {
  let base = "";
  if (variant === "primary") {
    base =
      "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-bg-hover)]";
  } else {
    base =
      "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border border-[var(--btn-secondary-border)] hover:bg-[var(--btn-secondary-bg-hover)]";
  }

  return (
    <button
      className={`w-96 h-48 flex items-center justify-center rounded-2xl font-bold text-3xl shadow-lg transition-colors transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${base} ${className}`}
      {...props}
    >
      <span className="truncate w-full px-4 text-center block">{children}</span>
    </button>
  );
};
