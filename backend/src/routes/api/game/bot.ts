import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../../../lib/prisma";
import { RPSGame, type Move } from "../../../lib/game/RPS";
import { parseOrReply } from "../../../lib/api/validation";
import { authMiddleware } from "../../../middleware/auth";
import { BotMoveSchema } from "../../../lib/api/schemasZod";

const BOT_USERNAME = "rps_bot";
const BOT_EMAIL = "rps_bot@local";
const BOT_PASSWORD = "rps_bot";

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
          const created = await prisma.$transaction(async (tx) => {
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
          const result = await prisma.$transaction(async (tx) => {
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
              throw new Error("Game not found");
            }
            if (game.playerOneId !== authUserId || game.playerTwoId !== botId) {
              throw new Error("Not a bot game");
            }
            if (game.status === "FINISHED") {
              throw new Error("Game already finished");
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
              throw new Error("Move already submitted");
            }

            const botMove = RPSGame.getWeightedAIMove();
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
            const isLastRound = game.round >= 3;
            const nextRoundNumber = isLastRound ? game.round : game.round + 1;
            const updatedGame = await tx.game.update({
              where: { id: game.id },
              data: {
                playerOneScore,
                playerTwoScore,
                round: nextRoundNumber,
                status: isLastRound ? "FINISHED" : "ONGOING",
                finishedAt: isLastRound ? new Date() : null,
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
            if (!isLastRound) {
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
          const message = error instanceof Error ? error.message : "Failed to play";
          reply.code(400);
          return { status: "error", message };
        }
      }
    );
  });
}
