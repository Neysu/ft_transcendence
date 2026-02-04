"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { TextInput } from "@/components/atoms/TextInput";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ChangeUsernamePage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [newUsername, setNewUsername] = useState<string>("");
  const [confirmUsername, setConfirmUsername] = useState<string>("");
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
        setCurrentUsername(data.username || "");
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
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        router.push("/landing/signin");
        return;
      }
      
      const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update username");
      }
      
      // Success - redirect back to settings
      router.push("/param");
    } catch (error) {
      console.error("Error updating username:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError(t("serverUnavailable") || "Unable to connect to server. Please check if backend is running.");
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
        <ButtonCircleBack onClick={() => router.push("/")} />
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
