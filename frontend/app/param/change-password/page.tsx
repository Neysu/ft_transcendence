"use client";

import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { CardPanel } from "@/components/molecules/CardPanel";
import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="absolute top-4 left-4">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>
      <CardPanel>
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">{t("changepassword")}</h1>
        </div>
      </CardPanel>
    </main>
  );
}
