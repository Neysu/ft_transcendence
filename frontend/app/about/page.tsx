"use client";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { useLanguage } from "@/components/LanguageProvider";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { TextInput } from "@/components/atoms/TextInput";
import { RPSChoice, type Choice } from "@/components/atoms/RPSChoice";
import { RPSOpponent } from "@/components/atoms/RPSOpponent";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useRouter } from "next/navigation";
import React from "react";

export default function AboutPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedChoice, setSelectedChoice] = React.useState<Choice | null>(null);

  const handleChoice = (choice: Choice) => {
    setSelectedChoice(choice);
    console.log("Selected choice:", choice);
  };
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-4">
      <CardPanel>
        <CardPanelSolid className="h-auto">
          <div className="flex flex-col items-center gap-4">
            <ButtonBasic1>{t("hello")}</ButtonBasic1>
            <ButtonCircleBack onClick={() => router.back()} />
            <ButtonSubmite />
            
            {/* RPS Choice Test */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <h3 className="text-lg font-semibold">Rock Paper Scissors:</h3>
              <div className="flex gap-8">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Your Choice:</p>
                  <div className="flex gap-4">
                    <RPSChoice choice="rock" onClick={handleChoice} size={80} />
                    <RPSChoice choice="paper" onClick={handleChoice} size={80} />
                    <RPSChoice choice="scissors" onClick={handleChoice} size={80} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Opponent Choice:</p>
                  <RPSOpponent size={80} isLoading={true} />
                </div>
              </div>
              {selectedChoice && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t("selected")}: <strong>{t(selectedChoice)}</strong>
                </p>
              )}
            </div>
          </div>
        </CardPanelSolid>
      </CardPanel>
      <TextInput placeholder="Type something..." />
    </main>
  );
}
