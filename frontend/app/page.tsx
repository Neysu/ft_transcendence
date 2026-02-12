"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { ButtonLarge } from "@/components/atoms/ButtonLarge";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

/**
 * Home Page Component
 *
 * The main page with game mode selection and friends list access.
 */
export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  useRequireAuth();
  const hasProfileNotFoundError = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof window === "undefined") {
        return false;
      }
      return new URLSearchParams(window.location.search).get("error") === "profile-not-found";
    },
    () => false,
  );

  useEffect(() => {
    if (!hasProfileNotFoundError || typeof window === "undefined") {
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace("/", { scroll: false });
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasProfileNotFoundError, router]);

  return (
    <>
      {hasProfileNotFoundError ? (
        <div className="pointer-events-none fixed top-16 right-4 z-[60] max-w-[min(92vw,360px)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700 shadow-lg">
          {t("userNotFound")}
        </div>
      ) : null}

      <main className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-12 px-4 -mt-16">
        <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">
          <ButtonLarge onClick={() => router.push("/play-vs-bot")}>
            {t("playVsBots")}
          </ButtonLarge>

          <ButtonLarge onClick={() => router.push("/play-vs-humans")}>
            {t("playVsHumans")}
          </ButtonLarge>
        </div>

      </main>
    </>
  );
}
