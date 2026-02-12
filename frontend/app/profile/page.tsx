"use client";

import { useRouter } from "next/navigation";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { ProfileShell } from "@/components/molecules/profile/ProfileShell";
import { ProfileIdentityCard } from "@/components/molecules/profile/ProfileIdentityCard";
import { ProfileInfoRowsCard } from "@/components/molecules/profile/ProfileInfoRowsCard";
import { ProfileActionsCard } from "@/components/molecules/profile/ProfileActionsCard";
import { ProfileComicBubble } from "@/components/molecules/profile/ProfileComicBubble";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from "@/lib/avatar";
import { FetchJsonError, fetchJson } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

const MAX_PROFILE_TEXT_LENGTH = 80;
type UserStats = { gamesPlayed: number; gamesWon: number };

export default function MyProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { logout, updateMe } = useAuth();
  const { me, isReady } = useRequireAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [profileTextDraft, setProfileTextDraft] = useState("");
  const [profileTextSaved, setProfileTextSaved] = useState(false);
  const [profileTextError, setProfileTextError] = useState("");
  const [isSavingProfileText, setIsSavingProfileText] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const isLoading = !isReady || !me;
  const profileImage = resolveAvatarUrl(me?.profileImage || DEFAULT_AVATAR_PATH);
  const displayUsername = isLoading ? t("loading") : me.username;
  const displayEmail = isLoading ? t("loading") : me.email;
  const displayGamesPlayed = statsLoading ? t("loading") : String(stats?.gamesPlayed ?? 0);
  const displayGamesWon = statsLoading ? t("loading") : String(stats?.gamesWon ?? 0);
  const savedProfileText = me?.profileText ?? "";
  const profileTextRemaining = MAX_PROFILE_TEXT_LENGTH - profileTextDraft.length;
  const profileTextChanged = profileTextDraft !== savedProfileText;
  const publicProfileText = useMemo(() => {
    const trimmed = savedProfileText.trim();
    return trimmed.length > 0 ? trimmed : t("profileTextEmpty");
  }, [savedProfileText, t]);

  useEffect(() => {
    setProfileTextDraft(me?.profileText ?? "");
  }, [me?.profileText]);

  useEffect(() => {
    const loadStats = async () => {
      if (!me?.id) {
        setStats(null);
        return;
      }
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) {
        setStats(null);
        return;
      }
      try {
        setStatsLoading(true);
        const next = await fetchJson<UserStats>("/api/user/me/stats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats({
          gamesPlayed: typeof next.gamesPlayed === "number" ? next.gamesPlayed : 0,
          gamesWon: typeof next.gamesWon === "number" ? next.gamesWon : 0,
        });
      } catch {
        setStats({ gamesPlayed: 0, gamesWon: 0 });
      } finally {
        setStatsLoading(false);
      }
    };
    void loadStats();
  }, [me?.id]);
  const handleBackToPrevious = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace("/friends");
  };

  const handleLogout = () => {
    logout();
    router.replace("/landing/signin");
  };

  const handleDeleteAccount = async () => {
    if (!me?.id || isDeleting) {
      return;
    }
    if (!window.confirm(t("confirmDeleteAccount"))) {
      return;
    }
    setDeleteError("");
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) {
        logout();
        router.replace("/landing/signin");
        return;
      }
      await fetchJson<{ status: string }>(
        `/api/user/${me.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        {
          defaultMessage: t("failedDeleteAccount"),
          statusMessages: {
            400: t("failedDeleteAccount"),
            401: t("failedDeleteAccount"),
            403: t("failedDeleteAccount"),
            404: t("failedDeleteAccount"),
            500: t("failedDeleteAccount"),
          },
        }
      );
      logout();
      router.replace("/landing/signin");
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setDeleteError(t("serverUnavailable"));
      } else if (error instanceof FetchJsonError) {
        setDeleteError(error.message || t("failedDeleteAccount"));
      } else if (error instanceof Error) {
        setDeleteError(error.message);
      } else {
        setDeleteError(t("failedDeleteAccount"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveProfileText = async () => {
    if (!me?.id || isSavingProfileText || profileTextDraft.length > MAX_PROFILE_TEXT_LENGTH) {
      return;
    }
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) {
      setProfileTextError(t("missingAuthToken"));
      return;
    }
    try {
      setProfileTextSaved(false);
      setProfileTextError("");
      setIsSavingProfileText(true);
      const payload = await fetchJson<{ profileText?: string | null }>(
        `/api/user/${me.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profileText: profileTextDraft }),
        },
        {
          defaultMessage: t("failedSaveProfileText"),
          statusMessages: {
            400: t("failedSaveProfileText"),
            401: t("failedSaveProfileText"),
            403: t("failedSaveProfileText"),
            404: t("failedSaveProfileText"),
            409: t("failedSaveProfileText"),
            500: t("failedSaveProfileText"),
          },
        }
      );
      const normalized = payload.profileText ?? "";
      setProfileTextDraft(normalized);
      updateMe({ profileText: payload.profileText ?? null });
      setProfileTextSaved(true);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setProfileTextError(t("serverUnavailable"));
      } else if (error instanceof FetchJsonError) {
        setProfileTextError(error.message || t("failedSaveProfileText"));
      } else if (error instanceof Error) {
        setProfileTextError(error.message);
      } else {
        setProfileTextError(t("failedSaveProfileText"));
      }
    } finally {
      setIsSavingProfileText(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={handleBackToPrevious} />
      </div>
      <ProfileShell className="max-w-6xl">
        <div className="space-y-6">
          <ProfileIdentityCard
            imageSrc={profileImage}
            imageAlt={t("profilePicture")}
            title={`@${displayUsername}`}
            subtitle={displayEmail}
            badge={t("profileTitle")}
            topBannerContentClassName="top-2 left-[68px] md:left-[76px] -translate-x-1/2"
            topBannerContent={(
              <div className="flex justify-center">
                <ProfileComicBubble text={publicProfileText} compact />
              </div>
            )}
            isLoading={isLoading}
            onImageError={(event) => {
              event.currentTarget.src = DEFAULT_AVATAR_PATH;
            }}
            actions={(
              <ButtonBasic1 onClick={() => router.push("/param")} className="!w-44 !h-11">
                {t("settings")}
              </ButtonBasic1>
            )}
          />

          <section className="rounded-2xl border border-white/65 bg-white/55 backdrop-blur-md px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-2">
              <textarea
                value={profileTextDraft}
                onChange={(event) => {
                  const normalized = event.target.value.replace(/\r\n/g, "\n");
                  const limitedLines = normalized.split("\n").slice(0, 2).join("\n");
                  const nextValue = limitedLines.slice(0, MAX_PROFILE_TEXT_LENGTH);
                  setProfileTextDraft(nextValue);
                  setProfileTextSaved(false);
                  setProfileTextError("");
                }}
                rows={2}
                maxLength={MAX_PROFILE_TEXT_LENGTH}
                placeholder={t("profileTextPlaceholder")}
                className="w-full resize-none rounded-lg border border-emerald-300/70 bg-white/85 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300/50"
              />
              <div className="flex items-center justify-between gap-3">
                <p className={`text-xs ${profileTextRemaining < 25 ? "text-amber-700" : "text-slate-600"}`}>
                  {profileTextRemaining} {t("characters")}
                </p>
                {profileTextChanged ? (
                  <ButtonBasic1
                    onClick={() => void handleSaveProfileText()}
                    disabled={isLoading || isSavingProfileText}
                    className="!h-9 !w-36"
                  >
                    {isSavingProfileText ? t("sending") : t("saveProfileText")}
                  </ButtonBasic1>
                ) : null}
              </div>
              {profileTextSaved ? (
                <p className="text-xs font-medium text-emerald-700">{t("profileTextSaved")}</p>
              ) : null}
              {profileTextError ? (
                <p className="text-xs font-medium text-red-700">{profileTextError}</p>
              ) : null}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
            <ProfileInfoRowsCard
              title={t("profileDetails")}
              rows={[
                { label: t("username"), value: displayUsername },
                { label: t("email"), value: displayEmail, breakValue: true },
                { label: t("gamesPlayed"), value: displayGamesPlayed },
                { label: t("gamesWon"), value: displayGamesWon },
              ]}
            />

            <ProfileActionsCard title={t("profileActions")} className="sm:grid-cols-1">
              <ButtonBasic1 variant="secondary" onClick={() => router.replace("/friends")} className="!w-full !h-12">
                {t("friendsList")}
              </ButtonBasic1>
              <ButtonBasic1 variant="secondary" onClick={handleLogout} className="!w-full !h-12">
                {t("logout")}
              </ButtonBasic1>
            </ProfileActionsCard>
          </div>
        </div>
      </ProfileShell>
      <div className="fixed right-4 sm:right-6 md:right-8 bottom-20 z-40 flex flex-col items-end gap-2">
        <ButtonBasic1
          variant="secondary"
          onClick={handleDeleteAccount}
          disabled={isDeleting || isLoading}
          className="!w-52 !h-10 !bg-red-600 !text-white hover:!bg-red-700"
        >
          {isDeleting ? t("deletingAccount") : t("deleteAccount")}
        </ButtonBasic1>
        {deleteError ? (
          <span className="text-xs font-medium text-red-700">{deleteError}</span>
        ) : null}
      </div>
    </div>
  );
}
