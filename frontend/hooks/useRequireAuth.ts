"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function useRequireAuth() {
  const { me, isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading || isAuthenticated) {
      return;
    }
    router.replace("/landing");
  }, [isAuthLoading, isAuthenticated, router]);

  return {
    me,
    isAuthenticated,
    isAuthLoading,
    isReady: !isAuthLoading && isAuthenticated,
  };
}
