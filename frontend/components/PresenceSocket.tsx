"use client";

import { useEffect, useRef } from "react";
import { AUTH_CHANGED_EVENT } from "@/components/AuthProvider";
import {
  PRESENCE_MESSAGE_EVENT,
  PRESENCE_WATCH_EVENT,
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
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
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

    connect();
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);
    window.addEventListener(PRESENCE_WATCH_EVENT, handleWatch as EventListener);

    return () => {
      disposed = true;
      clearReconnectTimer();
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
      window.removeEventListener(PRESENCE_WATCH_EVENT, handleWatch as EventListener);
      closeSocket();
    };
  }, []);

  return null;
}
