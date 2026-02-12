"use client";

import { useEffect, useState } from "react";

export type ProfileThemeMode = "green" | "purple";

function readThemeMode(): ProfileThemeMode {
  if (typeof document === "undefined") {
    return "green";
  }
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "purple" ? "purple" : "green";
}

export function useProfileThemeMode() {
  const [themeMode, setThemeMode] = useState<ProfileThemeMode>(() => readThemeMode());

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncTheme = () => {
      setThemeMode(readThemeMode());
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("storage", syncTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return themeMode;
}
