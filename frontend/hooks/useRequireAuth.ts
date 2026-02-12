"use client";

import { useAuth } from "@/components/AuthProvider";

export function useRequireAuth() {
  const { me, isAuthenticated, isAuthLoading } = useAuth();

  return {
    me,
    isAuthenticated,
    isAuthLoading,
    isReady: !isAuthLoading && isAuthenticated,
  };
}
