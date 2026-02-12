"use client";

import { useSyncExternalStore } from "react";

type Theme = "green" | "purple";
const THEME_CHANGE_EVENT = "theme-change";

function readTheme(): Theme {
  if (typeof window === "undefined") {
    return "green";
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "purple") {
    return "purple";
  }
  if (savedTheme === "green") {
    return "green";
  }

  const attrTheme = document.documentElement.getAttribute("data-theme");
  return attrTheme === "purple" ? "purple" : "green";
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === "theme") {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "green");

  const toggleTheme = () => {
    const newTheme = theme === "green" ? "purple" : "green";
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-5 focus:ring-offset-2 focus:ring-primary"
      style={{
        backgroundColor:
          theme === "purple"
            ? "#99fa32"
            : "#9D33FA",
      }}
      aria-label="Toggle theme"
    >
      <span
        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform"
        style={{
          transform: theme === "purple" ? "translateX(2rem)" : "translateX(0.25rem)",
        }}
      />
    </button>
  );
}
