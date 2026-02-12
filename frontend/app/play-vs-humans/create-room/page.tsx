"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { TextInput } from "@/components/atoms/TextInput";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { mapGameWsErrorMessage } from "@/lib/gameWsErrors";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

function CreateRoomPageContent() {
  useRequireAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomName, setRoomName] = useState<string>("");
  const [roomError, setRoomError] = useState<string>("");
  const [ignoreQueryError, setIgnoreQueryError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const queryErrorKey = searchParams.get("errorKey");
  const queryErrorMessage = searchParams.get("errorMessage");
  const queryRoomName = searchParams.get("room");
  const queryError = queryErrorKey
    ? t(queryErrorKey)
    : mapGameWsErrorMessage(t, queryErrorMessage);
  const displayedError = roomError || (!ignoreQueryError ? queryError : "");

  useEffect(() => {
    if (!queryRoomName || roomName) {
      return;
    }
    setRoomName(queryRoomName.replace(/-/g, " "));
  }, [queryRoomName, roomName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRoomName = roomName.trim();

    if (!trimmedRoomName || isSubmitting) {
      return;
    }

    const normalizedRoomCode = trimmedRoomName.toLowerCase().replace(/\s+/g, "-");
    if (normalizedRoomCode.length < 3 || normalizedRoomCode.length > 15) {
      setRoomError(t("gameRoomCodeLength"));
      return;
    }

    setRoomError("");
    setIgnoreQueryError(true);
    const roomPath = encodeURIComponent(normalizedRoomCode);

    try {
      setIsSubmitting(true);
      router.push(`/play-vs-humans/${roomPath}?mode=create`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      {/* Back button */}
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)] px-2 sm:px-4 py-8">
        <CardPanel className="w-full max-w-4xl h-auto min-h-[65vh] flex !px-6 sm:!px-10 md:!px-16 mx-auto">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-12 sm:!p-16 md:!p-20 flex flex-col items-center justify-center gap-12">
            {/* Page title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-center">
              {t("createRoom")}
            </h1>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-8">
              {/* Room name input */}
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="roomName"
                  className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 text-center"
                >
                  {t("enterRoomName")}
                </label>
                <TextInput
                  id="roomName"
                  type="text"
                  placeholder={t("roomNamePlaceholder")}
                  value={roomName}
                  onChange={(e) => {
                    setRoomName(e.target.value);
                    setRoomError("");
                    setIgnoreQueryError(true);
                  }}
                  maxLength={15}
                  className="w-full text-center text-lg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {roomName.length}/15 {t("characters")}
                </p>
                {displayedError ? (
                  <p className="text-xs text-red-500 text-center">{displayedError}</p>
                ) : null}
              </div>

              {/* Submit button */}
              <div className="flex justify-center mt-2">
                <ButtonSubmite type="submit" disabled={!roomName.trim() || isSubmitting} />
              </div>
            </form>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<div className="relative min-h-[calc(100vh-160px)]" />}>
      <CreateRoomPageContent />
    </Suspense>
  );
}
