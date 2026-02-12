"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { FetchJsonError, fetchJson } from "@/lib/api";

export const AUTH_CHANGED_EVENT = "auth-changed";

type Me = {
  id: number;
  username: string;
  email: string;
  profileImage: string | null;
  profileText: string | null;
  gamesPlayed: number;
  gamesWon: number;
};

interface AuthContextType {
  me: Me | null;
  profileImage: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  refreshMe: () => Promise<void>;
  logout: () => void;
  updateMe: (patch: Partial<Me>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const clearStoredAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  }, []);

  const refreshMe = useCallback(async () => {
    setIsAuthLoading(true);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("accessToken")
        : null;

    if (!token) {
      setMe(null);
      setIsAuthLoading(false);
      return;
    }

    try {
      const data = await fetchJson<Partial<Me>>("/api/user/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (
        typeof data.id === "number" &&
        typeof data.username === "string" &&
        typeof data.email === "string"
      ) {
        setMe({
          id: data.id,
          username: data.username,
          email: data.email,
          profileImage: data.profileImage ?? null,
          profileText: data.profileText ?? null,
          gamesPlayed: typeof data.gamesPlayed === "number" ? data.gamesPlayed : 0,
          gamesWon: typeof data.gamesWon === "number" ? data.gamesWon : 0,
        });
      } else {
        setMe(null);
      }
    } catch (error) {
      if (error instanceof FetchJsonError && (error.status === 401 || error.status === 403)) {
        clearStoredAuth();
        setMe(null);
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, [clearStoredAuth]);

  const logout = useCallback(() => {
    clearStoredAuth();
    setMe(null);
    setIsAuthLoading(false);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }, [clearStoredAuth]);

  const updateMe = useCallback((patch: Partial<Me>) => {
    setMe((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, ...patch };
    });
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "token" || event.key === "accessToken") {
        void refreshMe();
      }
    };
    const handleAuthChanged = () => {
      void refreshMe();
    };
    const handleFocus = () => {
      void refreshMe();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshMe]);

  return (
    <AuthContext.Provider
      value={{
        me,
        profileImage: me?.profileImage ?? null,
        isAuthenticated: Boolean(me),
        isAuthLoading,
        refreshMe,
        logout,
        updateMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
