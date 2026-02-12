"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { TextInput } from "@/components/atoms/TextInput";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { AUTH_CHANGED_EVENT } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from "@/lib/avatar";
import { getUserIdFromStoredToken } from "@/lib/authToken";
import {
  PRESENCE_MESSAGE_EVENT,
  PRESENCE_WATCH_EVENT,
  type PresenceSnapshot,
  type PresenceWatchPayload,
  type PresenceWsMessage,
} from "@/lib/presenceEvents";

type FriendStatus = "online" | "chatting" | "in-game" | "offline";

type Friend = {
  id: string;
  name: string;
  status: FriendStatus;
  isChatting?: boolean;
  lastSeen?: string;
  profileImage?: string;
};

type FriendRequest = {
  id: string;
  fromUserId: number;
  name: string;
  mutuals: number;
};

function formatLastSeen(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export default function FriendsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [inviteStatus, setInviteStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsActionLoading, setRequestsActionLoading] = useState<number | null>(null);
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null);
  const [brokenAvatarIds, setBrokenAvatarIds] = useState<Record<string, boolean>>({});
  const [presenceUserId, setPresenceUserId] = useState<number | null>(() => getUserIdFromStoredToken());
  const friendSkeletonRows = [1, 2, 3];
  const requestSkeletonRows = [1, 2];

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("accessToken") || ""
      : "";

  const filteredFriends = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return friends;
    return friends.filter((friend) => friend.name.toLowerCase().includes(term));
  }, [query, friends]);

  const statusTextClass = (status: FriendStatus) => {
    if (status === "online") return "text-emerald-700";
    if (status === "chatting") return "text-[#6d28d9]";
    if (status === "in-game") return "text-amber-700";
    return "text-slate-600";
  };

  const statusTextBgClass = (status: FriendStatus) => {
    if (status === "online") return "bg-emerald-100";
    if (status === "chatting") return "bg-[#ede9fe]";
    if (status === "in-game") return "bg-amber-100";
    return "bg-red-100";
  };

  const statusDotClass = (status: FriendStatus) => {
    if (status === "online") return "bg-emerald-500";
    if (status === "chatting") return "bg-[#7c3aed]";
    if (status === "in-game") return "bg-amber-500";
    return "bg-red-500";
  };

  const getAvatarSrc = (friend: Friend) => {
    if (brokenAvatarIds[friend.id]) {
      return DEFAULT_AVATAR_PATH;
    }
    return resolveAvatarUrl(friend.profileImage);
  };

  const mapFriendApiMessage = useCallback(
    (message?: string, fallbackKey?: string) => {
      if (!message) {
        return fallbackKey ? t(fallbackKey) : t("serverUnavailable");
      }

      const mapping: Record<string, string> = {
        "Friend request already exists": "friendRequestAlreadyExists",
        "Already friends": "alreadyFriends",
        "Cannot add yourself": "cannotAddYourself",
        "Friend request accepted": "friendRequestAcceptedAuto",
        "Friend not found": "friendNotFound",
        "Failed to load friend requests": "failedLoadFriendRequests",
        "Failed to load friends": "failedLoadFriends",
        "User not found": "userNotFound",
        "Missing token": "missingAuthToken",
      };

      const key = mapping[message];
      if (key) {
        return t(key);
      }
      return message;
    },
    [t]
  );

  const fetchFriends = useCallback(async (token: string) => {
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const response = await fetch(`/api/user/friends`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            friends?: { id: number; username: string; profileImage?: string | null }[];
          }
        | null;

      if (!response.ok) {
        setFriendsError(mapFriendApiMessage(payload?.message, "failedLoadFriends"));
        setFriends([]);
        return;
      }

      setFriends((previous) => {
        const previousById = new Map(previous.map((friend) => [friend.id, friend]));
        return (payload?.friends || []).map((friend) => {
          const id = String(friend.id);
          const existing = previousById.get(id);
          return {
            id,
            name: friend.username,
            status: existing?.status ?? ("offline" as const),
            isChatting: existing?.isChatting ?? false,
            lastSeen: existing?.lastSeen,
            profileImage: friend.profileImage || undefined,
          };
        });
      });
    } catch (error) {
      console.error(error);
      setFriendsError(t("failedLoadFriends"));
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  }, [mapFriendApiMessage, t]);

  const fetchFriendRequests = useCallback(async (token: string) => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const response = await fetch(`/api/user/friends/requests`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            requests?: {
              id: number;
              mutualFriendsCount?: number;
              user?: { id: number; username: string };
            }[];
          }
        | null;

      if (!response.ok) {
        setRequestsError(mapFriendApiMessage(payload?.message, "failedLoadFriendRequests"));
        setRequests([]);
        return;
      }

      const mapped = (payload?.requests || [])
        .filter((request) => request.user?.id && request.user?.username)
        .map((request) => ({
          id: String(request.id),
          fromUserId: request.user!.id,
          name: request.user!.username,
          mutuals: request.mutualFriendsCount ?? 0,
        }));

      setRequests(mapped);
    } catch (error) {
      console.error(error);
      setRequestsError(t("failedLoadFriendRequests"));
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [mapFriendApiMessage, t]);

  const refreshFriendsData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setFriendsLoading(false);
      setRequestsLoading(false);
      setFriends([]);
      setRequests([]);
      setFriendsError(t("missingAuthToken"));
      setRequestsError(t("missingAuthToken"));
      return;
    }
    await Promise.all([fetchFriends(token), fetchFriendRequests(token)]);
  }, [fetchFriendRequests, fetchFriends, t]);

  useEffect(() => {
    void refreshFriendsData();
  }, [refreshFriendsData]);

  useEffect(() => {
    const syncUserIdFromToken = () => {
      const userId = getUserIdFromStoredToken();
      setPresenceUserId(userId);
    };
    syncUserIdFromToken();
    window.addEventListener("storage", syncUserIdFromToken);
    window.addEventListener(AUTH_CHANGED_EVENT, syncUserIdFromToken);
    return () => {
      window.removeEventListener("storage", syncUserIdFromToken);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUserIdFromToken);
    };
  }, []);

  const friendIdsForPresence = useMemo(
    () =>
      friends
        .map((friend) => Number(friend.id))
        .filter((id) => Number.isInteger(id) && id > 0),
    [friends]
  );
  const friendIdsKey = useMemo(
    () => friendIdsForPresence.join(","),
    [friendIdsForPresence]
  );

  useEffect(() => {
    const applyPresenceSnapshot = (users: PresenceSnapshot[]) => {
      const byId = new Map(users.map((entry) => [String(entry.userId), entry]));
      setFriends((previous) => {
        let changed = false;
        const next = previous.map((friend) => {
          const presence = byId.get(friend.id);
          if (!presence) return friend;
          const lastSeen = formatLastSeen(presence.lastSeen);
          if (friend.status === presence.status && friend.lastSeen === lastSeen) {
            return friend;
          }
          changed = true;
          return {
            ...friend,
            status: presence.status,
            lastSeen,
          };
        });
        return changed ? next : previous;
      });
    };

    const applyChattingSnapshot = (
      users: Array<{ userId: number; withUserId: number | null; isChatting: boolean }>
    ) => {
      setFriends((previous) => {
        let changed = false;
        const byId = new Map(users.map((entry) => [String(entry.userId), entry]));
        const next = previous.map((friend) => {
          const chatting = byId.get(friend.id);
          if (!chatting) return friend;
          const isChattingForMe =
            Boolean(chatting.isChatting) &&
            presenceUserId !== null &&
            chatting.withUserId === presenceUserId;
          if ((friend.isChatting ?? false) === isChattingForMe) {
            return friend;
          }
          changed = true;
          return { ...friend, isChatting: isChattingForMe };
        });
        return changed ? next : previous;
      });
    };

    const handlePresenceMessage = (event: Event) => {
      const customEvent = event as CustomEvent<PresenceWsMessage>;
      const message = customEvent.detail;
      if (!message) return;
      if (message.type === "registered") {
        setPresenceUserId(message.userId);
        return;
      }
      if (message.type === "presenceSnapshot") {
        applyPresenceSnapshot(message.users);
        return;
      }
      if (message.type === "presenceUpdate") {
        applyPresenceSnapshot([message.user]);
        return;
      }
      if (message.type === "chattingSnapshot") {
        applyChattingSnapshot(message.users);
        return;
      }
      if (message.type === "chattingUpdate") {
        applyChattingSnapshot([
          {
            userId: message.userId,
            withUserId: message.withUserId,
            isChatting: message.isChatting,
          },
        ]);
      }
    };

    window.addEventListener(PRESENCE_MESSAGE_EVENT, handlePresenceMessage as EventListener);
    return () => {
      window.removeEventListener(PRESENCE_MESSAGE_EVENT, handlePresenceMessage as EventListener);
    };
  }, [presenceUserId]);

  useEffect(() => {
    const userIds = friendIdsKey
      ? friendIdsKey
          .split(",")
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      : [];
    const payload: PresenceWatchPayload = { userIds };
    window.dispatchEvent(new CustomEvent(PRESENCE_WATCH_EVENT, { detail: payload }));
  }, [friendIdsKey]);

  const handleSendRequest = async () => {
    const trimmed = inviteInput.trim();
    if (!trimmed) {
      setInviteStatus({ type: "error", message: t("enterUsernameOrId") });
      return;
    }

    const token = getToken();
    if (!token) {
      setInviteStatus({ type: "error", message: t("missingAuthToken") });
      return;
    }

    setInviteStatus({ type: "loading" });
    try {
      const numericId = Number(trimmed);
      const requestBody =
        !Number.isNaN(numericId) && Number.isFinite(numericId)
          ? { toUserId: numericId }
          : { toUsername: trimmed };

      const response = await fetch(`/api/user/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const payload = (await response.json().catch(() => null)) as
        | { status?: string; message?: string }
        | null;
      if (!response.ok) {
        setInviteStatus({
          type: "error",
          message: mapFriendApiMessage(payload?.message, "failedSendRequest"),
        });
        return;
      }

      setInviteStatus({
        type: "success",
        message: mapFriendApiMessage(payload?.message, "requestSent"),
      });
      setInviteInput("");
      await refreshFriendsData();
    } catch (error) {
      console.error(error);
      setInviteStatus({ type: "error", message: t("failedSendRequest") });
    }
  };

  const handleAcceptRequest = async (fromUserId: number) => {
    const token = getToken();
    if (!token) {
      setRequestsError(t("missingAuthToken"));
      return;
    }

    setRequestsActionLoading(fromUserId);
    try {
      const response = await fetch(`/api/user/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fromUserId }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setRequestsError(mapFriendApiMessage(payload?.message, "failedAcceptRequest"));
        return;
      }

      setRequestsError(null);
      await refreshFriendsData();
    } catch (error) {
      console.error(error);
      setRequestsError(t("failedAcceptRequest"));
    } finally {
      setRequestsActionLoading(null);
    }
  };

  const handleRejectRequest = async (fromUserId: number) => {
    const token = getToken();
    if (!token) {
      setRequestsError(t("missingAuthToken"));
      return;
    }

    setRequestsActionLoading(fromUserId);
    try {
      const response = await fetch(`/api/user/friends/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fromUserId }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setRequestsError(mapFriendApiMessage(payload?.message, "failedRejectRequest"));
        return;
      }

      setRequestsError(null);
      await refreshFriendsData();
    } catch (error) {
      console.error(error);
      setRequestsError(t("failedRejectRequest"));
    } finally {
      setRequestsActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const token = getToken();
    if (!token) {
      setFriendsError(t("missingAuthToken"));
      return;
    }

    const toUserId = Number(friendId);
    if (!Number.isFinite(toUserId)) {
      setFriendsError(t("failedRemoveFriend"));
      return;
    }

    setFriendActionLoading(friendId);
    try {
      const response = await fetch(`/api/user/friends/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setFriendsError(mapFriendApiMessage(payload?.message, "failedRemoveFriend"));
        return;
      }

      setFriendsError(null);
      await refreshFriendsData();
    } catch (error) {
      console.error(error);
      setFriendsError(t("failedRemoveFriend"));
    } finally {
      setFriendActionLoading(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      <main className="min-h-[calc(100vh-160px)] px-4 sm:px-6 py-8 sm:py-10">
        <div className="w-full max-w-375 mx-auto flex flex-col gap-6 -translate-y-16 sm:-translate-y-18">
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pl-12 sm:pl-0">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-foreground/70">{t("social")}</p>
              <h1 className="text-3xl font-semibold">{t("friendsList")}</h1>
            </div>
            <div className="w-full md:w-auto">
              <TextInput
                placeholder={t("searchFriends")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full md:w-80"
              />
            </div>
          </header>

          <CardPanel className="w-full! lg:w-full! max-w-none h-auto! min-h-[58vh]! lg:h-[calc(100vh-320px)]! p-4! md:p-6! flex flex-col gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr] w-full lg:h-full">
          <div className="flex flex-col gap-6 lg:min-h-0">
            <CardPanelSolid className="w-full! mx-0! h-auto! lg:h-full! p-6! items-stretch flex flex-col lg:min-h-0">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{t("activeFriends")}</h2>
                  <p className="text-sm text-foreground/70 min-h-5">
                    {friendsLoading
                      ? t("loadingFriends")
                      : `${filteredFriends.length} ${t("friendsCountUnit")} • ${
                          filteredFriends.filter((f) => f.status === "online" || f.status === "chatting").length
                        } ${t("statusOnline")}`}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 min-h-80 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                {friendsError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {friendsError}
                  </div>
                )}
                {friendsLoading &&
                  friendSkeletonRows.map((row) => (
                    <div
                      key={`friend-skeleton-${row}`}
                      className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white/50 p-4 md:flex-row md:items-center md:justify-between animate-pulse"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-black/10" />
                        <div className="space-y-2">
                          <div className="h-6 w-40 rounded bg-black/10" />
                          <div className="h-4 w-24 rounded bg-black/10" />
                        </div>
                      </div>
                      <div className="h-10 w-28 rounded-full bg-black/10" />
                    </div>
                  ))}
                {filteredFriends.map((friend) => {
                  const isChatting = Boolean(friend.isChatting);
                  const badgeClass = isChatting
                    ? "text-[#6d28d9] bg-[#ede9fe]"
                    : `${statusTextClass(friend.status)} ${statusTextBgClass(friend.status)}`;
                  const badgeLabel = isChatting
                    ? t("statusChatting")
                    : friend.status === "online"
                      ? t("statusOnline")
                      : friend.status === "chatting"
                        ? t("statusChatting")
                      : friend.status === "in-game"
                        ? t("statusInGame")
                        : t("statusOffline");
                  return (
                    <div
                      key={friend.id}
                      className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white/70 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 rounded-full overflow-visible">
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-white/60 border border-black/10">
                            <Image
                              src={getAvatarSrc(friend)}
                              alt={`${friend.name} ${t("avatarAltSuffix")}`}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              onError={() => {
                                setBrokenAvatarIds((prev) => ({ ...prev, [friend.id]: true }));
                              }}
                            />
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${statusDotClass(friend.status)}`}
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <p className="text-xl md:text-2xl font-semibold leading-tight">{friend.name}</p>
                          <p className="text-sm text-foreground/70">
                            {friend.lastSeen ? `${t("lastSeen")} ${friend.lastSeen}` : ""}
                          </p>
                          <p
                            className={`inline-flex mt-1 rounded-md px-2 py-0.5 text-sm font-medium ${badgeClass}`}
                          >
                            {badgeLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <ButtonBasic1
                          onClick={() => router.push(`/chat?userId=${friend.id}`)}
                          className="w-28! h-10! text-sm"
                        >
                          {t("messageAction")}
                        </ButtonBasic1>
                        <ButtonBasic1
                          variant="secondary"
                          onClick={() => void handleRemoveFriend(friend.id)}
                          disabled={friendActionLoading === friend.id}
                          className="w-28! h-10! text-sm"
                        >
                          {friendActionLoading === friend.id ? "..." : t("remove")}
                        </ButtonBasic1>
                      </div>
                    </div>
                  );
                })}
                {!friendsLoading && filteredFriends.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-black/20 p-10 text-center text-foreground/60">
                    {friendsError ? t("unableLoadFriends") : t("noFriendsMatch")}
                  </div>
                )}
              </div>
            </CardPanelSolid>
          </div>

          <aside className="flex flex-col gap-6 lg:h-full lg:min-h-0">
            <CardPanelSolid className="w-full! mx-0! h-auto! p-6! items-stretch">
              <h2 className="text-xl font-semibold">{t("addFriend")}</h2>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <TextInput
                  placeholder={t("usernameOrEmail")}
                  value={inviteInput}
                  onChange={(event) => setInviteInput(event.target.value)}
                  className="flex-1"
                />
                <ButtonBasic1
                  onClick={handleSendRequest}
                  disabled={inviteStatus.type === "loading"}
                  className="w-full! md:w-56! h-12! shrink-0"
                >
                  {inviteStatus.type === "loading" ? t("sending") : t("sendRequest")}
                </ButtonBasic1>
              </div>
              <p
                className={`mt-3 text-sm min-h-5 ${
                  inviteStatus.type === "idle"
                    ? "text-transparent"
                    : inviteStatus.type === "error"
                    ? "text-red-600"
                    : "text-emerald-700"
                }`}
              >
                {inviteStatus.type === "idle" ? "." : inviteStatus.message}
              </p>
            </CardPanelSolid>
            <CardPanelSolid className="w-full! mx-0! h-auto! lg:h-full! p-6! items-stretch flex flex-col lg:min-h-0">
              <h2 className="text-xl font-semibold">{t("requests")}</h2>
              <p className="text-sm text-foreground/70 min-h-5">
                {requestsLoading ? t("loading") : `${requests.length} ${t("pending")}`}
              </p>
              <div className="mt-4 space-y-3 min-h-55 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                {requestsError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {requestsError}
                  </div>
                )}
                {requestsLoading &&
                  requestSkeletonRows.map((row) => (
                    <div
                      key={`request-skeleton-${row}`}
                      className="rounded-2xl border border-black/5 bg-white/50 p-4 flex flex-col gap-3 animate-pulse"
                    >
                      <div className="space-y-2">
                        <div className="h-5 w-32 rounded bg-black/10" />
                        <div className="h-4 w-24 rounded bg-black/10" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-28 rounded-full bg-black/10" />
                        <div className="h-10 w-28 rounded-full bg-black/10" />
                      </div>
                    </div>
                  ))}
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-black/5 bg-white/70 p-4 flex flex-col gap-3"
                  >
                    <div>
                      <p className="font-semibold">{request.name}</p>
                      <p className="text-sm text-foreground/70">
                        {request.mutuals} {t("mutualFriends")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ButtonBasic1
                        onClick={() => void handleAcceptRequest(request.fromUserId)}
                        disabled={requestsActionLoading === request.fromUserId}
                        className="w-28! h-10! text-sm"
                      >
                        {requestsActionLoading === request.fromUserId ? "..." : t("accept")}
                      </ButtonBasic1>
                      <ButtonBasic1
                        variant="secondary"
                        onClick={() => void handleRejectRequest(request.fromUserId)}
                        disabled={requestsActionLoading === request.fromUserId}
                        className="w-28! h-10! text-sm"
                      >
                        {requestsActionLoading === request.fromUserId ? "..." : t("decline")}
                      </ButtonBasic1>
                    </div>
                  </div>
                ))}
                {!requestsLoading && requests.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-black/20 p-8 text-center text-foreground/60">
                    {t("noPendingRequests")}
                  </div>
                )}
              </div>
            </CardPanelSolid>
          </aside>
          </section>
          </CardPanel>
        </div>
      </main>
    </div>
  );
}
