"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { clearGameSummary, loadGameSummary, type GameSummary } from "@/lib/gameSummary";
import { useRouter } from "next/navigation";
import { useState } from "react";

function toMoveLabel(move: "ROCK" | "PAPER" | "SCISSORS", t: (key: string) => string) {
  if (move === "ROCK") return t("rock");
  if (move === "PAPER") return t("paper");
  return t("scissors");
}

export default function GameSummaryPage() {
  useRequireAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [summary] = useState<GameSummary | null>(() => loadGameSummary());

  const winnerLabel =
    summary?.winner === "PLAYER"
      ? t("gameSummaryWinnerYou")
      : summary?.winner === "OPPONENT"
        ? t("gameSummaryWinnerOpponent")
        : t("gameSummaryWinnerDraw");

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      <div className="flex items-start justify-center min-h-[calc(100vh-160px)] px-2 sm:px-4 pt-6">
        <CardPanel className="w-full max-w-[98vw] h-auto min-h-[70vh] flex !px-3 sm:!px-6 md:!px-10 mx-auto">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-3 sm:!p-4 md:!p-6 flex flex-col gap-4">
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold">{t("gameSummaryTitle")}</h1>
              {!summary ? (
                <p className="text-sm text-red-500">{t("gameSummaryNoData")}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t("gameSummaryWinner")}:{" "}
                    <span className="font-semibold">{winnerLabel}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t("gameSummaryFinalScore")}: {summary.playerScore} - {summary.opponentScore}
                  </p>
                  {summary.mode === "humans" && summary.roomCode ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("room")}: {summary.roomCode}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {summary ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                      <th className="text-left py-2">{t("gameSummaryRound")}</th>
                      <th className="text-left py-2">{t("gameSummaryPlayerMove")}</th>
                      <th className="text-left py-2">{t("gameSummaryOpponentMove")}</th>
                      <th className="text-left py-2">{t("gameSummaryOutcome")}</th>
                      <th className="text-left py-2">{t("gameSummaryPointsDelta")}</th>
                      <th className="text-left py-2">{t("gameSummaryScoreAfter")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.rounds.map((round) => {
                      const outcomeText =
                        round.outcome === "WIN"
                          ? t("gameSummaryOutcomeWin")
                          : round.outcome === "LOSE"
                            ? t("gameSummaryOutcomeLose")
                            : t("gameSummaryOutcomeDraw");
                      return (
                        <tr key={`${round.roundNumber}-${round.playerMove}-${round.opponentMove}`} className="border-b border-gray-200 dark:border-gray-800">
                          <td className="py-2">{round.roundNumber}</td>
                          <td className="py-2">{toMoveLabel(round.playerMove, t)}</td>
                          <td className="py-2">{toMoveLabel(round.opponentMove, t)}</td>
                          <td className="py-2">{outcomeText}</td>
                          <td className="py-2">
                            <span className="text-green-600 dark:text-green-400">
                              +{round.playerDelta}
                            </span>{" "}
                            /{" "}
                            <span className="text-red-600 dark:text-red-400">
                              -{round.opponentDelta}
                            </span>
                          </td>
                          <td className="py-2">{round.playerScore} - {round.opponentScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <button
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  clearGameSummary();
                  router.push("/play-vs-humans");
                }}
              >
                {t("playVsHumans")}
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
                onClick={() => {
                  clearGameSummary();
                  router.push("/play-vs-bot");
                }}
              >
                {t("playVsBots")}
              </button>
            </div>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}
