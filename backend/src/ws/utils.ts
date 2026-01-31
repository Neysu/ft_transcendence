import type WebSocket from "ws";
import { prisma } from "../lib/prisma";

type HeartbeatOptions = {
  intervalMs?: number;
  timeoutCode?: number;
  timeoutReason?: string;
};

export function attachHeartbeat(socket: WebSocket, options: HeartbeatOptions = {}) {
  const intervalMs = options.intervalMs ?? 30_000;
  const timeoutCode = options.timeoutCode ?? 1008;
  const timeoutReason = options.timeoutReason ?? "No pong";
  let isAlive = true;

  const onPong = () => {
    isAlive = true;
  };

  socket.on("pong", onPong);
  const timer = setInterval(() => {
    if (!isAlive) {
      socket.close(timeoutCode, timeoutReason);
      socket.terminate();
      return;
    }
    isAlive = false;
    socket.ping();
  }, intervalMs);

  socket.on("close", () => {
    clearInterval(timer);
  });
}

export async function loadFriendIds(userId: number) {
  const relations = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  const friendIds = new Set<number>();
  for (const relation of relations) {
    friendIds.add(relation.requesterId === userId ? relation.addresseeId : relation.requesterId);
  }
  return friendIds;
}

export function scheduleFriendIdsRefresh(
  userId: number,
  update: (friendIds: Set<number>) => void,
  intervalMs = 30_000
) {
  const refresh = async () => {
    try {
      const fresh = await loadFriendIds(userId);
      update(fresh);
    } catch {}
  };

  const timer = setInterval(refresh, intervalMs);
  return () => clearInterval(timer);
}
