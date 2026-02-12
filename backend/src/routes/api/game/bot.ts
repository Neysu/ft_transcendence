import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../../../lib/prisma";
import { RPSGame, type Move } from "../../../lib/game/RPS";
import { parseOrReply } from "../../../lib/api/validation";
import { authMiddleware } from "../../../middleware/auth";
import { BotMoveSchema } from "../../../lib/api/schemasZod";
import { getUserMoveStats } from "../../../lib/api/botMoveStats";

type UserTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const BOT_USERNAME = "rps_bot";
const BOT_EMAIL = "rps_bot@local";
const BOT_PASSWORD = "rps_bot";
const BOT_MOVES: Move[] = ["ROCK", "PAPER", "SCISSORS"];
const BOT_LEARNING_SAMPLE_SIZE = 20;
const BOT_MAX_MOVE_CHANCE = 50;
const WINNING_SCORE = 2;

class BotMoveClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotMoveClientError";
  }
}

function pickWeightedMove(weights: Record<Move, number>): Move {
  const sanitized: Record<Move, number> = {
    ROCK: Math.max(0, Number.isFinite(weights.ROCK) ? weights.ROCK : 0),
    PAPER: Math.max(0, Number.isFinite(weights.PAPER) ? weights.PAPER : 0),
    SCISSORS: Math.max(0, Number.isFinite(weights.SCISSORS) ? weights.SCISSORS : 0),
  };
  const total = sanitized.ROCK + sanitized.PAPER + sanitized.SCISSORS;
  if (total <= 0) {
    return RPSGame.getWeightedAIMove();
  }

  let roll = Math.random() * total;
  if (roll < sanitized.ROCK) return "ROCK";
  roll -= sanitized.ROCK;
  if (roll < sanitized.PAPER) return "PAPER";
  return "SCISSORS";
}

function normalizeToPercentages(weights: Record<Move, number>): Record<Move, number> {
  const sanitized: Record<Move, number> = {
    ROCK: Math.max(0, Number.isFinite(weights.ROCK) ? weights.ROCK : 0),
    PAPER: Math.max(0, Number.isFinite(weights.PAPER) ? weights.PAPER : 0),
    SCISSORS: Math.max(0, Number.isFinite(weights.SCISSORS) ? weights.SCISSORS : 0),
  };
  const total = BOT_MOVES.reduce((acc, move) => acc + sanitized[move], 0);
  if (total <= 0) {
    return { ROCK: 100 / 3, PAPER: 100 / 3, SCISSORS: 100 / 3 };
  }
  return {
    ROCK: (sanitized.ROCK / total) * 100,
    PAPER: (sanitized.PAPER / total) * 100,
    SCISSORS: (sanitized.SCISSORS / total) * 100,
  };
}

function capPercentages(percentages: Record<Move, number>, maxChance: number): Record<Move, number> {
  const capped: Record<Move, number> = { ...percentages };

  for (let i = 0; i < 6; i += 1) {
    let excess = 0;
    for (const move of BOT_MOVES) {
      if (capped[move] > maxChance) {
        excess += capped[move] - maxChance;
        capped[move] = maxChance;
      }
    }

    if (excess <= 0.0001) break;

    const eligible = BOT_MOVES.filter((move) => capped[move] < maxChance - 0.0001);
    if (eligible.length === 0) break;

    const eligibleTotal = eligible.reduce((acc, move) => acc + capped[move], 0);
    if (eligibleTotal <= 0.0001) {
      const share = excess / eligible.length;
      for (const move of eligible) {
        capped[move] += share;
      }
      continue;
    }

    for (const move of eligible) {
      capped[move] += excess * (capped[move] / eligibleTotal);
    }
  }

  return capped;
}

async function getAdaptiveBotMove(userId: number, botId: number): Promise<Move> {
  const stats = await getUserMoveStats(userId, { excludeUserId: botId });

  const userByMove: Record<Move, number> = { ROCK: 0, PAPER: 0, SCISSORS: 0 };
  const avgByMove: Record<Move, number> = { ROCK: 33.33, PAPER: 33.33, SCISSORS: 33.33 };

  for (const row of stats.userTable) userByMove[row.move] = row.percentage;
  const averageTotalMoves = stats.averageTable.reduce((acc, row) => acc + row.count, 0);
  if (averageTotalMoves > 0) {
    for (const row of stats.averageTable) avgByMove[row.move] = row.percentage;
  }

  const userTotalMoves = stats.userTable.reduce((acc, row) => acc + row.count, 0);
  const confidence = Math.min(1, userTotalMoves / BOT_LEARNING_SAMPLE_SIZE);

  const predictedOpponent: Record<Move, number> = {
    ROCK: userByMove.ROCK * confidence + avgByMove.ROCK * (1 - confidence),
    PAPER: userByMove.PAPER * confidence + avgByMove.PAPER * (1 - confidence),
    SCISSORS: userByMove.SCISSORS * confidence + avgByMove.SCISSORS * (1 - confidence),
  };

  // Bot move weights are mapped to the move they beat.
  const botWeights: Record<Move, number> = {
    ROCK: predictedOpponent.SCISSORS + 5,
    PAPER: predictedOpponent.ROCK + 5,
    SCISSORS: predictedOpponent.PAPER + 5,
  };

  const normalized = normalizeToPercentages(botWeights);
  const capped = capPercentages(normalized, BOT_MAX_MOVE_CHANCE);
  return pickWeightedMove(capped);
}

type GameState = {
  id: number;
  playerOneId: number;
  playerTwoId: number;
  playerOneScore: number;
  playerTwoScore: number;
  round: number;
  status: "ONGOING" | "FINISHED";
  finishedAt: string | null;
};

type RoundState = {
  id: number;
  roundNumber: number;
  playerOneMove: Move | null;
  playerTwoMove: Move | null;
  winnerId: number | null;
};

function toGameState(game: {
  id: number;
  playerOneId: number;
  playerTwoId: number;
  playerOneScore: number;
  playerTwoScore: number;
  round: number;
  status: "ONGOING" | "FINISHED";
  finishedAt: Date | null;
}): GameState {
  return {
    id: game.id,
    playerOneId: game.playerOneId,
    playerTwoId: game.playerTwoId,
    playerOneScore: game.playerOneScore,
    playerTwoScore: game.playerTwoScore,
    round: game.round,
    status: game.status,
    finishedAt: game.finishedAt ? game.finishedAt.toISOString() : null,
  };
}

function toRoundState(round: {
  id: number;
  roundNumber: number;
  playerOneMove: string | null;
  playerTwoMove: string | null;
  winnerId: number | null;
}): RoundState {
  const playerOneMove =
    round.playerOneMove === "ROCK" || round.playerOneMove === "PAPER" || round.playerOneMove === "SCISSORS"
      ? round.playerOneMove
      : null;
  const playerTwoMove =
    round.playerTwoMove === "ROCK" || round.playerTwoMove === "PAPER" || round.playerTwoMove === "SCISSORS"
      ? round.playerTwoMove
      : null;
  return {
    id: round.id,
    roundNumber: round.roundNumber,
    playerOneMove,
    playerTwoMove,
    winnerId: round.winnerId,
  };
}

async function getOrCreateBotId() {
  const existing = await prisma.user.findUnique({
    where: { username: BOT_USERNAME },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const hashed = await bcrypt.hash(BOT_PASSWORD, 10);
    const created = await prisma.user.create({
      data: {
        username: BOT_USERNAME,
        email: BOT_EMAIL,
        password: hashed,
      },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      const retry = await prisma.user.findUnique({
        where: { username: BOT_USERNAME },
        select: { id: true },
      });
      if (retry) return retry.id;
    }
    throw error;
  }
}

export async function botGameRoute(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    fastify.post(
      "/bot/create",
      { preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const authUser = (request as { user?: { id?: number } }).user;
          const authUserId = authUser?.id;
          if (typeof authUserId !== "number") {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const botId = await getOrCreateBotId();
          const created = await prisma.$transaction(async (tx: UserTx) => {
            const game = await tx.game.create({
              data: { playerOneId: authUserId, playerTwoId: botId },
              select: {
                id: true,
                playerOneId: true,
                playerTwoId: true,
                playerOneScore: true,
                playerTwoScore: true,
                round: true,
                status: true,
                finishedAt: true,
              },
            });
            const round = await tx.round.create({
              data: { gameId: game.id, roundNumber: 1 },
              select: {
                id: true,
                roundNumber: true,
                playerOneMove: true,
                playerTwoMove: true,
                winnerId: true,
              },
            });
            return { game, round };
          });

          return {
            game: toGameState(created.game),
            round: toRoundState(created.round),
          };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to create bot game");
          reply.code(500);
          return { status: "error", message: "Failed to create bot game" };
        }
      }
    );

    fastify.post(
      "/bot/move",
      { preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const body = parseOrReply(BotMoveSchema, request.body, reply);
          if (!body) return;

          const authUser = (request as { user?: { id?: number } }).user;
          const authUserId = authUser?.id;
          if (typeof authUserId !== "number") {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const botId = await getOrCreateBotId();
          const precheckedGame = await prisma.game.findUnique({
            where: { id: body.gameId },
            select: {
              id: true,
              playerOneId: true,
              playerTwoId: true,
              round: true,
              status: true,
            },
          });
          if (!precheckedGame) {
            throw new BotMoveClientError("Game not found");
          }
          if (precheckedGame.playerOneId !== authUserId || precheckedGame.playerTwoId !== botId) {
            throw new BotMoveClientError("Not a bot game");
          }
          if (precheckedGame.status === "FINISHED") {
            throw new BotMoveClientError("Game already finished");
          }
          const precheckedRound = await prisma.round.findFirst({
            where: {
              gameId: precheckedGame.id,
              roundNumber: precheckedGame.round,
              winnerId: null,
            },
            orderBy: { id: "desc" },
            select: { playerOneMove: true },
          });
          if (precheckedRound?.playerOneMove) {
            throw new BotMoveClientError("Move already submitted");
          }

          // Compute adaptive move outside transaction to avoid tx timeout.
          const botMove = await getAdaptiveBotMove(authUserId, botId);

          const result = await prisma.$transaction(async (tx: UserTx) => {
            const game = await tx.game.findUnique({
              where: { id: body.gameId },
              select: {
                id: true,
                playerOneId: true,
                playerTwoId: true,
                playerOneScore: true,
                playerTwoScore: true,
                round: true,
                status: true,
                finishedAt: true,
              },
            });
            if (!game) {
              throw new BotMoveClientError("Game not found");
            }
            if (game.playerOneId !== authUserId || game.playerTwoId !== botId) {
              throw new BotMoveClientError("Not a bot game");
            }
            if (game.status === "FINISHED") {
              throw new BotMoveClientError("Game already finished");
            }

            let round = await tx.round.findFirst({
              where: { gameId: game.id, roundNumber: game.round, winnerId: null },
              orderBy: { id: "desc" },
              select: {
                id: true,
                roundNumber: true,
                playerOneMove: true,
                playerTwoMove: true,
                winnerId: true,
              },
            });
            if (!round) {
              round = await tx.round.create({
                data: { gameId: game.id, roundNumber: game.round },
                select: {
                  id: true,
                  roundNumber: true,
                  playerOneMove: true,
                  playerTwoMove: true,
                  winnerId: true,
                },
              });
            }
            if (round.playerOneMove) {
              throw new BotMoveClientError("Move already submitted");
            }

            const updatedRound = await tx.round.update({
              where: { id: round.id },
              data: { playerOneMove: body.move, playerTwoMove: botMove },
              select: {
                id: true,
                roundNumber: true,
                playerOneMove: true,
                playerTwoMove: true,
                winnerId: true,
              },
            });

            const outcome = RPSGame.getWinner(body.move, botMove);
            if (outcome === "DRAW") {
              const replayRound = await tx.round.create({
                data: { gameId: game.id, roundNumber: game.round },
                select: {
                  id: true,
                  roundNumber: true,
                  playerOneMove: true,
                  playerTwoMove: true,
                  winnerId: true,
                },
              });
              return {
                kind: "draw" as const,
                game,
                round: updatedRound,
                outcome,
                nextRound: replayRound,
              };
            }

            const winnerId = outcome === "PLAYER1" ? game.playerOneId : game.playerTwoId;
            const playerOneScore =
              game.playerOneScore + (winnerId === game.playerOneId ? 1 : 0);
            const playerTwoScore =
              game.playerTwoScore + (winnerId === game.playerTwoId ? 1 : 0);
            const isGameFinished =
              playerOneScore >= WINNING_SCORE || playerTwoScore >= WINNING_SCORE;
            const nextRoundNumber = isGameFinished ? game.round : game.round + 1;
            const updatedGame = await tx.game.update({
              where: { id: game.id },
              data: {
                playerOneScore,
                playerTwoScore,
                round: nextRoundNumber,
                status: isGameFinished ? "FINISHED" : "ONGOING",
                finishedAt: isGameFinished ? new Date() : null,
              },
              select: {
                id: true,
                playerOneId: true,
                playerTwoId: true,
                playerOneScore: true,
                playerTwoScore: true,
                round: true,
                status: true,
                finishedAt: true,
              },
            });

            const resolvedRound = await tx.round.update({
              where: { id: updatedRound.id },
              data: { winnerId },
              select: {
                id: true,
                roundNumber: true,
                playerOneMove: true,
                playerTwoMove: true,
                winnerId: true,
              },
            });

            let nextRound: {
              id: number;
              roundNumber: number;
              playerOneMove: string | null;
              playerTwoMove: string | null;
              winnerId: number | null;
            } | null = null;
            if (!isGameFinished) {
              nextRound = await tx.round.create({
                data: { gameId: game.id, roundNumber: nextRoundNumber },
                select: {
                  id: true,
                  roundNumber: true,
                  playerOneMove: true,
                  playerTwoMove: true,
                  winnerId: true,
                },
              });
            }

            return {
              kind: "resolved" as const,
              game: updatedGame,
              round: resolvedRound,
              outcome,
              nextRound,
            };
          });

          return {
            game: toGameState(result.game),
            round: toRoundState(result.round),
            outcome: result.outcome,
            nextRound: result.nextRound ? toRoundState(result.nextRound) : null,
          };
        } catch (error) {
          if (error instanceof BotMoveClientError) {
            reply.code(400);
            return { status: "error", message: error.message };
          }
          fastify.log.error({ err: error }, "Failed to play bot round");
          reply.code(500);
          return { status: "error", message: "Failed to play" };
        }
      }
    );
  });
}
