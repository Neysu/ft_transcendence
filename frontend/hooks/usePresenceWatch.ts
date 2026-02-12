"use client";

import { useEffect, useMemo, useState } from "react";
import { AUTH_CHANGED_EVENT } from "@/components/AuthProvider";
import { getUserIdFromStoredToken } from "@/lib/authToken";
import {
  PRESENCE_MESSAGE_EVENT,
  PRESENCE_WATCH_EVENT,
  type PresenceSnapshot,
  type PresenceWatchPayload,
  type PresenceWsMessage,
} from "@/lib/presenceEvents";

export type PresenceEntry = {
  status: PresenceSnapshot["status"];
  lastSeen: string | null;
  isChatting: boolean;
  withUserId: number | null;
};

const DEFAULT_ENTRY: PresenceEntry = {
  status: "offline",
  lastSeen: null,
  isChatting: false,
  withUserId: null,
};

export function usePresenceWatch(userIds: number[]) {
  const [presenceByUserId, setPresenceByUserId] = useState<Record<number, PresenceEntry>>({});
  const [selfUserId, setSelfUserId] = useState<number | null>(() => getUserIdFromStoredToken());

  const userIdsKey = useMemo(() => userIds.join(","), [userIds]);

  useEffect(() => {
    const payload: PresenceWatchPayload = { userIds };
    window.dispatchEvent(new CustomEvent(PRESENCE_WATCH_EVENT, { detail: payload }));
  }, [userIdsKey, userIds]);

  useEffect(() => {
    const syncUserIdFromToken = () => {
      const userId = getUserIdFromStoredToken();
      setSelfUserId(userId);
    };

    syncUserIdFromToken();
    window.addEventListener("storage", syncUserIdFromToken);
    window.addEventListener(AUTH_CHANGED_EVENT, syncUserIdFromToken);
    return () => {
      window.removeEventListener("storage", syncUserIdFromToken);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUserIdFromToken);
    };
  }, []);

  useEffect(() => {
    const handlePresenceMessage = (event: Event) => {
      const customEvent = event as CustomEvent<PresenceWsMessage>;
      const message = customEvent.detail;
      if (!message) return;

      if (message.type === "registered") {
        setSelfUserId(message.userId);
        return;
      }

      if (message.type === "presenceSnapshot") {
        setPresenceByUserId((previous) => {
          const next = { ...previous };
          for (const user of message.users) {
            const existing = next[user.userId] || DEFAULT_ENTRY;
            next[user.userId] = {
              ...existing,
              status: user.status,
              lastSeen: user.lastSeen,
            };
          }
          return next;
        });
        return;
      }

      if (message.type === "presenceUpdate") {
        setPresenceByUserId((previous) => {
          const existing = previous[message.user.userId] || DEFAULT_ENTRY;
          return {
            ...previous,
            [message.user.userId]: {
              ...existing,
              status: message.user.status,
              lastSeen: message.user.lastSeen,
            },
          };
        });
        return;
      }

      if (message.type === "chattingSnapshot") {
        setPresenceByUserId((previous) => {
          const next = { ...previous };
          for (const user of message.users) {
            const existing = next[user.userId] || DEFAULT_ENTRY;
            next[user.userId] = {
              ...existing,
              isChatting: user.isChatting,
              withUserId: user.withUserId,
            };
          }
          return next;
        });
        return;
      }

      if (message.type === "chattingUpdate") {
        setPresenceByUserId((previous) => {
          const existing = previous[message.userId] || DEFAULT_ENTRY;
          return {
            ...previous,
            [message.userId]: {
              ...existing,
              isChatting: message.isChatting,
              withUserId: message.withUserId,
            },
          };
        });
      }
    };

    window.addEventListener(PRESENCE_MESSAGE_EVENT, handlePresenceMessage as EventListener);
    return () => {
      window.removeEventListener(PRESENCE_MESSAGE_EVENT, handlePresenceMessage as EventListener);
    };
  }, []);

  const isChattingToMe = (userId: number) => {
    const row = presenceByUserId[userId];
    if (!row || selfUserId === null) return false;
    return row.isChatting && row.withUserId === selfUserId;
  };

  return {
    presenceByUserId,
    selfUserId,
    isChattingToMe,
  };
}
