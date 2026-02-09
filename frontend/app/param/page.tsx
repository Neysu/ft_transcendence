"use client";

import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { useLanguage } from "@/components/LanguageProvider";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from "@/lib/avatar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function ParamPage() {
  const { t } = useLanguage();
  const { me, isReady } = useRequireAuth();
  const router = useRouter();
  const isLoading = !isReady || !me;

  const currentEmail = me?.email || "user@example.com";
  const currentUsername = me?.username || "Player42";
  const profilePictureUrl = resolveAvatarUrl(me?.profileImage || DEFAULT_AVATAR_PATH);

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.push("/")} />
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)] px-4">
        <CardPanel className="w-full max-w-6xl h-auto min-h-[55vh] flex !px-6 mx-auto">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-6 flex flex-col items-center">
            {/* Page title fixed at top */}
            <h1 className="text-3xl font-bold text-center pb-6">{t("settings")}</h1>
            
            {/* Settings container centered vertically */}
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
                {/* Email Row */}
                <div className="flex items-center justify-between gap-8 p-4 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold opacity-70 uppercase">{t("email")}</span>
                    <span className="text-lg font-medium">{currentEmail}</span>
                  </div>
                  <ButtonBasic1 className="!w-44 !h-14 flex-shrink-0" onClick={() => router.push("/param/change-email")}>
                    {t("change")}
                  </ButtonBasic1>
                </div>
                
                {/* Username Row */}
                <div className="flex items-center justify-between gap-8 p-4 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold opacity-70 uppercase">{t("username")}</span>
                    <span className="text-lg font-medium">{currentUsername}</span>
                  </div>
                  <ButtonBasic1 className="!w-44 !h-14 flex-shrink-0" onClick={() => router.push("/param/change-username")}>
                    {t("change")}
                  </ButtonBasic1>
                </div>
                
                {/* Profile Picture Row */}
                <div className="flex items-center justify-between gap-8 p-4 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full overflow-hidden border-4 border-white bg-white shadow-lg" style={{ width: 64, height: 64 }}>
                      {isLoading ? (
                        <div className="w-full h-full bg-gray-300 animate-pulse" />
                      ) : (
                        <Image
                          src={profilePictureUrl}
                          alt="Profile"
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            // Fallback to default image if loading fails
                            const target = e.target as HTMLImageElement;
                            target.src = DEFAULT_AVATAR_PATH;
                          }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold opacity-70 uppercase">{t("profilePicture")}</span>
                    </div>
                  </div>
                  <ButtonBasic1 className="!w-44 !h-14 flex-shrink-0" onClick={() => router.push("/param/change-profile-picture")}>
                    {t("change")}
                  </ButtonBasic1>
                </div>
                
                {/* Password Row - no current value displayed */}
                <div className="flex items-center justify-between gap-8 p-4 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold opacity-70 uppercase">{t("password")}</span>
                    <span className="text-lg font-medium">••••••••</span>
                  </div>
                  <ButtonBasic1 className="!w-44 !h-14 flex-shrink-0" onClick={() => router.push("/param/change-password")}>
                    {t("change")}
                  </ButtonBasic1>
                </div>
              </div>
            </div>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}
