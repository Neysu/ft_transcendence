"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  return (
    pathname === "/landing" ||
    pathname === "/landing/signin" ||
    pathname === "/landing/signup" ||
    pathname === "/extra-info" ||
    pathname.startsWith("/policy")
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (publicRoute || isAuthLoading || isAuthenticated) {
      return;
    }
    router.replace("/landing");
  }, [publicRoute, isAuthLoading, isAuthenticated, router]);

  if (publicRoute) {
    return <>{children}</>;
  }

  if (isAuthLoading || !isAuthenticated) {
    return <main className="min-h-[calc(100vh-160px)]" />;
  }

  return <>{children}</>;
}
