"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type UseRequireAuthOptions = {
  redirectTo?: string;
};

export function useRequireAuth(options?: UseRequireAuthOptions) {
  const { me, isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const redirectTo = options?.redirectTo ?? "/landing/signin";

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthLoading, isAuthenticated, redirectTo, router]);

  return {
    me,
    isAuthenticated,
    isAuthLoading,
    isReady: !isAuthLoading && isAuthenticated,
  };
}
