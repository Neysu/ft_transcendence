"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function PlayVsBotPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      {/* Back button */}
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)] px-2 sm:px-4">
        <CardPanel className="w-full max-w-[95vw] h-auto min-h-[70vh] flex !px-3 sm:!px-6 md:!px-12 mx-auto">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-4 sm:!p-6 md:!p-12 flex flex-col items-center">
            {/* Page title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-center pb-4 sm:pb-6">{t("playVsBots")}</h1>
            
            {/* Content area - ready for game implementation */}
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
                {/* Game content will go here */}
                <div className="text-center text-lg opacity-70">
                  {/* TODO: Add bot selection, difficulty settings, and game interface */}
                </div>
              </div>
            </div>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}
