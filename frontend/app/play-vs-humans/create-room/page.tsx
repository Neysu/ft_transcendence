"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { TextInput } from "@/components/atoms/TextInput";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateRoomPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [roomName, setRoomName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRoomName = roomName.trim();

    if (!trimmedRoomName || isSubmitting) {
      return;
    }

    const roomPath = encodeURIComponent(trimmedRoomName);

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedRoomName, path: roomPath }),
      });

      if (!response.ok) {
        console.error("Failed to create room:", response.statusText);
        return;
      }

      router.push(`/play-vs-humans/${roomPath}`);
    } catch (error) {
      console.error("Failed to create room:", error);
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
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={15}
                  className="w-full text-center text-lg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {roomName.length}/15 {t("characters")}
                </p>
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
