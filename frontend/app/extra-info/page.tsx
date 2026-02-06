"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export default function ExtraInfoPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-2 sm:px-4 py-6">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      <CardPanel className="w-full max-w-4xl h-auto min-h-[55vh] flex !px-3 sm:!px-6 md:!px-8 mx-auto">
        <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-3 sm:!p-4 md:!p-6 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-220px)]">

          {/* About Section */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("aboutThisGame")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">{t("aboutGameDesc")}</p>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("trackScoreDesc")}</p>
          </div>

          {/* How to Play */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("howToPlay")}</h2>
            <ul className="space-y-0.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <li>✓ <strong>{t("playVsBots")}:</strong> {t("playVsBotsDesc")}</li>
              <li>✓ <strong>{t("playVsHumans")}:</strong> {t("playVsHumansDesc")}</li>
              <li>✓ {t("scoreTrackingDesc")}</li>
              <li>✓ {t("multipleRoundsDesc")}</li>
            </ul>
          </div>

          {/* Account Settings */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("accountSettings")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">{t("manageProfileDesc")}</p>
            <ul className="space-y-0.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <li>• {t("changeUsername")}</li>
              <li>• {t("updateEmail")}</li>
              <li>• {t("updatePassword")}</li>
              <li>• {t("updateProfilePic")}</li>
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("legalPrivacy")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">{t("reviewPoliciesDesc")}</p>
            <div className="flex flex-col gap-1 text-xs sm:text-sm">
              <Link href="/policy/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                → {t("privacyPolicy")}
              </Link>
              <Link href="/policy/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                → {t("termsOfService")}
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="w-full pt-2 border-t border-gray-300 dark:border-gray-600">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("faq")}</h2>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div>
                <h3 className="font-bold text-gray-700 dark:text-gray-300 text-xs">{t("isDataSecure")}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{t("isDataSecureAns")}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-700 dark:text-gray-300 text-xs">{t("canPlayOffline")}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{t("canPlayOfflineAns")}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-700 dark:text-gray-300 text-xs">{t("reportBug")}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{t("reportBugAns")}</p>
              </div>
            </div>
          </div>

        </CardPanelSolid>
      </CardPanel>
    </div>
  );
}
