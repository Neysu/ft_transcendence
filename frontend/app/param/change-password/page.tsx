"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { TextInput } from "@/components/atoms/TextInput";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ChangePasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  
  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/landing/signin");
          return;
        }
        
        const response = await fetch("http://localhost:3000/api/user/me", {
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
        setUserId(data.id);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error instanceof TypeError && error.message.includes("fetch")) {
          setError("Unable to connect to server. Please check if backend is running.");
        } else {
          setError("Failed to load user data");
        }
      }
    };
    
    fetchUserData();
  }, [router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("fillAllFields") || "Please fill all fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch") || "Passwords do not match");
      return;
    }
    
    if (newPassword === currentPassword) {
      setError(t("samePassword") || "New password is the same as current password");
      return;
    }
    
    // Password validation - at least 8 characters, 1 uppercase, 1 number
    if (newPassword.length < 8) {
      setError(t("passwordTooShort") || "Password must be at least 8 characters");
      return;
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      setError(t("passwordNeedsUppercase") || "Password must contain at least one uppercase letter");
      return;
    }
    
    if (!/[0-9]/.test(newPassword)) {
      setError(t("passwordNeedsNumber") || "Password must contain at least one number");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        router.push("/landing/signin");
        return;
      }
      
      const response = await fetch(`http://localhost:3000/api/user/${userId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error(t("currentPasswordIncorrect") || "Current password is incorrect");
        }
        throw new Error(errorData.message || "Failed to update password");
      }
      
      // Success - redirect back to settings
      router.push("/param");
    } catch (error) {
      console.error("Error updating password:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError(t("serverUnavailable") || "Unable to connect to server. Please check if backend is running.");
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update password");
      }
    } finally {
      setIsLoading(false);
    }
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
              <h1 className="text-3xl font-bold">{t("changePassword") || "Change Password"}</h1>
              
              {/* Current password input */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("currentPassword") || "Current Password"}</label>
                <TextInput
                  type="password"
                  placeholder={t("enterCurrentPassword") || "Enter current password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              
              {/* New password input */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("newPassword") || "New Password"}</label>
                <TextInput
                  type="password"
                  placeholder={t("enterNewPassword") || "Enter new password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
                <span className="text-xs opacity-60">
                  {t("passwordRequirements") || "Min. 8 characters, 1 uppercase, 1 number"}
                </span>
              </div>
              
              {/* Confirm password input */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("confirmPassword") || "Confirm Password"}</label>
                <TextInput
                  type="password"
                  placeholder={t("confirmNewPassword") || "Confirm new password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
