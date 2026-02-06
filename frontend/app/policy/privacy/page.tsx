"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 py-10">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      <CardPanel className="w-full max-w-4xl h-auto min-h-[55vh] flex !px-3 sm:!px-6 md:!px-8 mx-auto">
        <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-3 sm:!p-4 md:!p-6 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-220px)]">
          {/* Header */}
          <div className="w-full">
            <h1 className="text-lg sm:text-xl font-bold mb-1">{t("privacyPageTitle")}</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("lastUpdated")}</p>
          </div>

          {/* Introduction */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("privacySection1")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("privacyIntro")}</p>
          </div>

          {/* Information We Collect */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("privacySection2")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">{t("privacyCollectDesc")}</p>
            <ul className="space-y-0.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 ml-4">
              <li>• {t("privacyPersonalData")}</li>
              <li>• {t("privacyGameData")}</li>
              <li>• {t("privacyUsageData")}</li>
              <li>• {t("privacyCookies")}</li>
            </ul>
          </div>

          {/* Use of Your Information */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("privacySection3")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">{t("privacyUseDesc")}</p>
            <ul className="space-y-0.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 ml-4">
              <li>• {t("privacyUse1")}</li>
              <li>• {t("privacyUse2")}</li>
              <li>• {t("privacyUse3")}</li>
              <li>• {t("privacyUse4")}</li>
              <li>• {t("privacyUse5")}</li>
              <li>• {t("privacyUse6")}</li>
            </ul>
          </div>

          {/* Disclosure of Your Information */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("privacySection4")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("privacyDisclosureDesc")}</p>
          </div>

          {/* Security of Your Information */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("privacySection5")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("privacySecurityDesc")}</p>
          </div>

          {/* Contact Us */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("privacySection6")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("privacyContactDesc")}</p>
          </div>

          {/* Changes to This Privacy Policy */}
          <div className="w-full border-t border-gray-300 dark:border-gray-600 pt-3">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("privacySection7")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("privacyChangesDesc")}</p>
          </div>

          {/* Footer */}
          <div className="w-full text-center border-t border-gray-300 dark:border-gray-600 pt-3 mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("allRightsReserved")}</p>
          </div>
        </CardPanelSolid>
      </CardPanel>
    </div>
  );
}
