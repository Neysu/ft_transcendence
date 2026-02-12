"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { FetchJsonError, fetchJson } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { DEFAULT_AVATAR_PATH, resolveAvatarUrl } from "@/lib/avatar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function ChangeProfilePicturePage() {
  const { t } = useLanguage();
  const { refreshMe, updateMe } = useAuth();
  const { me, isAuthLoading, isAuthenticated } = useRequireAuth();
  const router = useRouter();

  const [previewImage, setPreviewImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      return;
    }
    if (!selectedFile) {
      setPreviewImage(resolveAvatarUrl(me?.profileImage || DEFAULT_AVATAR_PATH));
    }
  }, [isAuthLoading, isAuthenticated, me, selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError(t("invalidFileType") || "Invalid file type. Please select an image (JPG, PNG, GIF, WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(t("fileTooLarge") || "File too large. Maximum size is 5MB");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedFile) {
      setError(t("selectImage") || "Please select an image");
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

      // Create FormData to send the file
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const data = await fetchJson<{ profileImage?: string | null }>(`/api/user/avatar/${userId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        },
        body: formData,
      }, {
        defaultMessage: "Failed to update profile picture",
        statusMessages: {
          413: t("fileTooLarge") || "File too large. Maximum size is 5MB",
        },
      });

      // Success - redirect back to settings
      if (data?.profileImage) {
        updateMe({ profileImage: data.profileImage });
      }
      await refreshMe();
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.replace("/param");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError(t("serverUnavailable") || "Unable to connect to server. Please check if backend is running.");
      } else if (error instanceof FetchJsonError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update profile picture");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
              <h1 className="text-3xl font-bold">{t("changeProfilePicture") || "Change Profile Picture"}</h1>

              {/* Image preview */}
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full overflow-hidden border-4 border-white bg-white shadow-lg" style={{ width: 160, height: 160 }}>
                  <Image
                    src={previewImage || DEFAULT_AVATAR_PATH}
                    alt="Profile preview"
                    width={160}
                    height={160}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_AVATAR_PATH;
                    }}
                  />
                </div>
                <span className="text-sm opacity-60">
                  {selectedFile ? selectedFile.name : t("noFileSelected") || "No file selected"}
                </span>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />

              {/* Select image button */}
              <button
                type="button"
                onClick={handleButtonClick}
                disabled={isLoading}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("selectImage") || "Select Image"}
              </button>

              <div className="text-xs opacity-60 text-center max-w-sm">
                {t("imageRequirements") || "Supported formats: JPG, PNG, GIF, WEBP. Maximum size: 5MB"}
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
                disabled={isLoading || !selectedFile}
              />
            </form>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </main>
  );
}
