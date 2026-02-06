"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

export default function TermsOfServicePage() {
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
            <h1 className="text-lg sm:text-xl font-bold mb-1">{t("termsPageTitle")}</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t("lastUpdated")}</p>
          </div>

          {/* 1. Agreement to Terms */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection1")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("termsAgreementDesc")}</p>
          </div>

          {/* 2. Use License */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection2")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">{t("termsLicenseDesc")}</p>
            <ul className="space-y-0.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 ml-4">
              <li>• {t("termsLicense1")}</li>
              <li>• {t("termsLicense2")}</li>
              <li>• {t("termsLicense3")}</li>
              <li>• {t("termsLicense4")}</li>
              <li>• {t("termsLicense5")}</li>
              <li>• {t("termsLicense6")}</li>
            </ul>
          </div>

          {/* 3. Account Registration */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection3")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("termsAccountDesc")}</p>
          </div>

          {/* 4. User Conduct */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection4")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">{t("termsConductDesc")}</p>
            <ul className="space-y-0.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 ml-4">
              <li>• {t("termsConduct1")}</li>
              <li>• {t("termsConduct2")}</li>
              <li>• {t("termsConduct3")}</li>
              <li>• {t("termsConduct4")}</li>
              <li>• {t("termsConduct5")}</li>
            </ul>
          </div>

          {/* 5. Disclaimer of Warranties */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection5")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("termsWarrantiesDesc")}</p>
          </div>

          {/* 6. Limitation of Liability */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection6")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("termsLiabilityDesc")}</p>
          </div>

          {/* 7. Accuracy of Materials */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection7")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("termsAccuracyDesc")}</p>
          </div>

          {/* 8. Modifications */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection8")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("termsModificationsDesc")}</p>
          </div>

          {/* 9. Governing Law */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection9")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("termsGoverningDesc")}</p>
          </div>

          {/* 10. Contact Information */}
          <div className="w-full border-t border-gray-300 dark:border-gray-600 pt-3">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{t("termsSection10")}</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t("termsContactDesc")}</p>
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
