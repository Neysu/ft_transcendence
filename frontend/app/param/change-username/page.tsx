"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { TextInput } from "@/components/atoms/TextInput";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { FetchJsonError, fetchJson } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function ChangeUsernamePage() {
  const { t } = useLanguage();
  const { updateMe } = useAuth();
  const { me } = useRequireAuth();
  const router = useRouter();

  const [newUsername, setNewUsername] = useState<string>("");
  const [confirmUsername, setConfirmUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const currentUsername = me?.username || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!newUsername || !confirmUsername) {
      setError(t("fillAllFields") || "Please fill all fields");
      return;
    }

    if (newUsername !== confirmUsername) {
      setError(t("usernamesDoNotMatch") || "Usernames do not match");
      return;
    }

    if (newUsername === currentUsername) {
      setError(t("sameUsername") || "New username is the same as current username");
      return;
    }

    // Username validation - alphanumeric and underscore, 3-20 characters
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
      setError(t("invalidUsername") || "Username must be 3-20 characters (letters, numbers, underscore)");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const userId = me?.id;
      if (!token || !userId) {
        router.push("/landing/signin");
        return;
      }

      await fetchJson<{ id: number }>(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
        }),
      }, { defaultMessage: "Failed to update username" });

      updateMe({ username: newUsername });
      router.replace("/param");
    } catch (error) {
      console.error("Error updating username:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError(t("serverUnavailable") || "Unable to connect to server. Please check if backend is running.");
      } else if (error instanceof FetchJsonError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update username");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
        <CardPanel className="w-full max-w-6xl h-auto min-h-[55vh] flex !px-6">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-2" style={{ margin: "15px" }}>
            <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-6 w-full h-full py-8">
              <h1 className="text-3xl font-bold">{t("changeUsername") || "Change Username"}</h1>

              {/* Current username display */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("currentUsername") || "Current Username"}</label>
                <div className="px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <span className="text-sm opacity-70">{currentUsername || "Loading..."}</span>
                </div>
              </div>

              {/* New username input */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("newUsername") || "New Username"}</label>
                <TextInput
                  type="text"
                  placeholder={t("enterNewUsername") || "Enter new username"}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {/* Confirm username input */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("confirmUsername") || "Confirm Username"}</label>
                <TextInput
                  type="text"
                  placeholder={t("confirmNewUsername") || "Confirm new username"}
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="w-full max-w-sm text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <ButtonSubmite
                onClick={handleSubmit}
                className="mt-6"
                disabled={isLoading}
              />
            </form>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </main>
  );
}
