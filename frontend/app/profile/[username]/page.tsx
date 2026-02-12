"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { useLanguage } from "@/components/LanguageProvider";
import { ProfileShell } from "@/components/molecules/profile/ProfileShell";
import { ProfileIdentityCard } from "@/components/molecules/profile/ProfileIdentityCard";
import { ProfileInfoRowsCard } from "@/components/molecules/profile/ProfileInfoRowsCard";
import { ProfileNoticeCard } from "@/components/molecules/profile/ProfileNoticeCard";
import { ProfileComicBubble } from "@/components/molecules/profile/ProfileComicBubble";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { usePresenceWatch } from "@/hooks/usePresenceWatch";
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from "@/lib/avatar";
import { FetchJsonError } from "@/lib/api";

type PublicUser = {
  id: number;
  username: string;
  profileImage?: string | null;
  profileText?: string | null;
};
type UserStats = { gamesPlayed: number; gamesWon: number };

type LoadingState = "loading" | "ready" | "not-found" | "error";
type PublicProfileResult = {
  username: string;
  state: Exclude<LoadingState, "loading"> | "idle";
  user: PublicUser | null;
};

export default function PublicProfilePage() {
  const params = useParams<{ username: string | string[] }>();
  const router = useRouter();
  const { t } = useLanguage();
  const handleBackToPrevious = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace("/friends");
  };
  const { isReady } = useRequireAuth();
  const [result, setResult] = useState<PublicProfileResult>({
    username: "",
    state: "idle",
    user: null,
  });
  const [friendshipCheck, setFriendshipCheck] = useState<{
    targetUserId: number | null;
    canMessage: boolean;
  }>({
    targetUserId: null,
    canMessage: false,
  });
  const [friendActionStatus, setFriendActionStatus] = useState<{
    targetUserId: number | null;
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ targetUserId: null, type: "idle" });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const username = useMemo(() => {
    if (!params?.username) return "";
    return Array.isArray(params.username) ? params.username[0] ?? "" : params.username;
  }, [params]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!username) {
      return;
    }

    const controller = new AbortController();

    void fetch(`/api/user/${encodeURIComponent(username)}`, {
      method: "GET",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404) {
          router.replace("/?error=profile-not-found");
          return;
        }
        if (!response.ok) {
          setResult({ username, state: "error", user: null });
          return;
        }
        const payload = (await response.json().catch(() => null)) as PublicUser | null;
        if (!payload || typeof payload.id !== "number" || typeof payload.username !== "string") {
          setResult({ username, state: "error", user: null });
          return;
        }
        setResult({ username, state: "ready", user: payload });
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === "AbortError") {
          return;
        }
        setResult({ username, state: "error", user: null });
      });

    return () => {
      controller.abort();
    };
  }, [isReady, router, username]);

  const state: LoadingState = useMemo(() => {
    if (!isReady) return "loading";
    if (!username) return "not-found";
    if (result.username !== username || result.state === "idle") return "loading";
    return result.state;
  }, [isReady, result.state, result.username, username]);

  const user = state === "ready" ? result.user : null;
  const displayGamesPlayed = statsLoading ? t("loading") : String(stats?.gamesPlayed ?? 0);
  const displayGamesWon = statsLoading ? t("loading") : String(stats?.gamesWon ?? 0);
  const profileImage = resolveAvatarUrl(user?.profileImage || DEFAULT_AVATAR_PATH);
  const publicProfileText = useMemo(() => {
    const text = user?.profileText?.trim() ?? "";
    return text.length > 0 ? text : null;
  }, [user?.profileText]);
  const watchedUserIds = useMemo(() => (user?.id ? [user.id] : []), [user]);
  const { presenceByUserId, isChattingToMe } = usePresenceWatch(watchedUserIds);
  const status = user?.id ? (presenceByUserId[user.id]?.status ?? "offline") : "offline";
  const isChattingForMe = user?.id ? isChattingToMe(user.id) : false;
  const statusLabel = isChattingForMe
    ? t("statusChatting")
    : status === "online"
      ? t("statusOnline")
      : status === "chatting"
        ? t("statusChatting")
        : status === "in-game"
          ? t("statusInGame")
          : t("statusOffline");
  const statusDotClass = isChattingForMe
    ? "bg-violet-500"
    : status === "online"
      ? "bg-emerald-500"
      : status === "chatting"
        ? "bg-violet-500"
        : status === "in-game"
          ? "bg-amber-500"
          : "bg-red-500";
  const statusChipClass = isChattingForMe
    ? "bg-violet-100/95 text-violet-900 border-violet-300/60"
    : status === "online"
      ? "bg-emerald-100/95 text-emerald-900 border-emerald-300/60"
      : status === "chatting"
        ? "bg-violet-100/95 text-violet-900 border-violet-300/60"
        : status === "in-game"
          ? "bg-amber-100/95 text-amber-900 border-amber-300/60"
          : "bg-red-100/95 text-red-900 border-red-300/60";
  const canMessage = Boolean(
    user?.id &&
      friendshipCheck.targetUserId === user.id &&
      friendshipCheck.canMessage
  );
  const friendActionView =
    user?.id && friendActionStatus.targetUserId === user.id
      ? friendActionStatus
      : { targetUserId: user?.id ?? null, type: "idle" as const, message: undefined };

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.username) {
        setStats(null);
        return;
      }
      try {
        setStatsLoading(true);
        const response = await fetch(`/api/user/${encodeURIComponent(user.username)}/stats`, {
          method: "GET",
        });
        if (!response.ok) {
          setStats({ gamesPlayed: 0, gamesWon: 0 });
          return;
        }
        const payload = (await response.json().catch(() => null)) as Partial<UserStats> | null;
        setStats({
          gamesPlayed: typeof payload?.gamesPlayed === "number" ? payload.gamesPlayed : 0,
          gamesWon: typeof payload?.gamesWon === "number" ? payload.gamesWon : 0,
        });
      } catch {
        setStats({ gamesPlayed: 0, gamesWon: 0 });
      } finally {
        setStatsLoading(false);
      }
    };
    void loadStats();
  }, [user?.username]);

  useEffect(() => {
    if (!isReady || !user?.id) {
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("accessToken") || ""
        : "";
    if (!token) {
      return;
    }

    const controller = new AbortController();

    void fetch("/api/user/friends", {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          setFriendshipCheck({ targetUserId: user.id, canMessage: false });
          return;
        }
        const payload = (await response.json().catch(() => null)) as
          | { friends?: Array<{ id?: number }> }
          | null;
        const isFriend = Boolean(payload?.friends?.some((friend) => friend.id === user.id));
        setFriendshipCheck({ targetUserId: user.id, canMessage: isFriend });
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === "AbortError") {
          return;
        }
        setFriendshipCheck({ targetUserId: user.id, canMessage: false });
      });

    return () => {
      controller.abort();
    };
  }, [isReady, user?.id]);

  const handleAddFriend = async () => {
    if (!user?.id || canMessage) {
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("accessToken") || ""
        : "";
    if (!token) {
      setFriendActionStatus({
        targetUserId: user.id,
        type: "error",
        message: t("missingAuthToken"),
      });
      return;
    }

    setFriendActionStatus({ targetUserId: user.id, type: "loading" });
    try {
      const response = await fetch("/api/user/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId: user.id }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setFriendActionStatus({
          targetUserId: user.id,
          type: "error",
          message: payload?.message || t("failedSendRequest"),
        });
        return;
      }
      setFriendActionStatus({
        targetUserId: user.id,
        type: "success",
        message: t("requestSent"),
      });
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setFriendActionStatus({
          targetUserId: user.id,
          type: "error",
          message: t("serverUnavailable"),
        });
      } else if (error instanceof FetchJsonError) {
        setFriendActionStatus({
          targetUserId: user.id,
          type: "error",
          message: error.message,
        });
      } else {
        setFriendActionStatus({
          targetUserId: user.id,
          type: "error",
          message: t("failedSendRequest"),
        });
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={handleBackToPrevious} />
      </div>
      <ProfileShell className="max-w-6xl">
        <div className="space-y-6 flex flex-col items-center">
          {state === "loading" && (
            <ProfileNoticeCard>{t("loading")}</ProfileNoticeCard>
          )}

          {state === "not-found" && (
            <ProfileNoticeCard tone="error">{t("userNotFound")}</ProfileNoticeCard>
          )}

          {state === "error" && (
            <ProfileNoticeCard tone="error">{t("failedResolveUser")}</ProfileNoticeCard>
          )}

          {state === "ready" && user && (
            <div className="w-full max-w-5xl space-y-5">
                <ProfileIdentityCard
                  imageSrc={profileImage}
                  imageAlt={`${user.username} ${t("avatarAltSuffix")}`}
                  title={`@${user.username}`}
                  badge={t("publicProfileTitle")}
                  topBannerContentClassName="top-2 left-0 right-0 px-5"
                  topBannerContent={(
                    <div className="relative w-full min-h-8">
                      {publicProfileText ? (
                        <div className="absolute left-17 md:left-19 -translate-x-1/2">
                          <ProfileComicBubble text={publicProfileText} compact />
                        </div>
                      ) : null}
                      {canMessage ? (
                        <div className={`absolute right-2 top-2 inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wide shadow-sm ${statusChipClass}`}>
                          <span className={`h-3 w-3 rounded-full ${statusDotClass}`} />
                          <span>{statusLabel}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                  actions={(
                    <div className="flex flex-col items-end justify-end gap-2 min-h-16 pt-2 md:pt-3">
                      {canMessage ? (
                        <ButtonBasic1 onClick={() => router.push(`/chat?userId=${user.id}`)} className="!w-44 !h-11">
                          {t("messageAction")}
                        </ButtonBasic1>
                      ) : (
                        <ButtonBasic1
                          onClick={() => void handleAddFriend()}
                          disabled={friendActionView.type === "loading"}
                          className="!w-44 !h-11"
                        >
                          {friendActionView.type === "loading" ? t("sending") : t("addFriend")}
                        </ButtonBasic1>
                      )}
                      {friendActionView.type !== "idle" ? (
                        <p
                          className={`text-xs text-right ${
                            friendActionView.type === "error" ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {friendActionView.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                  onImageError={(event) => {
                    event.currentTarget.src = DEFAULT_AVATAR_PATH;
                  }}
                />
              <div className="grid gap-5">
                <ProfileInfoRowsCard
                  title={t("profileDetails")}
                  rows={[
                    { label: t("username"), value: user.username },
                    { label: t("gamesPlayed"), value: displayGamesPlayed },
                    { label: t("gamesWon"), value: displayGamesWon },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </ProfileShell>
    </div>
  );
}
