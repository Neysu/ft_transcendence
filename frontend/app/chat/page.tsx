"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { TextInput } from "@/components/atoms/TextInput";
import { useLanguage } from "@/components/LanguageProvider";
import { AUTH_CHANGED_EVENT } from "@/components/AuthProvider";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import ChatMessagesPanel, {
  type ChatMessageItem,
} from "@/components/molecules/ChatMessagesPanel";
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from "@/lib/avatar";
import {
  PRESENCE_CHATTING_EVENT,
  type PresenceChattingPayload,
} from "@/lib/presenceEvents";
import { usePresenceWatch } from "@/hooks/usePresenceWatch";

type Friend = {
  id: string;
  username: string;
  profileImage?: string | null;
};

type MessageRow = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  receiverId: number;
};

type ConversationPayload = {
  messages?: MessageRow[];
  message?: string;
};

type FriendPayload = {
  friends?: Array<{ id: number; username: string; profileImage?: string | null }>;
  message?: string;
};

type MePayload = {
  id?: number;
  message?: string;
};

type ChatWsMessage =
  | { type: "registered"; userId: number }
  | { type: "message"; fromUserId: number; message: string }
  | { type: "unreadSnapshot"; unreadByUserId: Record<string, number> }
  | { type: "unreadUpdate"; userId: number; count: number }
  | { type: "readSnapshot"; seenByUserId: Record<string, string> }
  | { type: "readUpdate"; userId: number; seenAt: string }
  | { type: "error"; message: string };

const HISTORY_LIMIT = 100;
const DRAFT_MAX_ROWS = 4;

function toTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function compareChatMessageOrder(a: ChatMessageItem, b: ChatMessageItem) {
  const aTime = toTimestamp(a.createdAt);
  const bTime = toTimestamp(b.createdAt);
  if (aTime !== bTime) {
    return aTime - bTime;
  }
  return a.key.localeCompare(b.key);
}

function mergeHistoryWithExisting(history: ChatMessageItem[], existing: ChatMessageItem[]) {
  if (existing.length === 0) {
    return history;
  }
  const mergedByKey = new Map<string, ChatMessageItem>();
  for (const message of existing) {
    mergedByKey.set(message.key, message);
  }
  for (const message of history) {
    mergedByKey.set(message.key, message);
  }
  return Array.from(mergedByKey.values()).sort(compareChatMessageOrder);
}

function getAuthToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
}

function getRequestedUserIdFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("userId");
}

export default function ChatPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [requestedUserId, setRequestedUserId] = useState<string | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [messagesByFriend, setMessagesByFriend] = useState<Record<string, ChatMessageItem[]>>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [sendingError, setSendingError] = useState<string | null>(null);

  const [socketReady, setSocketReady] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const [brokenAvatarIds, setBrokenAvatarIds] = useState<Record<string, boolean>>({});
  const [unreadByFriend, setUnreadByFriend] = useState<Record<string, number>>({});
  const [seenByFriend, setSeenByFriend] = useState<Record<string, string>>({});

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const typingTargetRef = useRef<number | null>(null);
  const typingActiveRef = useRef(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedFriendIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedFriendIdRef.current = selectedFriendId;
  }, [selectedFriendId]);

  useEffect(() => {
    const syncRequestedUserId = () => {
      setRequestedUserId(getRequestedUserIdFromUrl());
    };
    syncRequestedUserId();
    window.addEventListener("popstate", syncRequestedUserId);
    return () => {
      window.removeEventListener("popstate", syncRequestedUserId);
    };
  }, []);

  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.id === selectedFriendId) || null,
    [friends, selectedFriendId]
  );

  const selectedMessages = useMemo(() => {
    if (!selectedFriendId) return [];
    return messagesByFriend[selectedFriendId] || [];
  }, [messagesByFriend, selectedFriendId]);

  const filteredFriends = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return friends;
    return friends.filter((friend) => friend.username.toLowerCase().includes(term));
  }, [friends, search]);

  const friendIdsForPresence = useMemo(
    () =>
      friends
        .map((friend) => Number(friend.id))
        .filter((id) => Number.isInteger(id) && id > 0),
    [friends]
  );
  const { presenceByUserId, isChattingToMe } = usePresenceWatch(friendIdsForPresence);

  const peerIsChatting = useMemo(() => {
    if (!selectedFriendId) return false;
    const friendId = Number(selectedFriendId);
    if (!Number.isInteger(friendId) || friendId <= 0) return false;
    return isChattingToMe(friendId);
  }, [isChattingToMe, selectedFriendId]);

  const getAvatarSrc = useCallback(
    (friend: Friend) => {
      if (brokenAvatarIds[friend.id]) return DEFAULT_AVATAR_PATH;
      return resolveAvatarUrl(friend.profileImage);
    },
    [brokenAvatarIds]
  );

  const mapChatMessage = useCallback(
    (message?: string, fallbackKey?: string) => {
      if (!message) {
        return fallbackKey ? t(fallbackKey) : t("serverUnavailable");
      }
      const normalizedMessage = message.trim();
      const mapping: Record<string, string> = {
        "Missing token": "chatWsMissingToken",
        "Invalid token": "chatWsInvalidToken",
        "Not registered": "chatWsNotRegistered",
        "Invalid toUserId": "chatWsInvalidToUserId",
        "Invalid withUserId": "chatWsInvalidWithUserId",
        "Invalid message": "chatWsInvalidMessage",
        "Invalid userId": "chatInvalidFriendId",
        "Invalid cursor": "chatFailedLoadMessages",
        "Not friends": "chatWsNotFriends",
        Forbidden: "chatWsNotFriends",
        "User not found": "userNotFound",
        "Failed to fetch current user": "chatFailedLoadProfile",
        "Failed to fetch friends": "chatFailedLoadFriends",
        "Failed to fetch messages": "chatFailedLoadMessages",
        "Failed to save message": "chatWsFailedSaveMessage",
        "Unknown message type": "chatWsUnknownMessageType",
        "Message too large": "chatWsMessageTooLarge",
        "Invalid JSON": "chatWsInvalidJson",
      };
      const key = mapping[normalizedMessage];
      if (key) {
        return t(key);
      }
      return normalizedMessage;
    },
    [t]
  );

  const fetchMe = useCallback(async (token: string) => {
    const response = await fetch("/api/user/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = (await response.json().catch(() => null)) as MePayload | null;

    if (!response.ok || typeof payload?.id !== "number") {
      throw new Error(mapChatMessage(payload?.message, "chatFailedLoadProfile"));
    }

    setCurrentUserId(payload.id);
  }, [mapChatMessage]);

  const fetchFriends = useCallback(async (token: string) => {
    setFriendsLoading(true);
    setFriendsError(null);

    try {
      const response = await fetch("/api/user/friends", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as FriendPayload | null;

      if (!response.ok) {
        setFriends([]);
        setFriendsError(mapChatMessage(payload?.message, "chatFailedLoadFriends"));
        return;
      }

      const nextFriends = (payload?.friends || []).map((friend) => ({
        id: String(friend.id),
        username: friend.username,
        profileImage: friend.profileImage,
      }));

      setFriends(nextFriends);
      setUnreadByFriend((previous) => {
        const friendIds = new Set(nextFriends.map((friend) => friend.id));
        const next: Record<string, number> = {};
        for (const [friendId, count] of Object.entries(previous)) {
          if (friendIds.has(friendId) && count > 0) {
            next[friendId] = count;
          }
        }
        return next;
      });
      setSeenByFriend((previous) => {
        const friendIds = new Set(nextFriends.map((friend) => friend.id));
        const next: Record<string, string> = {};
        for (const [friendId, seenAt] of Object.entries(previous)) {
          if (friendIds.has(friendId) && seenAt) {
            next[friendId] = seenAt;
          }
        }
        return next;
      });
      setSelectedFriendId((previous) => {
        const previousExists = previous
          ? nextFriends.some((friend) => friend.id === previous)
          : false;
        if (previousExists) return previous;
        return null;
      });
    } catch (error) {
      console.error(error);
      setFriends([]);
      setFriendsError(t("chatFailedLoadFriends"));
    } finally {
      setFriendsLoading(false);
    }
  }, [mapChatMessage, t]);

  useEffect(() => {
    if (!requestedUserId) {
      setSelectedFriendId((previous) => (previous === null ? previous : null));
      return;
    }
    const requestedExists = friends.some((friend) => friend.id === requestedUserId);
    if (!requestedExists) return;
    setSelectedFriendId((previous) => (previous === requestedUserId ? previous : requestedUserId));
  }, [friends, requestedUserId]);

  const fetchConversation = useCallback(async (token: string, friendId: string) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch(`/api/user/messages/${friendId}?limit=${HISTORY_LIMIT}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as ConversationPayload | null;
      if (!response.ok) {
        setHistoryError(mapChatMessage(payload?.message, "chatFailedLoadMessages"));
        return;
      }

      const mapped = (payload?.messages || []).map((row) => ({
        key: `db-${row.id}`,
        text: row.content,
        fromUserId: row.senderId,
        createdAt: row.createdAt,
      }));

      setMessagesByFriend((previous) => {
        const existing = previous[friendId] || [];
        return {
          ...previous,
          [friendId]: mergeHistoryWithExisting(mapped, existing),
        };
      });
    } catch (error) {
      console.error(error);
      setHistoryError(t("chatFailedLoadMessages"));
    } finally {
      setHistoryLoading(false);
    }
  }, [mapChatMessage, t]);

  const markConversationRead = useCallback((friendId: string) => {
    const socket = socketRef.current;
    const withUserId = Number(friendId);
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!Number.isInteger(withUserId) || withUserId <= 0) return;
    socket.send(JSON.stringify({ type: "markRead", withUserId }));
  }, []);

  const emitChatting = useCallback((withUserId: number, isChatting: boolean) => {
    const payload: PresenceChattingPayload = { withUserId, isChatting };
    window.dispatchEvent(new CustomEvent(PRESENCE_CHATTING_EVENT, { detail: payload }));
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUserId(null);
      setFriendsLoading(false);
      setFriendsError(t("missingAuthToken"));
      return;
    }

    void Promise.all([fetchMe(token), fetchFriends(token)]).catch((error) => {
      console.error(error);
      setFriendsError(error instanceof Error ? error.message : t("chatFailedInitialize"));
      setFriendsLoading(false);
    });
  }, [fetchFriends, fetchMe, t]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !selectedFriendId) return;
    void fetchConversation(token, selectedFriendId);
    setUnreadByFriend((previous) => ({ ...previous, [selectedFriendId]: 0 }));
    markConversationRead(selectedFriendId);
  }, [fetchConversation, markConversationRead, selectedFriendId]);

  useEffect(() => {
    const selectedFriendNumber = Number(selectedFriendId);
    const previousTarget = typingTargetRef.current;
    const hasText = draft.trim().length > 0;

    if (typingStopTimerRef.current !== null) {
      window.clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    if (!Number.isInteger(selectedFriendNumber) || selectedFriendNumber <= 0) {
      if (typingActiveRef.current && previousTarget !== null) {
        emitChatting(previousTarget, false);
      }
      typingActiveRef.current = false;
      typingTargetRef.current = null;
      return;
    }

    if (previousTarget !== null && previousTarget !== selectedFriendNumber && typingActiveRef.current) {
      emitChatting(previousTarget, false);
      typingActiveRef.current = false;
    }

    typingTargetRef.current = selectedFriendNumber;

    if (!hasText) {
      if (typingActiveRef.current) {
        emitChatting(selectedFriendNumber, false);
      }
      typingActiveRef.current = false;
      return;
    }

    emitChatting(selectedFriendNumber, true);
    typingActiveRef.current = true;

    typingStopTimerRef.current = window.setTimeout(() => {
      if (typingActiveRef.current && typingTargetRef.current === selectedFriendNumber) {
        emitChatting(selectedFriendNumber, false);
        typingActiveRef.current = false;
      }
      typingStopTimerRef.current = null;
    }, 5000);
  }, [draft, emitChatting, selectedFriendId]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current !== null) {
        window.clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
      if (typingActiveRef.current && typingTargetRef.current !== null) {
        emitChatting(typingTargetRef.current, false);
      }
      typingActiveRef.current = false;
      typingTargetRef.current = null;
    };
  }, [emitChatting]);

  useEffect(() => {
    if (!selectedFriendId) return;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedFriendId, selectedMessages]);

  useEffect(() => {
    const textarea = draftInputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const computed = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computed.lineHeight) || 20;
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
    const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0;
    const maxHeight =
      lineHeight * DRAFT_MAX_ROWS + paddingTop + paddingBottom + borderTop + borderBottom;

    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [draft, selectedFriendId]);

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
      setSocketReady(false);

      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (socket.readyState === WebSocket.CONNECTING) {
        socket.addEventListener("open", () => {
          try {
            socket.close();
          } catch {
          }
        }, { once: true });
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
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws/chat`, token);
      socketRef.current = socket;

      socket.onopen = () => {
        setSocketReady(true);
        setSocketError(null);
        const selectedFriend = selectedFriendIdRef.current;
        if (selectedFriend) {
          markConversationRead(selectedFriend);
        }
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as ChatWsMessage;

          if (payload.type === "registered") {
            setCurrentUserId(payload.userId);
            return;
          }

          if (payload.type === "unreadSnapshot") {
            setUnreadByFriend(payload.unreadByUserId || {});
            return;
          }

          if (payload.type === "readSnapshot") {
            setSeenByFriend(payload.seenByUserId || {});
            return;
          }

          if (payload.type === "unreadUpdate") {
            const friendId = String(payload.userId);
            setUnreadByFriend((previous) => {
              if (!Number.isInteger(payload.count) || payload.count <= 0) {
                if (!(friendId in previous)) return previous;
                const next = { ...previous };
                delete next[friendId];
                return next;
              }
              return { ...previous, [friendId]: payload.count };
            });
            return;
          }

          if (payload.type === "readUpdate") {
            const friendId = String(payload.userId);
            if (!payload.seenAt) return;
            setSeenByFriend((previous) => ({ ...previous, [friendId]: payload.seenAt }));
            return;
          }

          if (payload.type === "message") {
            const fromKey = String(payload.fromUserId);
            const receivedAt = new Date().toISOString();
            const incoming: ChatMessageItem = {
              key: `ws-${payload.fromUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              text: payload.message,
              fromUserId: payload.fromUserId,
              createdAt: receivedAt,
            };

            setMessagesByFriend((previous) => ({
              ...previous,
              [fromKey]: [...(previous[fromKey] || []), incoming],
            }));

            setUnreadByFriend((previous) => {
              if (selectedFriendIdRef.current === fromKey) {
                if ((previous[fromKey] || 0) === 0) return previous;
                return { ...previous, [fromKey]: 0 };
              }
              return previous;
            });
            if (selectedFriendIdRef.current === fromKey) {
              markConversationRead(fromKey);
            }
            return;
          }

          if (payload.type === "error") {
            setSocketError(mapChatMessage(payload.message, "chatRealtimeError"));
          }
        } catch {
          setSocketError(t("chatRealtimeParseError"));
        }
      };

      socket.onclose = () => {
        setSocketReady(false);
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        if (!disposed && getAuthToken()) {
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      };

      socket.onerror = () => {
        setSocketReady(false);
        setSocketError(t("chatRealtimeConnectionError"));
      };
    };

    connect();

    const reconnectSocket = () => {
      closeSocket();
      connect();
    };

    window.addEventListener("storage", reconnectSocket);
    window.addEventListener(AUTH_CHANGED_EVENT, reconnectSocket);

    return () => {
      disposed = true;
      clearReconnectTimer();
      window.removeEventListener("storage", reconnectSocket);
      window.removeEventListener(AUTH_CHANGED_EVENT, reconnectSocket);
      closeSocket();
    };
  }, [mapChatMessage, markConversationRead, t]);

  const handleSelectFriend = (friendId: string) => {
    if (requestedUserId !== friendId) {
      router.replace(`/chat?userId=${friendId}`, { scroll: false });
      setRequestedUserId(friendId);
    }
    setSelectedFriendId(friendId);
    setDraft("");
    setUnreadByFriend((previous) => ({ ...previous, [friendId]: 0 }));
    markConversationRead(friendId);
  };

  const handleSend = useCallback(() => {
    setSendingError(null);
    if (!selectedFriendId) {
      setSendingError(t("chatSelectFriendFirst"));
      return;
    }

    const text = draft.trim();
    if (!text) return;

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setSendingError(t("chatConnectionNotReady"));
      return;
    }

    const toUserId = Number(selectedFriendId);
    if (!Number.isInteger(toUserId) || toUserId <= 0) {
      setSendingError(t("chatInvalidFriendId"));
      return;
    }

    socket.send(
      JSON.stringify({
        type: "send",
        toUserId,
        message: text,
      })
    );

    if (currentUserId !== null) {
      const localMessage: ChatMessageItem = {
        key: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        fromUserId: currentUserId,
        createdAt: new Date().toISOString(),
      };

      setMessagesByFriend((previous) => ({
        ...previous,
        [selectedFriendId]: [...(previous[selectedFriendId] || []), localMessage],
      }));
      setSeenByFriend((previous) => {
        const next = { ...previous };
        delete next[selectedFriendId];
        return next;
      });
    }

    setDraft("");
  }, [currentUserId, draft, selectedFriendId, t]);

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      <main className="min-h-[calc(100vh-160px)] px-3 sm:px-6 py-8 sm:py-10">
        <div className="w-full max-w-375 mx-auto -translate-y-16 sm:-translate-y-18">
          <header className="pl-12 sm:pl-0 mb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">{t("social")}</p>
            <h1 className="text-3xl font-semibold">{t("chatTitle")}</h1>
          </header>

          <CardPanel className="w-full! lg:w-full! max-w-none h-auto! min-h-[62vh]! lg:h-[calc(100vh-320px)]! p-3! md:p-4!">
            <div className="grid h-full w-full gap-3 md:gap-4 lg:grid-cols-[320px_1fr]">
              <CardPanelSolid className="w-full! h-auto! lg:h-full! mx-0! p-4! items-stretch min-h-0">
                <div className="rounded-xl border border-black/10 bg-black/5 px-3 py-2">
                  <p className="text-sm font-semibold">{t("chatDirectMessages")}</p>
                </div>

                <TextInput
                  placeholder={t("chatSearchFriend")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full mt-3"
                />

                <div className="mt-3 flex-1 min-h-64 overflow-y-auto pr-1 space-y-2">
                  {friendsError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {friendsError}
                    </div>
                  )}

                  {friendsLoading && (
                    <div className="space-y-2">
                      {[1, 2, 3].map((row) => (
                        <div
                          key={`friend-skeleton-${row}`}
                          className="h-16 rounded-xl bg-black/10 animate-pulse"
                        />
                      ))}
                    </div>
                  )}

                  {!friendsLoading &&
                    filteredFriends.map((friend) => {
                      const isSelected = friend.id === selectedFriendId;
                      const unread = unreadByFriend[friend.id] || 0;
                      const friendId = Number(friend.id);
                      const presence =
                        Number.isInteger(friendId) && friendId > 0
                          ? presenceByUserId[friendId]
                          : undefined;
                      const status = presence?.status ?? "offline";
                      const statusDotClass =
                        status === "online"
                          ? "bg-emerald-500"
                          : status === "chatting"
                            ? "bg-[#7c3aed]"
                          : status === "in-game"
                            ? "bg-amber-500"
                            : "bg-red-500";
                      const isTyping =
                        Number.isInteger(friendId) && friendId > 0 ? isChattingToMe(friendId) : false;
                      const statusLabel =
                        status === "online"
                          ? t("statusOnline")
                          : status === "chatting"
                            ? t("statusChatting")
                            : status === "in-game"
                              ? t("statusInGame")
                              : t("statusOffline");
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => handleSelectFriend(friend.id)}
                          className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                            isSelected
                              ? "border-black/20 bg-white/80"
                              : "border-black/5 bg-white/50 hover:bg-white/70"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-white border border-black/10">
                              <Image
                                src={getAvatarSrc(friend)}
                                alt={`${friend.username} ${t("avatarAltSuffix")}`}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                                onError={() => {
                                  setBrokenAvatarIds((previous) => ({ ...previous, [friend.id]: true }));
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium">{friend.username}</p>
                                <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
                                {isTyping && (
                                  <span className="text-xs text-[#9D33FA] font-medium truncate">
                                    {t("chatTyping")}
                                  </span>
                                )}
                              </div>
                              {unread > 0 && (
                                <p className="text-xs text-foreground/60 truncate">{`${unread} ${t("chatUnreadSuffix")}`}</p>
                              )}
                              <p className="text-xs text-foreground/60 truncate">{statusLabel}</p>
                            </div>
                            {unread > 0 && (
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#9D33FA] px-1.5 text-xs font-semibold text-white">
                                {unread}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}

                  {!friendsLoading && filteredFriends.length === 0 && (
                    <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-foreground/60">
                      {t("chatNoFriendFound")}
                    </div>
                  )}
                </div>
              </CardPanelSolid>

              <CardPanelSolid className="w-full! h-[65vh]! lg:h-full! mx-0! p-0! items-stretch min-h-0 overflow-hidden">
                <div className="h-full flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 bg-white/60">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("chatConversation")}</p>
                      <h2 className="text-xl font-semibold">
                        {selectedFriend ? selectedFriend.username : t("chatSelectFriend")}
                      </h2>
                      <p
                        className={`text-xs min-h-4 ${
                          selectedFriend && peerIsChatting ? "text-foreground/60" : "text-transparent"
                        }`}
                      >
                        {t("chatTyping")}
                      </p>
                    </div>
                    <div className="text-xs font-medium">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                          socketReady
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${socketReady ? "bg-emerald-500" : "bg-amber-500"}`}
                        />
                        {socketReady ? t("chatConnected") : t("chatReconnecting")}
                      </span>
                    </div>
                  </div>

                  <ChatMessagesPanel
                    selectedFriendName={selectedFriend?.username || null}
                    historyLoading={historyLoading}
                    historyError={historyError}
                    socketError={socketError}
                    messages={selectedMessages}
                    currentUserId={currentUserId}
                    seenAt={selectedFriendId ? seenByFriend[selectedFriendId] || null : null}
                    pickFriendPrompt={t("chatPickFriendPrompt")}
                    noMessagesYet={t("chatNoMessagesYet")}
                    seenLabel={t("chatSeen")}
                    messageEndRef={messageEndRef}
                  />

                  <div className="border-t border-black/10 px-3 py-3 bg-white/70">
                    {selectedFriend ? (
                      <>
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleSend();
                          }}
                        >
                          <textarea
                            ref={draftInputRef}
                            placeholder={t("chatWriteMessage")}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                handleSend();
                              }
                            }}
                            className="w-full px-4 py-2 rounded-lg border-2 border-black/10 bg-[#F5F5F5] text-black focus:outline-none focus:ring-2 focus:ring-black/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none leading-5"
                            maxLength={1000}
                            rows={1}
                          />
                          <ButtonBasic1
                            type="submit"
                            disabled={!draft.trim()}
                            className="w-28! h-11!"
                          >
                            {t("chatSend")}
                          </ButtonBasic1>
                        </form>
                        <p className="mt-2 min-h-5 text-xs text-red-600">{sendingError || ""}</p>
                      </>
                    ) : (
                      <p className="text-sm text-foreground/60 px-1 py-2">
                        {t("chatSelectFriendToWrite")}
                      </p>
                    )}
                  </div>
                </div>
              </CardPanelSolid>
            </div>
          </CardPanel>
        </div>
      </main>
    </div>
  );
}
