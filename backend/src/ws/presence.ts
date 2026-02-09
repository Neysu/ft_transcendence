import type { FastifyInstance, FastifyRequest } from "fastify";
import WebSocket, { type RawData } from "ws";
import { attachHeartbeat, loadFriendIds } from "./utils";
import {
  getPresenceForUser,
  getPresenceForUsers,
  onPresenceChange,
  trackUserConnected,
  trackUserDisconnected,
  type PresenceSnapshot,
} from "./presenceState";

type ClientMessage =
  | { type: "watch"; userIds: number[] }
  | { type: "check"; userId: number }
  | { type: "watchFriends" };

type ServerMessage =
  | { type: "registered"; userId: number }
  | { type: "presenceSnapshot"; users: PresenceSnapshot[] }
  | { type: "presenceUpdate"; user: PresenceSnapshot }
  | { type: "error"; message: string };

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

function normalizeUserIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  const unique = new Set<number>();
  for (const entry of value) {
    if (typeof entry !== "number" || !Number.isInteger(entry) || entry <= 0) {
      continue;
    }
    unique.add(entry);
    if (unique.size >= 500) break;
  }
  return Array.from(unique);
}

const MAX_MESSAGE_BYTES = 4 * 1024;

export async function presenceWs(fastify: FastifyInstance) {
  fastify.get("/presence", { websocket: true }, async (socket, request) => {
    attachHeartbeat(socket);
    const token = getTokenFromRequest(request);
    if (!token) {
      safeSend(socket, { type: "error", message: "Missing token" });
      socket.close(1008, "Missing token");
      return;
    }

    let currentUserId: number | null = null;
    let watchedUserIds = new Set<number>();
    let stopWatchingPresence: (() => void) | null = null;

    const getAllowedUserIds = async (userId: number) => {
      const friendIds = await loadFriendIds(userId);
      friendIds.add(userId);
      return friendIds;
    };

    try {
      const payload = fastify.jwt.verify(token) as { id?: number };
      if (!payload?.id || !Number.isInteger(payload.id) || payload.id <= 0) {
        safeSend(socket, { type: "error", message: "Invalid token" });
        socket.close(1008, "Invalid token");
        return;
      }
      currentUserId = payload.id;
      trackUserConnected(currentUserId, "presence");
      safeSend(socket, { type: "registered", userId: currentUserId });

      stopWatchingPresence = onPresenceChange((snapshot) => {
        if (watchedUserIds.has(snapshot.userId)) {
          safeSend(socket, { type: "presenceUpdate", user: snapshot });
        }
      });
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

      if (payload.type === "watch") {
        if (!currentUserId) {
          return safeSend(socket, { type: "error", message: "Not registered" });
        }
        const userIds = normalizeUserIds(payload.userIds);
        const allowed = await getAllowedUserIds(currentUserId);
        const authorizedUserIds = userIds.filter((userId) => allowed.has(userId));
        watchedUserIds = new Set<number>(authorizedUserIds);
        safeSend(socket, { type: "presenceSnapshot", users: getPresenceForUsers(authorizedUserIds) });
        return;
      }

      if (payload.type === "check") {
        if (!currentUserId) {
          return safeSend(socket, { type: "error", message: "Not registered" });
        }
        if (!Number.isInteger(payload.userId) || payload.userId <= 0) {
          return safeSend(socket, { type: "error", message: "Invalid userId" });
        }
        const allowed = await getAllowedUserIds(currentUserId);
        if (!allowed.has(payload.userId)) {
          return safeSend(socket, { type: "error", message: "Forbidden" });
        }
        safeSend(socket, { type: "presenceSnapshot", users: [getPresenceForUser(payload.userId)] });
        return;
      }

      if (payload.type === "watchFriends") {
        if (!currentUserId) {
          return safeSend(socket, { type: "error", message: "Not registered" });
        }
        const friendIds = await loadFriendIds(currentUserId);
        const ids = Array.from(friendIds);
        watchedUserIds = new Set<number>(ids);
        safeSend(socket, { type: "presenceSnapshot", users: getPresenceForUsers(ids) });
        return;
      }

      safeSend(socket, { type: "error", message: "Unknown message type" });
    });

    socket.on("close", () => {
      stopWatchingPresence?.();
      if (currentUserId) {
        trackUserDisconnected(currentUserId, "presence");
      }
    });
  });
}
