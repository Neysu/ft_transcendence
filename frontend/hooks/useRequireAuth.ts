"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type UseRequireAuthOptions = {
  redirectTo?: string;
  refreshIfMissing?: boolean;
};

export function useRequireAuth(options?: UseRequireAuthOptions) {
  const { me, isAuthenticated, isAuthLoading, refreshMe } = useAuth();
  const router = useRouter();
  const redirectTo = options?.redirectTo ?? "/landing/signin";
  const refreshIfMissing = options?.refreshIfMissing ?? true;

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }
    if (refreshIfMissing && !me) {
      void refreshMe();
    }
  }, [isAuthLoading, isAuthenticated, me, refreshIfMissing, refreshMe, redirectTo, router]);

  return {
    me,
    isAuthenticated,
    isAuthLoading,
    isReady: !isAuthLoading && isAuthenticated,
  };
}
