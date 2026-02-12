"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { RPSChoice, type Choice } from "@/components/atoms/RPSChoice";
import { RPSOpponent } from "@/components/atoms/RPSOpponent";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type BotGameState = {
  id: number;
  playerOneId: number;
  playerTwoId: number;
  playerOneScore: number;
  playerTwoScore: number;
  round: number;
  status: "ONGOING" | "FINISHED";
  finishedAt: string | null;
};

type BotRoundState = {
  id: number;
  roundNumber: number;
  playerOneMove: "ROCK" | "PAPER" | "SCISSORS" | null;
  playerTwoMove: "ROCK" | "PAPER" | "SCISSORS" | null;
  winnerId: number | null;
};

type BotMoveResponse = {
  game: BotGameState;
  round: BotRoundState;
  outcome: "PLAYER1" | "PLAYER2" | "DRAW";
  nextRound: BotRoundState | null;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
}

function getApiBase() {
  if (typeof window === "undefined") return "http://localhost:3000";
  return process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
}

function toChoice(move: BotRoundState["playerTwoMove"]): Choice | null {
  if (move === "ROCK") return "rock";
  if (move === "PAPER") return "paper";
  if (move === "SCISSORS") return "scissors";
  return null;
}

export default function PlayVsBotPage() {
  useRequireAuth();
  const { t } = useLanguage();
  const tRef = useRef(t);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [isWaitingForBot, setIsWaitingForBot] = useState<boolean>(false);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [gameId, setGameId] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<BotGameState["status"]>("ONGOING");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const choiceSize = "clamp(84px, 20vw, 160px)";
  const opponentSize = "clamp(80px, 18vw, 160px)";

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setErrorMessage(tRef.current("missingAuthToken"));
      return;
    }

    const createGame = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await fetch(`${getApiBase()}/api/game/bot/create`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const body = (await response.json()) as { message?: string };
          setErrorMessage(body.message || "Failed to create bot game");
          setGameStatus("FINISHED");
          return;
        }
        const data = (await response.json()) as { game: BotGameState; round: BotRoundState };
        setGameId(data.game.id);
        setGameStatus(data.game.status);
        setPlayerScore(data.game.playerOneScore);
        setOpponentScore(data.game.playerTwoScore);
      } catch {
        setErrorMessage("Failed to create bot game");
        setGameStatus("FINISHED");
      } finally {
        setIsLoading(false);
      }
    };

    createGame();
  }, []);

  const handlePlayerChoice = (choice: Choice) => {
    if (gameStatus === "FINISHED") {
      return;
    }
    if (playerChoice || isWaitingForBot || !gameId) {
      return;
    }
    setPendingChoice(choice);
  };

  const handleValidateChoice = async () => {
    if (gameStatus === "FINISHED") {
      return;
    }
    if (!pendingChoice || !gameId) {
      return;
    }
    const token = getToken();
    if (!token) {
      setErrorMessage(t("missingAuthToken"));
      return;
    }

    try {
      setIsWaitingForBot(true);
      const move =
        pendingChoice === "rock" ? "ROCK" : pendingChoice === "paper" ? "PAPER" : "SCISSORS";
      const response = await fetch(`${getApiBase()}/api/game/bot/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId, move }),
      });
      const data = (await response.json()) as BotMoveResponse & { status?: string; message?: string };
      if (!response.ok || data.status === "error") {
        setErrorMessage(data.message || "Failed to play round");
        setGameStatus("FINISHED");
        return;
      }
      setGameStatus(data.game.status);
      setPlayerScore(data.game.playerOneScore);
      setOpponentScore(data.game.playerTwoScore);
      setPlayerChoice(pendingChoice);
      setOpponentChoice(toChoice(data.round.playerTwoMove));
      setPendingChoice(null);
    } catch {
      setErrorMessage("Failed to play round");
      setGameStatus("FINISHED");
    } finally {
      setIsWaitingForBot(false);
    }
  };

  const handlePlayAgain = async () => {
    if (gameStatus === "FINISHED") {
      const token = getToken();
      if (!token) {
        setErrorMessage(t("missingAuthToken"));
        return;
      }
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await fetch(`${getApiBase()}/api/game/bot/create`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          setErrorMessage("Failed to create bot game");
          return;
        }
        const data = (await response.json()) as { game: BotGameState; round: BotRoundState };
        setGameId(data.game.id);
        setGameStatus(data.game.status);
        setPlayerScore(data.game.playerOneScore);
        setOpponentScore(data.game.playerTwoScore);
      } catch {
        setErrorMessage("Failed to create bot game");
      } finally {
        setIsLoading(false);
      }
    }
    setPlayerChoice(null);
    setPendingChoice(null);
    setOpponentChoice(null);
    setIsWaitingForBot(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      <div className="flex items-start justify-center min-h-[calc(100vh-160px)] px-2 sm:px-4 pt-4">
        <CardPanel className="w-full max-w-[98vw] h-auto min-h-[72vh] flex !px-3 sm:!px-6 md:!px-12 mx-auto">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-3 sm:!p-4 md:!p-7 flex flex-col items-center justify-between gap-5">
            <div className="flex flex-col items-center gap-1 -mt-1">
              <h1 className="text-lg sm:text-xl font-bold text-center">{t("playVsBots")}</h1>
              {isLoading ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("creatingGame")}</p>
              ) : null}
              {errorMessage ? (
                <p className="text-xs text-red-500">{errorMessage}</p>
              ) : null}
              {gameStatus === "FINISHED" ? (
                <p className="text-xs text-green-600 dark:text-green-400">{t("gameFinished")}</p>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-3 -mt-2 sm:-mt-4 md:-mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t("botChoice")}:</p>
              <RPSOpponent
                size={opponentSize}
                isLoading={isWaitingForBot}
                opponentChoice={opponentChoice}
              />
            </div>

            <div className="flex flex-col items-center gap-4 w-full relative">
              <div className="flex justify-between items-center w-full max-w-md px-2 sm:px-0">
                <div className="flex flex-col items-center">
                  <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-600 dark:text-green-400">{playerScore}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("you")}</p>
                </div>

                <div className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">{t("vs")}</div>

                <div className="flex flex-col items-center">
                  <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-red-600 dark:text-red-400">{opponentScore}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("bot")}</p>
                </div>
              </div>

              <div className="h-10 flex items-center justify-center mt-4 gap-3">
                <button
                  onClick={handleValidateChoice}
                  className={`px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors ${
                    pendingChoice && !playerChoice ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  {t("validate")}
                </button>
                <button
                  onClick={handlePlayAgain}
                  className={`px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors ${playerChoice ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  {t("playAgain")}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t("yourChoice")}:</p>
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                <div className={playerChoice ? "pointer-events-none opacity-60" : ""}>
                  <RPSChoice size={choiceSize} choice="rock" onClick={handlePlayerChoice} />
                </div>
                <div className={playerChoice ? "pointer-events-none opacity-60" : ""}>
                  <RPSChoice size={choiceSize} choice="paper" onClick={handlePlayerChoice} />
                </div>
                <div className={playerChoice ? "pointer-events-none opacity-60" : ""}>
                  <RPSChoice size={choiceSize} choice="scissors" onClick={handlePlayerChoice} />
                </div>
              </div>
            </div>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}
