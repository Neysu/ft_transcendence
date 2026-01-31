"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { CardPanel } from "@/components/molecules/CardPanel";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";

export default function ChangeProfilePicturePage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  return (
    <main className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
        <CardPanel>
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">{t("changeprofilepicture")}</h1>
          </div>
        </CardPanel>
      </div>
    </main>
  );
}
