"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function PlayVsHumansPage() {
  useRequireAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push("/play-vs-humans/create-room");
  };

  const handleJoinRoom = () => {
    router.push("/play-vs-humans/join-room");
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      {/* Back button - top left */}
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-2 sm:px-4 pt-16 sm:pt-8">
        <CardPanel className="w-full max-w-7xl !h-auto !min-h-[60vh] flex flex-col items-center justify-center px-4 py-6 gap-6 overflow-hidden">
          <h1
            className="text-3xl sm:text-4xl font-bold text-center"
            style={{ transform: "translateY(-8px)" }}
          >
            {t("makeYourChoice")}
          </h1>

          {/* Two panels side by side */}
          <div className="flex flex-col lg:flex-row gap-6 w-full items-center justify-center">
            {/* Create a room panel */}
            <button
              onClick={handleCreateRoom}
              className="transition-transform hover:scale-105 active:scale-95 w-full lg:w-auto origin-center"
            >
              <CardPanelSolid className="!h-[40vh] !w-full lg:!w-[40vh] min-h-[280px] min-w-[280px] flex items-center justify-center">
                <h2 className="text-3xl sm:text-4xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("createRoom")}
                </h2>
              </CardPanelSolid>
            </button>

            {/* Join a room panel */}
            <button
              onClick={handleJoinRoom}
              className="transition-transform hover:scale-105 active:scale-95 w-full lg:w-auto origin-center"
            >
              <CardPanelSolid className="!h-[40vh] !w-full lg:!w-[40vh] min-h-[280px] min-w-[280px] flex items-center justify-center">
                <h2 className="text-3xl sm:text-4xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("joinRoom")}
                </h2>
              </CardPanelSolid>
            </button>
          </div>
        </CardPanel>
      </div>
    </div>
  );
}
