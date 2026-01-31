"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonLarge } from "@/components/atoms/ButtonLarge";

/**
 * Home Page Component
 * 
 * The main page with game mode selection and friends list access.
 */
export default function Home() {
  // Access translation function from language context
  const { t } = useLanguage();

  return (
    <>
      {/* Main content area centered higher on page */}
      <main className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-12 px-4 -mt-16">
        {/* Game mode buttons container */}
        <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">
          {/* Play vs Bots button */}
          <ButtonLarge onClick={() => console.log("Play vs Bots")}>
            {t("playVsBots")}
          </ButtonLarge>

          {/* Play vs Humans button */}
          <ButtonLarge onClick={() => console.log("Play vs Humans")}>
            {t("playVsHumans")}
          </ButtonLarge>
        </div>

        {/* Friends list button centered below */}
        <ButtonBasic1 onClick={() => console.log("Navigate to friends list")} className="!w-64 !h-20 text-xl">
          {t("friendsList")}
        </ButtonBasic1>
      </main>

      {/* Logout button positioned at bottom right */}
      <div className="fixed bottom-8 right-8">
        <ButtonLarge onClick={() => console.log("Logout")} className="scale-[0.35] origin-bottom-right text-5xl hover:!scale-[0.35]">
          {t("logout")}
        </ButtonLarge>
      </div>
    </>
  );
}
