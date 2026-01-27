"use client";
import { useEffect } from "react";

export function ThemeSync({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const setTheme = () => {
      const savedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
      const theme = savedTheme || "green";
      document.documentElement.setAttribute("data-theme", theme);
    };
    setTheme();
    window.addEventListener("storage", setTheme);
    return () => {
      window.removeEventListener("storage", setTheme);
    };
  }, []);
  return <>{children}</>;
}
