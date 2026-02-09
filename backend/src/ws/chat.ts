import type { FastifyInstance, FastifyRequest } from "fastify";
import WebSocket, { type RawData } from "ws";
import { prisma } from "../lib/prisma";
import { attachHeartbeat, loadFriendIds, scheduleFriendIdsRefresh } from "./utils";
import { trackUserConnected, trackUserDisconnected } from "./presenceState";

type ClientMessage =
  | { type: "send"; toUserId: number; message: string };

type ServerMessage =
  | { type: "registered"; userId: number }
  | { type: "message"; fromUserId: number; message: string }
  | { type: "error"; message: string };

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

const MAX_MESSAGE_BYTES = 4 * 1024;

export async function chatWs(fastify: FastifyInstance) {
  fastify.get("/chat", { websocket: true }, async (socket, request) => {
    attachHeartbeat(socket);
    const token = getTokenFromRequest(request);
    if (!token) {
      safeSend(socket, { type: "error", message: "Missing token" });
      socket.close(1008, "Missing token");
      return;
    }

    let currentUserId: number | null = null;
    let friendIds: Set<number> = new Set();
    let stopFriendRefresh: (() => void) | null = null;
    let isPresenceTracked = false;
    try {
      const payload = fastify.jwt.verify(token) as { id?: number };
      if (!payload?.id || !Number.isInteger(payload.id) || payload.id <= 0) {
        safeSend(socket, { type: "error", message: "Invalid token" });
        socket.close(1008, "Invalid token");
        return;
      }
      currentUserId = payload.id;
      friendIds = await loadFriendIds(currentUserId);
      stopFriendRefresh = scheduleFriendIdsRefresh(currentUserId, (fresh) => {
        friendIds = fresh;
      });
      addConnection(currentUserId, socket);
      trackUserConnected(currentUserId, "chat");
      isPresenceTracked = true;
      safeSend(socket, { type: "registered", userId: currentUserId });
      try {
        const friendIdList = Array.from(friendIds);
        const pending: Array<{ id: number; senderId: number; content: string }> = friendIdList.length === 0
          ? []
          : await prisma.message.findMany({
            where: {
              receiverId: currentUserId,
              deliveredAt: null,
              senderId: { in: friendIdList },
            },
            orderBy: { id: "asc" },
            take: 200,
            select: { id: true, senderId: true, content: true },
          });

        if (pending.length > 0) {
          for (const msg of pending) {
            safeSend(socket, {
              type: "message",
              fromUserId: msg.senderId,
              message: msg.content,
            });
          }
          await prisma.message.updateMany({
            where: { id: { in: pending.map((msg: { id: number }) => msg.id) } },
            data: { deliveredAt: new Date() },
          });
        }
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to deliver pending messages:");
      }
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

      if (payload.type === "send") {
        if (currentUserId === null) {
          return safeSend(socket, { type: "error", message: "Not registered" });
        }
        if (!Number.isInteger(payload.toUserId) || payload.toUserId <= 0) {
          return safeSend(socket, { type: "error", message: "Invalid toUserId" });
        }
        if (!payload.message || typeof payload.message !== "string") {
          return safeSend(socket, { type: "error", message: "Invalid message" });
        }

        if (!friendIds.has(payload.toUserId)) {
          return safeSend(socket, { type: "error", message: "Not friends" });
        }

        let createdId: number | null = null;
        try {
          const created = await prisma.message.create({
            data: {
              senderId: currentUserId,
              receiverId: payload.toUserId,
              content: payload.message,
            },
            select: { id: true },
          });
          createdId = created.id;
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to save chat message:");
          return safeSend(socket, { type: "error", message: "Failed to save message" });
        }

        const recipients = connectionsByUserId.get(payload.toUserId);
        if (recipients && recipients.size > 0) {
          const deliveredAt = new Date();
          for (const socket of recipients) {
            safeSend(socket, {
              type: "message",
              fromUserId: currentUserId,
              message: payload.message,
            });
          }
          if (createdId !== null) {
            try {
              await prisma.message.update({
                where: { id: createdId },
                data: { deliveredAt },
              });
            } catch (error) {
              fastify.log.error({ err: error }, "Failed to update deliveredAt:");
            }
          }
        }
        return;
      }

      safeSend(socket, { type: "error", message: "Unknown message type" });
    });

    socket.on("close", () => {
      stopFriendRefresh?.();
      removeConnection(currentUserId, socket);
      if (currentUserId && isPresenceTracked) {
        trackUserDisconnected(currentUserId, "chat");
      }
    });
  });
}
