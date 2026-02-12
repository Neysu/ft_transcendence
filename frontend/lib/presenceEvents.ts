export const PRESENCE_WATCH_EVENT = "presence-watch";
export const PRESENCE_MESSAGE_EVENT = "presence-message";
export const PRESENCE_CHATTING_EVENT = "presence-chatting";

export type PresenceSnapshot = {
  userId: number;
  status: "online" | "chatting" | "in-game" | "offline";
  lastSeen: string | null;
};

export type PresenceWsMessage =
  | { type: "registered"; userId: number }
  | { type: "presenceSnapshot"; users: PresenceSnapshot[] }
  | { type: "presenceUpdate"; user: PresenceSnapshot }
  | { type: "chattingSnapshot"; users: Array<{ userId: number; withUserId: number | null; isChatting: boolean }> }
  | { type: "chattingUpdate"; userId: number; withUserId: number | null; isChatting: boolean }
  | { type: "error"; message: string };

export type PresenceWatchPayload = {
  userIds: number[];
};

export type PresenceChattingPayload = {
  withUserId: number;
  isChatting: boolean;
};
