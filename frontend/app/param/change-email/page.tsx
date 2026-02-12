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

export default function ChangeEmailPage() {
  const { t } = useLanguage();
  const { updateMe } = useAuth();
  const { me } = useRequireAuth();
  const router = useRouter();

  const [newEmail, setNewEmail] = useState<string>("");
  const [confirmEmail, setConfirmEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const currentEmail = me?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!newEmail || !confirmEmail) {
      setError(t("fillAllFields") || "Please fill all fields");
      return;
    }

    if (newEmail !== confirmEmail) {
      setError(t("emailsDoNotMatch") || "Emails do not match");
      return;
    }

    if (newEmail === currentEmail) {
      setError(t("sameEmail") || "New email is the same as current email");
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError(t("invalidEmail") || "Invalid email format");
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
          email: newEmail,
        }),
      }, { defaultMessage: "Failed to update email" });

      updateMe({ email: newEmail });
      router.replace("/param");
    } catch (error) {
      console.error("Error updating email:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError(t("serverUnavailable") || "Unable to connect to server. Please check if backend is running.");
      } else if (error instanceof FetchJsonError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update email");
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
              <h1 className="text-3xl font-bold">{t("changeEmail") || "Change Email"}</h1>

              {/* Current email display */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("currentEmail") || "Current Email"}</label>
                <div className="px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <span className="text-sm opacity-70">{currentEmail || "Loading..."}</span>
                </div>
              </div>

              {/* New email input */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("newEmail") || "New Email"}</label>
                <TextInput
                  type="email"
                  placeholder={t("enterNewEmail") || "Enter new email"}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {/* Confirm email input */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("confirmEmail") || "Confirm Email"}</label>
                <TextInput
                  type="email"
                  placeholder={t("confirmNewEmail") || "Confirm new email"}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
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
