export type PresenceStatus = "online" | "in-game" | "offline";
export type PresenceSource = "chat" | "game" | "presence";

export type PresenceSnapshot = {
  userId: number;
  status: PresenceStatus;
  lastSeen: string | null;
};

type PresenceListener = (snapshot: PresenceSnapshot) => void;

const sourceConnections: Record<PresenceSource, Map<number, number>> = {
  chat: new Map<number, number>(),
  game: new Map<number, number>(),
  presence: new Map<number, number>(),
};

const lastSeenByUserId = new Map<number, string>();
const LAST_SEEN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const LAST_SEEN_MAX_ENTRIES = 20_000;
const listeners = new Set<PresenceListener>();

function pruneLastSeen() {
  if (lastSeenByUserId.size === 0) return;
  const now = Date.now();

  for (const [userId, seenAt] of lastSeenByUserId.entries()) {
    const timestamp = Date.parse(seenAt);
    if (!Number.isFinite(timestamp) || now - timestamp > LAST_SEEN_RETENTION_MS) {
      lastSeenByUserId.delete(userId);
    }
  }

  if (lastSeenByUserId.size <= LAST_SEEN_MAX_ENTRIES) return;

  const ordered = Array.from(lastSeenByUserId.entries())
    .map(([userId, seenAt]) => ({ userId, timestamp: Date.parse(seenAt) }))
    .filter((entry) => Number.isFinite(entry.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const toDelete = lastSeenByUserId.size - LAST_SEEN_MAX_ENTRIES;
  for (let i = 0; i < toDelete && i < ordered.length; i += 1) {
    lastSeenByUserId.delete(ordered[i]!.userId);
  }
}

function getSourceCount(source: PresenceSource, userId: number) {
  return sourceConnections[source].get(userId) ?? 0;
}

function setSourceCount(source: PresenceSource, userId: number, next: number) {
  if (next <= 0) {
    sourceConnections[source].delete(userId);
    return;
  }
  sourceConnections[source].set(userId, next);
}

function getTotalConnections(userId: number) {
  return (
    getSourceCount("chat", userId) +
    getSourceCount("game", userId) +
    getSourceCount("presence", userId)
  );
}

function getStatus(userId: number): PresenceStatus {
  const total = getTotalConnections(userId);
  if (total <= 0) {
    return "offline";
  }
  if (getSourceCount("game", userId) > 0) {
    return "in-game";
  }
  return "online";
}

function emit(snapshot: PresenceSnapshot) {
  for (const listener of listeners) {
    listener(snapshot);
  }
}

function updateConnectionCount(userId: number, source: PresenceSource, delta: 1 | -1) {
  const before = getPresenceForUser(userId);
  const current = getSourceCount(source, userId);
  const next = Math.max(0, current + delta);
  setSourceCount(source, userId, next);

  if (getTotalConnections(userId) <= 0) {
    pruneLastSeen();
    lastSeenByUserId.set(userId, new Date().toISOString());
  }

  const after = getPresenceForUser(userId);
  if (before.status !== after.status || before.lastSeen !== after.lastSeen) {
    emit(after);
  }
}

export function trackUserConnected(userId: number, source: PresenceSource) {
  updateConnectionCount(userId, source, 1);
}

export function trackUserDisconnected(userId: number, source: PresenceSource) {
  updateConnectionCount(userId, source, -1);
}

export function getPresenceForUser(userId: number): PresenceSnapshot {
  const status = getStatus(userId);
  return {
    userId,
    status,
    lastSeen: status === "offline" ? lastSeenByUserId.get(userId) ?? null : null,
  };
}

export function getPresenceForUsers(userIds: number[]): PresenceSnapshot[] {
  return userIds.map((userId) => getPresenceForUser(userId));
}

export function onPresenceChange(listener: PresenceListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
