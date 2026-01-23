"use client";

import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { ComponentExample } from "@/components/component-example";
import { Button } from "@/components/ui/button";

/**
 * Home Page Component
 * 
 * The main landing page of the ft_transcendence application.
 * Demonstrates the theme and language toggle functionality.
 * All text content uses the translation function t() for multi-language support.
 */
export default function Home() {
  // Access translation function from language context
  const { t } = useLanguage();

  return (
    // Full viewport height container
    <div className="min-h-screen">
      {/* Main content area with responsive container */}
      <main className="container mx-auto px-4 py-8">
        {/* Header section with title and toggle buttons */}
        <div className="flex items-center justify-between mb-8">
          {/* Page title - translated based on current language */}
          <h1 className="text-4xl font-bold">
            {t("welcome")}
          </h1>
          
          {/* Toggle buttons for language and theme */}
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        {/* Content section - placeholder for application content */}
        <div className="space-y-4">
          <p className="text-lg">
            {t("content")}
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xl px-8 py-4 rounded-lg font-semibold">
          {t("hello")}
        </Button>
      </main>
    </div>
  );
}
