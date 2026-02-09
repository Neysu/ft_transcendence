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
      className={`w-40 h-12 flex items-center justify-center rounded-full font-semibold shadow-lg transition-colors transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${base} ${className}`}
      {...props}
    >
      <span className="truncate w-full px-2 text-center block">{children}</span>
    </button>
  );
};
