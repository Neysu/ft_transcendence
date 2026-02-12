export type SummaryMode = "bot" | "humans";

export type SummaryMove = "ROCK" | "PAPER" | "SCISSORS";

export type SummaryOutcome = "WIN" | "LOSE" | "DRAW";

export type SummaryWinner = "PLAYER" | "OPPONENT" | "DRAW";

export type SummaryRound = {
  roundNumber: number;
  playerMove: SummaryMove;
  opponentMove: SummaryMove;
  outcome: SummaryOutcome;
  playerDelta: number;
  opponentDelta: number;
  playerScore: number;
  opponentScore: number;
};

export type GameSummary = {
  mode: SummaryMode;
  roomCode?: string;
  winner: SummaryWinner;
  playerScore: number;
  opponentScore: number;
  rounds: SummaryRound[];
  finishedAt: string;
};

export const GAME_SUMMARY_STORAGE_KEY = "game-summary:last";

export function saveGameSummary(summary: GameSummary) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GAME_SUMMARY_STORAGE_KEY, JSON.stringify(summary));
}

export function loadGameSummary(): GameSummary | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(GAME_SUMMARY_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameSummary;
  } catch {
    return null;
  }
}

export function clearGameSummary() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GAME_SUMMARY_STORAGE_KEY);
}

