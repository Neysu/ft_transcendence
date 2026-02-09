export const PRESENCE_WATCH_EVENT = "presence-watch";
export const PRESENCE_MESSAGE_EVENT = "presence-message";

export type PresenceSnapshot = {
  userId: number;
  status: "online" | "in-game" | "offline";
  lastSeen: string | null;
};

export type PresenceWsMessage =
  | { type: "registered"; userId: number }
  | { type: "presenceSnapshot"; users: PresenceSnapshot[] }
  | { type: "presenceUpdate"; user: PresenceSnapshot }
  | { type: "error"; message: string };

export type PresenceWatchPayload = {
  userIds: number[];
};
