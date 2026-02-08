"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { TextInput } from "@/components/atoms/TextInput";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from "@/lib/avatar";

type FriendStatus = "online" | "in-game" | "offline";

type Friend = {
  id: string;
  name: string;
  status: FriendStatus;
  lastSeen?: string;
  profileImage?: string;
};

type FriendRequest = {
  id: string;
  fromUserId: number;
  name: string;
  mutuals: number;
};

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
    if (status === "in-game") return "text-amber-700";
    return "text-slate-600";
  };

  const statusTextBgClass = (status: FriendStatus) => {
    if (status === "online") return "bg-emerald-100";
    if (status === "in-game") return "bg-amber-100";
    return "bg-red-100";
  };

  const statusDotClass = (status: FriendStatus) => {
    if (status === "online") return "bg-emerald-500";
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

      const mapped = (payload?.friends || []).map((friend) => ({
        id: String(friend.id),
        name: friend.username,
        status: "offline" as const,
        profileImage: friend.profileImage || undefined,
      }));

      setFriends(mapped);
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
        <ButtonCircleBack onClick={() => router.push("/")} />
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
                  {friendsLoading ? (
                    <p className="text-sm text-foreground/70">{t("loadingFriends")}</p>
                  ) : (
                    <p className="text-sm text-foreground/70">
                      {filteredFriends.length} friends •{" "}
                      {filteredFriends.filter((f) => f.status === "online").length}{" "}
                      {t("statusOnline")}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-4 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                {friendsError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {friendsError}
                  </div>
                )}
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white/70 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 rounded-full overflow-visible">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-white/60 border border-black/10">
                        <Image
                          src={getAvatarSrc(friend)}
                          alt={`${friend.name} avatar`}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          unoptimized
                          loader={({ src }) => src}
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
                          className={`inline-flex mt-1 rounded-md px-2 py-0.5 text-sm font-medium ${statusTextClass(
                            friend.status
                          )} ${statusTextBgClass(friend.status)}`}
                        >
                          {friend.status === "online"
                            ? t("statusOnline")
                            : friend.status === "in-game"
                            ? t("statusInGame")
                            : t("statusOffline")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
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
                ))}
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
                  className="w-40! h-12!"
                >
                  {inviteStatus.type === "loading" ? t("sending") : t("sendRequest")}
                </ButtonBasic1>
              </div>
              {inviteStatus.type !== "idle" && (
                <p
                  className={`mt-3 text-sm ${
                    inviteStatus.type === "error" ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {inviteStatus.message}
                </p>
              )}
            </CardPanelSolid>
            <CardPanelSolid className="w-full! mx-0! h-auto! lg:h-full! p-6! items-stretch flex flex-col lg:min-h-0">
              <h2 className="text-xl font-semibold">{t("requests")}</h2>
              <p className="text-sm text-foreground/70">
                {requestsLoading ? t("loading") : `${requests.length} ${t("pending")}`}
              </p>
              <div className="mt-4 space-y-3 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                {requestsError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {requestsError}
                  </div>
                )}
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
