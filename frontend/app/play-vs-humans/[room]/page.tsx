"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { RPSChoice, type Choice } from "@/components/atoms/RPSChoice";
import { RPSOpponent } from "@/components/atoms/RPSOpponent";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type WsGameState = {
  id: number;
  playerOneId: number;
  playerTwoId: number;
  playerOneScore: number;
  playerTwoScore: number;
  round: number;
  status: "ONGOING" | "FINISHED";
  finishedAt: string | null;
};

type WsRoundState = {
  id: number;
  roundNumber: number;
  playerOneMove: "ROCK" | "PAPER" | "SCISSORS" | null;
  playerTwoMove: "ROCK" | "PAPER" | "SCISSORS" | null;
  winnerId: number | null;
};

type WsMessage =
  | { type: "registered"; userId: number }
  | { type: "roomCreated"; roomCode: string }
  | { type: "roomJoined"; roomCode: string; game: WsGameState; round: WsRoundState }
  | { type: "gameState"; game: WsGameState; round: WsRoundState }
  | { type: "moveAccepted"; gameId: number; roundId: number }
  | { type: "roundResolved"; game: WsGameState; round: WsRoundState; outcome: "PLAYER1" | "PLAYER2" | "DRAW"; nextRound?: WsRoundState | null }
  | { type: "error"; message: string };

function toChoice(move: WsRoundState["playerOneMove"]): Choice | null {
  if (move === "ROCK") return "rock";
  if (move === "PAPER") return "paper";
  if (move === "SCISSORS") return "scissors";
  return null;
}

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
}

function getWsUrl(token: string) {
  if (typeof window === "undefined") {
    return "ws://localhost:3000/ws/game";
  }
  const fallbackOrigin = window.location.origin;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || fallbackOrigin;
  const base = new URL(baseUrl);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws/game";
  base.search = token ? `?token=${encodeURIComponent(token)}` : "";
  return base.toString();
}

export default function PlayVsPlayersPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState<boolean>(false);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [roomStatus, setRoomStatus] = useState<string>("");
  const [roomError, setRoomError] = useState<string>("");
  const [gameId, setGameId] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<WsGameState["status"]>("ONGOING");
  const socketRef = useRef<WebSocket | null>(null);
  const currentUserIdRef = useRef<number | null>(null);
  const pendingSnapshotRef = useRef<{
    game: WsGameState;
    round: WsRoundState;
    resolved: boolean;
  } | null>(null);
  const choiceSize = "clamp(84px, 20vw, 160px)";
  const opponentSize = "clamp(80px, 18vw, 160px)";

  const roomCode =
    typeof params.room === "string"
      ? decodeURIComponent(params.room)
      : Array.isArray(params.room)
        ? decodeURIComponent(params.room[0] ?? "")
        : "";
  const mode = searchParams.get("mode") === "create" ? "create" : "join";

  const applySnapshot = (game: WsGameState, round: WsRoundState, resolved: boolean) => {
    const currentUserId = currentUserIdRef.current;
    if (!currentUserId) {
      pendingSnapshotRef.current = { game, round, resolved };
      return;
    }

    setGameId(game.id);
    setGameStatus(game.status);
    if (currentUserId === game.playerOneId) {
      setPlayerScore(game.playerOneScore);
      setOpponentScore(game.playerTwoScore);
      if (resolved) {
        setPlayerChoice(toChoice(round.playerOneMove));
        setOpponentChoice(toChoice(round.playerTwoMove));
      }
    } else if (currentUserId === game.playerTwoId) {
      setPlayerScore(game.playerTwoScore);
      setOpponentScore(game.playerOneScore);
      if (resolved) {
        setPlayerChoice(toChoice(round.playerTwoMove));
        setOpponentChoice(toChoice(round.playerOneMove));
      }
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setRoomError(t("missingAuthToken"));
      return;
    }
    if (!roomCode) {
      setRoomError(t("missingRoomCode"));
      return;
    }

    setRoomStatus(mode === "create" ? t("creatingRoom") : t("joiningRoom"));
    const ws = new WebSocket(getWsUrl(token), token);
    socketRef.current = ws;

    ws.onopen = () => {
      const message =
        mode === "create"
          ? { type: "createRoom", roomCode }
          : { type: "joinRoom", roomCode };
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      let message: WsMessage;
      try {
        message = JSON.parse(event.data) as WsMessage;
      } catch {
        return;
      }

      if (message.type === "registered") {
        currentUserIdRef.current = message.userId;
        if (pendingSnapshotRef.current) {
          const snapshot = pendingSnapshotRef.current;
          pendingSnapshotRef.current = null;
          applySnapshot(snapshot.game, snapshot.round, snapshot.resolved);
        }
        return;
      }

      if (message.type === "roomCreated") {
        setRoomStatus(t("roomCreatedWaiting"));
        setRoomError("");
        return;
      }

      if (message.type === "roomJoined" || message.type === "gameState") {
        setRoomStatus("");
        setRoomError("");
        setPlayerChoice(null);
        setPendingChoice(null);
        setOpponentChoice(null);
        setIsWaitingForOpponent(false);
        applySnapshot(message.game, message.round, false);
        return;
      }

      if (message.type === "moveAccepted") {
        setIsWaitingForOpponent(true);
        return;
      }

      if (message.type === "roundResolved") {
        setIsWaitingForOpponent(false);
        setPendingChoice(null);
        applySnapshot(message.game, message.round, true);
        return;
      }

      if (message.type === "error") {
        setRoomError(message.message);
        setIsWaitingForOpponent(false);
        setPendingChoice(null);
      }
    };

    ws.onclose = () => {
      socketRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, [roomCode, mode]);

  const handlePlayerChoice = (choice: Choice) => {
    if (gameStatus === "FINISHED") {
      return;
    }
    if (playerChoice || isWaitingForOpponent || !gameId) {
      return;
    }
    setPendingChoice(choice);
  };

  const handleValidateChoice = () => {
    if (gameStatus === "FINISHED") {
      return;
    }
    if (!pendingChoice || isWaitingForOpponent || !gameId) {
      return;
    }
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setRoomError(t("connectionNotReady"));
      return;
    }
    const move =
      pendingChoice === "rock" ? "ROCK" : pendingChoice === "paper" ? "PAPER" : "SCISSORS";
    socketRef.current?.send(JSON.stringify({ type: "move", gameId, move }));
    setPlayerChoice(pendingChoice);
    setIsWaitingForOpponent(true);
  };

  const handlePlayAgain = () => {
    if (gameStatus === "FINISHED") {
      return;
    }
    setPlayerChoice(null);
    setPendingChoice(null);
    setOpponentChoice(null);
    setIsWaitingForOpponent(false);
    // Scores are NOT reset here - they persist across rounds
    // Scores only reset when user leaves the page
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
            <div className="flex flex-col items-center gap-1 -mt-1">
              <h1 className="text-lg sm:text-xl font-bold text-center">{t("playVsPlayers")}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("room")}: {roomCode}
              </p>
              {roomStatus ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">{roomStatus}</p>
              ) : null}
              {roomError ? (
                <p className="text-xs text-red-500">{roomError}</p>
              ) : null}
              {gameStatus === "FINISHED" ? (
                <p className="text-xs text-green-600 dark:text-green-400">{t("gameFinished")}</p>
              ) : null}
            </div>

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
                <div className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">{t("vs")}</div>

                {/* Opponent Score - Right */}
                <div className="flex flex-col items-center">
                  <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-red-600 dark:text-red-400">{opponentScore}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("opponent")}</p>
                </div>
              </div>

              {/* Play Again Button */}
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

            {/* BOTTOM: Player's choices */}
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
