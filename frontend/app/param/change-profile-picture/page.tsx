"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function ChangeProfilePicturePage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const DEFAULT_PROFILE_PICTURE = "/russian-borzoi-profile-portrait-19997228-removebg-preview.png";
  
  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/landing/signin");
          return;
        }
        
        const response = await fetch("/api/user/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const data = await response.json();
        const profilePic = data.profileImage || DEFAULT_PROFILE_PICTURE;
        setCurrentProfilePicture(profilePic);
        setPreviewImage(profilePic);
        setUserId(data.id);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error instanceof TypeError && error.message.includes("fetch")) {
          setError("Unable to connect to server. Please check if backend is running.");
        } else {
          setError("Failed to load user data");
        }
        setCurrentProfilePicture(DEFAULT_PROFILE_PICTURE);
        setPreviewImage(DEFAULT_PROFILE_PICTURE);
      }
    };
    
    fetchUserData();
  }, [router]);
  
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
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        router.push("/landing/signin");
        return;
      }
      
      // Create FormData to send the file
      const formData = new FormData();
      formData.append("avatar", selectedFile);
      
      const response = await fetch(`/api/user/avatar/${userId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile picture");
      }
      
      // Success - redirect back to settings
      router.push("/param");
    } catch (error) {
      console.error("Error updating profile picture:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError(t("serverUnavailable") || "Unable to connect to server. Please check if backend is running.");
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
        <ButtonCircleBack onClick={() => router.push("/")} />
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
                    src={previewImage || DEFAULT_PROFILE_PICTURE}
                    alt="Profile preview"
                    width={160}
                    height={160}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_PROFILE_PICTURE;
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
