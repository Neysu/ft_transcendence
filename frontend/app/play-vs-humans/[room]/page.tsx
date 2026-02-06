"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { RPSChoice, type Choice } from "@/components/atoms/RPSChoice";
import { RPSOpponent } from "@/components/atoms/RPSOpponent";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PlayVsPlayersPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState<boolean>(false);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const choiceSize = "clamp(84px, 20vw, 160px)";
  const opponentSize = "clamp(80px, 18vw, 160px)";

  const handlePlayerChoice = (choice: Choice) => {
    setPlayerChoice(choice);
    setIsWaitingForOpponent(true);
    // TODO: Send choice to backend and receive opponent's choice
    // TODO: After backend responds with result, update scores:
    // Example: if player wins -> setPlayerScore(playerScore + 1)
    //          if opponent wins -> setOpponentScore(opponentScore + 1)
    console.log("Player chose:", choice);
  };

  const handlePlayAgain = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setIsWaitingForOpponent(false);
    // Scores are NOT reset here - they persist across rounds
    // Scores only reset when user leaves the page
    // TODO: Send new round request to backend
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      {/* Back button */}
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      {/* Main content */}
      <div className="flex items-start justify-center min-h-[calc(100vh-160px)] px-2 sm:px-4 pt-6">
        <CardPanel className="w-full max-w-[95vw] h-auto min-h-[60vh] flex !px-3 sm:!px-6 md:!px-12 mx-auto">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-2 sm:!p-3 md:!p-6 flex flex-col items-center justify-between gap-5">
            {/* Page title */}
            <h1 className="text-lg sm:text-xl font-bold text-center -mt-1">{t("playVsPlayers")}</h1>

            {/* TOP: Opponent's choice */}
            <div className="flex flex-col items-center gap-3 -mt-2 sm:-mt-4 md:-mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t("opponentChoice")}:</p>
              <RPSOpponent
                size={opponentSize}
                isLoading={isWaitingForOpponent}
                opponentChoice={opponentChoice}
              />
            </div>

            {/* MIDDLE: Score and game info */}
            <div className="flex flex-col items-center gap-4 w-full relative">
              {/* Score Display */}
              <div className="flex justify-between items-center w-full max-w-md px-2 sm:px-0">
                {/* Player Score - Left */}
                <div className="flex flex-col items-center">
                  <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-600 dark:text-green-400">{playerScore}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("you")}</p>
                </div>

                {/* VS Separator */}
                <div className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">VS</div>

                {/* Opponent Score - Right */}
                <div className="flex flex-col items-center">
                  <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-red-600 dark:text-red-400">{opponentScore}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("opponent")}</p>
                </div>
              </div>

              {/* Play Again Button */}
              <div className="h-10 flex items-center justify-center mt-4">
                <button
                  onClick={handlePlayAgain}
                  className={`px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors ${playerChoice ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  {t("playAgain")}
                </button>
              </div>
            </div>

            {/* BOTTOM: Player's choices */}
            <div className="flex flex-col items-center gap-4 w-full">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t("yourChoice")}:</p>
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                <RPSChoice size={choiceSize} choice="rock" onClick={handlePlayerChoice} />
                <RPSChoice size={choiceSize} choice="paper" onClick={handlePlayerChoice} />
                <RPSChoice size={choiceSize} choice="scissors" onClick={handlePlayerChoice} />
              </div>
            </div>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}
