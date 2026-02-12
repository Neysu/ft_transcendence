"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { RPSChoice, type Choice } from "@/components/atoms/RPSChoice";
import { RPSOpponent } from "@/components/atoms/RPSOpponent";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { saveGameSummary, type SummaryRound, type SummaryWinner } from "@/lib/gameSummary";
import { getGameWsErrorKey, mapGameWsErrorMessage } from "@/lib/gameWsErrors";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCallback, useEffect, useRef, useState } from "react";

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

function toOutcomeFromPerspective(
  outcome: "PLAYER1" | "PLAYER2" | "DRAW",
  isPlayerOne: boolean,
): SummaryRound["outcome"] {
  if (outcome === "DRAW") return "DRAW";
  if (isPlayerOne) {
    return outcome === "PLAYER1" ? "WIN" : "LOSE";
  }
  return outcome === "PLAYER2" ? "WIN" : "LOSE";
}

function getWinnerFromScores(playerScore: number, opponentScore: number): SummaryWinner {
  if (playerScore > opponentScore) return "PLAYER";
  if (opponentScore > playerScore) return "OPPONENT";
  return "DRAW";
}

export default function PlayVsPlayersPage() {
  useRequireAuth();
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
  const roomCreatedRef = useRef(false);
  const roomJoinedRef = useRef(false);
  const redirectedToCreateRef = useRef(false);
  const redirectedToJoinRef = useRef(false);
  const pendingSnapshotRef = useRef<{
    game: WsGameState;
    round: WsRoundState;
    resolved: boolean;
  } | null>(null);
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeGameIdRef = useRef<number | null>(null);
  const scoreRef = useRef<{ player: number; opponent: number }>({ player: 0, opponent: 0 });
  const roundHistoryRef = useRef<SummaryRound[]>([]);
  const seenResolvedRoundIdsRef = useRef<Set<number>>(new Set());
  const choiceSize = "clamp(84px, 20vw, 160px)";
  const opponentSize = "clamp(80px, 18vw, 160px)";

  const roomCode =
    typeof params.room === "string"
      ? decodeURIComponent(params.room)
      : Array.isArray(params.room)
        ? decodeURIComponent(params.room[0] ?? "")
        : "";
  const mode = searchParams.get("mode") === "create" ? "create" : "join";
  const authToken = getToken();
  const blockingRoomError = !authToken
    ? t("missingAuthToken")
    : !roomCode
      ? t("missingRoomCode")
      : "";
  const displayedRoomError = blockingRoomError || roomError;

  const redirectBackToRoomForm = useCallback((kind: "create" | "join", reason?: string) => {
    const alreadyRedirected = kind === "create" ? redirectedToCreateRef : redirectedToJoinRef;
    if (alreadyRedirected.current) {
      return;
    }
    alreadyRedirected.current = true;

    const params = new URLSearchParams();
    const errorKey = getGameWsErrorKey(reason);
    if (errorKey) {
      params.set("errorKey", errorKey);
    } else if (reason) {
      params.set("errorMessage", reason);
    }
    if (roomCode) {
      params.set("room", roomCode);
    }
    const target =
      kind === "create"
        ? "/play-vs-humans/create-room"
        : "/play-vs-humans/join-room";
    router.replace(`${target}?${params.toString()}`);
  }, [roomCode, router]);

  const applySnapshot = (game: WsGameState, round: WsRoundState, resolved: boolean) => {
    const currentUserId = currentUserIdRef.current;
    if (!currentUserId) {
      pendingSnapshotRef.current = { game, round, resolved };
      return;
    }

    setGameId(game.id);
    activeGameIdRef.current = game.id;
    setGameStatus(game.status);
    if (currentUserId === game.playerOneId) {
      setPlayerScore(game.playerOneScore);
      setOpponentScore(game.playerTwoScore);
      scoreRef.current = { player: game.playerOneScore, opponent: game.playerTwoScore };
      if (resolved) {
        setPlayerChoice(toChoice(round.playerOneMove));
        setOpponentChoice(toChoice(round.playerTwoMove));
      }
    } else if (currentUserId === game.playerTwoId) {
      setPlayerScore(game.playerTwoScore);
      setOpponentScore(game.playerOneScore);
      scoreRef.current = { player: game.playerTwoScore, opponent: game.playerOneScore };
      if (resolved) {
        setPlayerChoice(toChoice(round.playerTwoMove));
        setOpponentChoice(toChoice(round.playerOneMove));
      }
    }
  };

  useEffect(() => {
    if (blockingRoomError) {
      return;
    }

    roomCreatedRef.current = false;
    roomJoinedRef.current = false;
    redirectedToCreateRef.current = false;
    redirectedToJoinRef.current = false;
    const ws = new WebSocket(getWsUrl(authToken), authToken);
    socketRef.current = ws;

    ws.onopen = () => {
      setRoomStatus(mode === "create" ? t("creatingRoom") : t("joiningRoom"));
      const message =
        mode === "create"
          ? { type: "createRoom", roomCode }
          : { type: "joinRoom", roomCode };
      ws.send(JSON.stringify(message));
      if (mode === "join") {
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
        }
        joinTimeoutRef.current = setTimeout(() => {
          setRoomError(t("roomNotFound"));
          redirectBackToRoomForm("join", "Room not found");
          ws.close(1000, "Room not found");
        }, 3000);
      }
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
        roomCreatedRef.current = true;
        setRoomStatus(t("roomCreatedWaiting"));
        setRoomError("");
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
        return;
      }

      if (message.type === "roomJoined" || message.type === "gameState") {
        if (activeGameIdRef.current !== message.game.id) {
          roundHistoryRef.current = [];
          seenResolvedRoundIdsRef.current.clear();
        }
        roomCreatedRef.current = true;
        roomJoinedRef.current = true;
        setRoomStatus("");
        setRoomError("");
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
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

        const currentUserId = currentUserIdRef.current;
        if (currentUserId) {
          const isPlayerOne = currentUserId === message.game.playerOneId;
          const playerMove = isPlayerOne ? message.round.playerOneMove : message.round.playerTwoMove;
          const opponentMove = isPlayerOne
            ? message.round.playerTwoMove
            : message.round.playerOneMove;
          const nextPlayerScore = isPlayerOne ? message.game.playerOneScore : message.game.playerTwoScore;
          const nextOpponentScore = isPlayerOne ? message.game.playerTwoScore : message.game.playerOneScore;
          const prevPlayerScore = scoreRef.current.player;
          const prevOpponentScore = scoreRef.current.opponent;

          if (
            playerMove &&
            opponentMove &&
            !seenResolvedRoundIdsRef.current.has(message.round.id)
          ) {
            seenResolvedRoundIdsRef.current.add(message.round.id);
            roundHistoryRef.current = [
              ...roundHistoryRef.current,
              {
                roundNumber: message.round.roundNumber,
                playerMove,
                opponentMove,
                outcome: toOutcomeFromPerspective(message.outcome, isPlayerOne),
                playerDelta: Math.max(0, nextPlayerScore - prevPlayerScore),
                opponentDelta: Math.max(0, nextOpponentScore - prevOpponentScore),
                playerScore: nextPlayerScore,
                opponentScore: nextOpponentScore,
              },
            ];
          }
        }

        applySnapshot(message.game, message.round, true);

        if (message.game.status === "FINISHED") {
          const finalPlayerScore = scoreRef.current.player;
          const finalOpponentScore = scoreRef.current.opponent;
          saveGameSummary({
            mode: "humans",
            roomCode,
            winner: getWinnerFromScores(finalPlayerScore, finalOpponentScore),
            playerScore: finalPlayerScore,
            opponentScore: finalOpponentScore,
            rounds: roundHistoryRef.current,
            finishedAt: new Date().toISOString(),
          });
          router.push("/game-summary");
          return;
        }
        return;
      }

      if (message.type === "error") {
        const errorKey = getGameWsErrorKey(message.message);
        const mappedError = mapGameWsErrorMessage(t, message.message);
        if (errorKey === "gameFinished") {
          setRoomError("");
          setGameStatus("FINISHED");
        } else {
          setRoomError(mappedError);
        }
        setIsWaitingForOpponent(false);
        setPendingChoice(null);
        if (mode === "create" && !roomCreatedRef.current) {
          redirectBackToRoomForm("create", message.message);
          return;
        }
        if (mode === "join" && !roomJoinedRef.current) {
          redirectBackToRoomForm("join", message.message);
          return;
        }
      }
    };

    ws.onclose = (event) => {
      socketRef.current = null;
      setIsWaitingForOpponent(false);
      if (event.reason) {
        const errorKey = getGameWsErrorKey(event.reason);
        const mappedError = mapGameWsErrorMessage(t, event.reason);
        if (errorKey === "gameFinished") {
          setRoomError("");
          setGameStatus("FINISHED");
        } else {
          setRoomError(mappedError);
        }
        if (mode === "create" && !roomCreatedRef.current) {
          redirectBackToRoomForm("create", event.reason);
          return;
        }
        if (mode === "join" && !roomJoinedRef.current) {
          redirectBackToRoomForm("join", event.reason);
          return;
        }
      }
    };

    return () => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
      ws.close();
    };
  }, [authToken, blockingRoomError, mode, redirectBackToRoomForm, roomCode, router, t]);

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
              {displayedRoomError && gameStatus !== "FINISHED" ? (
                <p className="text-xs text-red-500">{displayedRoomError}</p>
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
