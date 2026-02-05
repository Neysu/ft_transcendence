import type { FastifyInstance, FastifyRequest } from "fastify";
import WebSocket, { type RawData } from "ws";
import { prisma } from "../lib/prisma";
import { RPSGame, type Move } from "../lib/game/RPS";
import { attachHeartbeat } from "./utils";

type ClientMessage =
  | { type: "create"; opponentId: number }
  | { type: "join"; gameId: number }
  | { type: "move"; gameId: number; move: Move };

type ServerMessage =
  | { type: "registered"; userId: number }
  | { type: "gameCreated"; game: GameState; round: RoundState }
  | { type: "gameState"; game: GameState; round: RoundState }
  | { type: "moveAccepted"; gameId: number; roundId: number }
  | { type: "roundResolved"; game: GameState; round: RoundState; outcome: RoundOutcome; nextRound?: RoundState | null }
  | { type: "error"; message: string };

type RoundOutcome = "PLAYER1" | "PLAYER2" | "DRAW";

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

const connectionsByUserId = new Map<number, Set<WebSocket>>();

function addConnection(userId: number, socket: WebSocket) {
  let sockets = connectionsByUserId.get(userId);
  if (!sockets) {
    sockets = new Set();
    connectionsByUserId.set(userId, sockets);
  }
  sockets.add(socket);
}

function removeConnection(userId: number | null, socket: WebSocket) {
  if (userId === null) return;
  const sockets = connectionsByUserId.get(userId);
  if (!sockets) return;
  sockets.delete(socket);
  if (sockets.size === 0) {
    connectionsByUserId.delete(userId);
  }
}

function safeSend(socket: WebSocket, payload: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function sendToUser(userId: number, payload: ServerMessage) {
  const sockets = connectionsByUserId.get(userId);
  if (!sockets) return;
  for (const socket of sockets) {
    safeSend(socket, payload);
  }
}

function getTokenFromRequest(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }
  const protocolHeader = request.headers["sec-websocket-protocol"];
  if (typeof protocolHeader === "string" && protocolHeader.length > 0) {
    const token = protocolHeader.split(",")[0]?.trim();
    if (token) {
      return token;
    }
  }
  if (process.env.NODE_ENV !== "production") {
    const query = request.query as { token?: string } | undefined;
    if (query?.token) {
      return query.token;
    }
  }
  return null;
}

function isMove(value: unknown): value is Move {
  return value === "ROCK" || value === "PAPER" || value === "SCISSORS";
}

function normalizeMove(value: string | null): Move | null {
  return isMove(value) ? value : null;
}

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
  return {
    id: round.id,
    roundNumber: round.roundNumber,
    playerOneMove: normalizeMove(round.playerOneMove),
    playerTwoMove: normalizeMove(round.playerTwoMove),
    winnerId: round.winnerId,
  };
}

const MAX_MESSAGE_BYTES = 4 * 1024;

export async function gameWs(fastify: FastifyInstance) {
  fastify.get("/game", { websocket: true }, async (socket, request) => {
    attachHeartbeat(socket);
    const token = getTokenFromRequest(request);
    if (!token) {
      safeSend(socket, { type: "error", message: "Missing token" });
      socket.close(1008, "Missing token");
      return;
    }

    let currentUserId: number | null = null;
    try {
      const payload = fastify.jwt.verify(token) as { id?: number };
      if (!payload?.id || !Number.isInteger(payload.id) || payload.id <= 0) {
        safeSend(socket, { type: "error", message: "Invalid token" });
        socket.close(1008, "Invalid token");
        return;
      }
      currentUserId = payload.id;
      addConnection(currentUserId, socket);
      safeSend(socket, { type: "registered", userId: currentUserId });
    } catch {
      safeSend(socket, { type: "error", message: "Invalid token" });
      socket.close(1008, "Invalid token");
      return;
    }

    socket.on("message", async (raw: RawData) => {
      const size =
        typeof raw === "string"
          ? Buffer.byteLength(raw)
          : raw instanceof ArrayBuffer
            ? raw.byteLength
            : Array.isArray(raw)
              ? raw.reduce((total, chunk) => total + chunk.length, 0)
              : raw.length;
      if (size > MAX_MESSAGE_BYTES) {
        return safeSend(socket, { type: "error", message: "Message too large" });
      }
      const text =
        typeof raw === "string"
          ? raw
          : raw instanceof ArrayBuffer
            ? Buffer.from(raw).toString()
            : Array.isArray(raw)
              ? Buffer.concat(raw).toString()
              : raw.toString();
      let payload: ClientMessage;
      try {
        payload = JSON.parse(text) as ClientMessage;
      } catch {
        return safeSend(socket, { type: "error", message: "Invalid JSON" });
      }

      if (!currentUserId) {
        return safeSend(socket, { type: "error", message: "Not registered" });
      }

      if (payload.type === "create") {
        if (!Number.isInteger(payload.opponentId) || payload.opponentId <= 0) {
          return safeSend(socket, { type: "error", message: "Invalid opponentId" });
        }
        if (payload.opponentId === currentUserId) {
          return safeSend(socket, { type: "error", message: "Cannot play against yourself" });
        }
        const opponent = await prisma.user.findUnique({
          where: { id: payload.opponentId },
          select: { id: true },
        });
        if (!opponent) {
          return safeSend(socket, { type: "error", message: "Opponent not found" });
        }

        const created = await prisma.game.create({
          data: {
            playerOneId: currentUserId,
            playerTwoId: payload.opponentId,
            rounds: { create: { roundNumber: 1 } },
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
            rounds: {
              orderBy: { id: "desc" },
              take: 1,
              select: {
                id: true,
                roundNumber: true,
                playerOneMove: true,
                playerTwoMove: true,
                winnerId: true,
              },
            },
          },
        });

        const round = created.rounds[0];
        const gameState = toGameState(created);
        const roundState = toRoundState(round);
        const message: ServerMessage = { type: "gameCreated", game: gameState, round: roundState };
        safeSend(socket, message);
        sendToUser(payload.opponentId, { type: "gameState", game: gameState, round: roundState });
        return;
      }

      if (payload.type === "join") {
        if (!Number.isInteger(payload.gameId) || payload.gameId <= 0) {
          return safeSend(socket, { type: "error", message: "Invalid gameId" });
        }
        const game = await prisma.game.findUnique({
          where: { id: payload.gameId },
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
          return safeSend(socket, { type: "error", message: "Game not found" });
        }
        if (game.playerOneId !== currentUserId && game.playerTwoId !== currentUserId) {
          return safeSend(socket, { type: "error", message: "Not a player in this game" });
        }

        let round = await prisma.round.findFirst({
          where:
            game.status === "FINISHED"
              ? { gameId: game.id }
              : { gameId: game.id, roundNumber: game.round, winnerId: null },
          orderBy: { id: "desc" },
          select: {
            id: true,
            roundNumber: true,
            playerOneMove: true,
            playerTwoMove: true,
            winnerId: true,
          },
        });
        if (!round && game.status !== "FINISHED") {
          round = await prisma.round.create({
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
        if (!round) {
          return safeSend(socket, { type: "error", message: "No round found" });
        }

        safeSend(socket, { type: "gameState", game: toGameState(game), round: toRoundState(round) });
        return;
      }

      if (payload.type === "move") {
        if (!Number.isInteger(payload.gameId) || payload.gameId <= 0) {
          return safeSend(socket, { type: "error", message: "Invalid gameId" });
        }
        if (!isMove(payload.move)) {
          return safeSend(socket, { type: "error", message: "Invalid move" });
        }

        try {
          const result = await prisma.$transaction(async (tx) => {
            const game = await tx.game.findUnique({
              where: { id: payload.gameId },
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
            if (game.playerOneId !== currentUserId && game.playerTwoId !== currentUserId) {
              throw new Error("Not a player in this game");
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

            const isPlayerOne = currentUserId === game.playerOneId;
            const existingMove = isPlayerOne ? round.playerOneMove : round.playerTwoMove;
            if (existingMove !== null) {
              throw new Error("Move already submitted");
            }

            const updatedRound = await tx.round.update({
              where: { id: round.id },
              data: isPlayerOne
                ? { playerOneMove: payload.move }
                : { playerTwoMove: payload.move },
              select: {
                id: true,
                roundNumber: true,
                playerOneMove: true,
                playerTwoMove: true,
                winnerId: true,
              },
            });

            if (!updatedRound.playerOneMove || !updatedRound.playerTwoMove) {
              return {
                kind: "pending" as const,
                game,
                round: updatedRound,
              };
            }

            if (!isMove(updatedRound.playerOneMove) || !isMove(updatedRound.playerTwoMove)) {
              throw new Error("Invalid round moves");
            }
            const outcome = RPSGame.getWinner(
              updatedRound.playerOneMove,
              updatedRound.playerTwoMove
            );

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
                kind: "resolved" as const,
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

          if (result.kind === "pending") {
            safeSend(socket, {
              type: "moveAccepted",
              gameId: result.game.id,
              roundId: result.round.id,
            });
            return;
          }

          const gameState = toGameState(result.game);
          const roundState = toRoundState(result.round);
          const message: ServerMessage = {
            type: "roundResolved",
            game: gameState,
            round: roundState,
            outcome: result.outcome as RoundOutcome,
            nextRound: result.nextRound ? toRoundState(result.nextRound) : null,
          };
          sendToUser(gameState.playerOneId, message);
          sendToUser(gameState.playerTwoId, message);
          return;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to apply move";
          return safeSend(socket, { type: "error", message });
        }
      }

      safeSend(socket, { type: "error", message: "Unknown message type" });
    });

    socket.on("close", () => {
      removeConnection(currentUserId, socket);
    });
  });
}
