"use client";

import { useEffect, useRef } from "react";
import { AUTH_CHANGED_EVENT } from "@/components/AuthProvider";
import {
  PRESENCE_CHATTING_EVENT,
  PRESENCE_MESSAGE_EVENT,
  PRESENCE_WATCH_EVENT,
  type PresenceChattingPayload,
  type PresenceWatchPayload,
  type PresenceWsMessage,
} from "@/lib/presenceEvents";

function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("accessToken");
}

export default function PresenceSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const watchedUserIdsRef = useRef<number[]>([]);

  useEffect(() => {
    let disposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const closeSocket = () => {
      const socket = socketRef.current;
      if (!socket) return;
      socketRef.current = null;

      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (socket.readyState === WebSocket.CONNECTING) {
        socket.addEventListener(
          "open",
          () => {
            try {
              socket.close();
            } catch {
            }
          },
          { once: true }
        );
        return;
      }

      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    const connect = () => {
      clearReconnectTimer();
      const token = getAuthToken();
      if (!token || disposed) {
        closeSocket();
        return;
      }

      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws/presence`, token);
      socketRef.current = socket;
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "watch", userIds: watchedUserIdsRef.current }));
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as PresenceWsMessage;
          window.dispatchEvent(new CustomEvent(PRESENCE_MESSAGE_EVENT, { detail: payload }));
        } catch {}
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        if (!disposed && getAuthToken()) {
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      };
    };

    const handleAuthChanged = () => {
      closeSocket();
      connect();
    };

    const handleWatch = (event: Event) => {
      const customEvent = event as CustomEvent<PresenceWatchPayload>;
      const ids = Array.isArray(customEvent.detail?.userIds)
        ? customEvent.detail.userIds.filter((id) => Number.isInteger(id) && id > 0)
        : [];
      watchedUserIdsRef.current = ids;
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: "watch", userIds: ids }));
    };

    const handleChatting = (event: Event) => {
      const customEvent = event as CustomEvent<PresenceChattingPayload>;
      const withUserId = customEvent.detail?.withUserId;
      const isChatting = customEvent.detail?.isChatting;
      if (!Number.isInteger(withUserId) || withUserId <= 0 || typeof isChatting !== "boolean") {
        return;
      }
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: "chatting", withUserId, isChatting }));
    };

    connect();
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);
    window.addEventListener(PRESENCE_WATCH_EVENT, handleWatch as EventListener);
    window.addEventListener(PRESENCE_CHATTING_EVENT, handleChatting as EventListener);

    return () => {
      disposed = true;
      clearReconnectTimer();
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
      window.removeEventListener(PRESENCE_WATCH_EVENT, handleWatch as EventListener);
      window.removeEventListener(PRESENCE_CHATTING_EVENT, handleChatting as EventListener);
      closeSocket();
    };
  }, []);

  return null;
}
