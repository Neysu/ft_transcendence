import { prisma } from "../prisma";
import type { Move } from "../game/RPS";

const MOVES: Move[] = ["ROCK", "PAPER", "SCISSORS"];

type MovePercentRow = {
  move: Move;
  count: number;
  percentage: number;
};

export type UserMoveStats = {
  userId: number;
  userTable: MovePercentRow[];
  averageTable: MovePercentRow[];
  comparisonTable: Array<{
    move: Move;
    userPercentage: number;
    averagePercentage: number;
    deltaPercentage: number;
  }>;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function emptyCounts(): Record<Move, number> {
  return { ROCK: 0, PAPER: 0, SCISSORS: 0 };
}

function fillCounts(
  counts: Record<Move, number>,
  rows: Array<{ move: string | null; count: number }>,
) {
  for (const row of rows) {
    if (row.move === "ROCK" || row.move === "PAPER" || row.move === "SCISSORS") {
      counts[row.move] += row.count;
    }
  }
}

function toTable(counts: Record<Move, number>): MovePercentRow[] {
  const total = MOVES.reduce((acc, move) => acc + counts[move], 0);
  return MOVES.map((move) => ({
    move,
    count: counts[move],
    percentage: total === 0 ? 0 : round2((counts[move] / total) * 100),
  }));
}

export async function getUserMoveStats(
  userId: number,
  options?: { excludeUserId?: number },
): Promise<UserMoveStats> {
  const excludeUserId = options?.excludeUserId;

  const [userAsP1, userAsP2, avgAsP1, avgAsP2] = await Promise.all([
    prisma.round.groupBy({
      by: ["playerOneMove"],
      where: {
        game: { playerOneId: userId },
        playerOneMove: { in: MOVES },
        playerTwoMove: { in: MOVES },
      },
      _count: { _all: true },
    }),
    prisma.round.groupBy({
      by: ["playerTwoMove"],
      where: {
        game: { playerTwoId: userId },
        playerTwoMove: { in: MOVES },
        playerOneMove: { in: MOVES },
      },
      _count: { _all: true },
    }),
    prisma.round.groupBy({
      by: ["playerOneMove"],
      where: {
        playerOneMove: { in: MOVES },
        playerTwoMove: { in: MOVES },
        ...(excludeUserId ? { game: { playerOneId: { not: excludeUserId } } } : {}),
      },
      _count: { _all: true },
    }),
    prisma.round.groupBy({
      by: ["playerTwoMove"],
      where: {
        playerTwoMove: { in: MOVES },
        playerOneMove: { in: MOVES },
        ...(excludeUserId ? { game: { playerTwoId: { not: excludeUserId } } } : {}),
      },
      _count: { _all: true },
    }),
  ]);

  const userCounts = emptyCounts();
  fillCounts(
    userCounts,
    userAsP1.map((row) => ({ move: row.playerOneMove, count: row._count._all })),
  );
  fillCounts(
    userCounts,
    userAsP2.map((row) => ({ move: row.playerTwoMove, count: row._count._all })),
  );

  const averageCounts = emptyCounts();
  fillCounts(
    averageCounts,
    avgAsP1.map((row) => ({ move: row.playerOneMove, count: row._count._all })),
  );
  fillCounts(
    averageCounts,
    avgAsP2.map((row) => ({ move: row.playerTwoMove, count: row._count._all })),
  );

  const userTable = toTable(userCounts);
  const averageTable = toTable(averageCounts);

  const averageByMove: Record<Move, number> = { ROCK: 0, PAPER: 0, SCISSORS: 0 };
  for (const row of averageTable) averageByMove[row.move] = row.percentage;

  const comparisonTable = userTable.map((row) => ({
    move: row.move,
    userPercentage: row.percentage,
    averagePercentage: averageByMove[row.move],
    deltaPercentage: round2(row.percentage - averageByMove[row.move]),
  }));

  return {
    userId,
    userTable,
    averageTable,
    comparisonTable,
  };
}
