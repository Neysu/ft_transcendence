"use client";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { useLanguage } from "@/components/LanguageProvider";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { CardPanel } from "@/components/molecules/CardPanel";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const { t } = useLanguage();
  const router = useRouter();
  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-4">
      <CardPanel>
        <div className="flex flex-col items-center gap-4">
          <ButtonBasic1>{t("hello")}</ButtonBasic1>
          <ButtonCircleBack onClick={() => router.back()} />
          <ButtonSubmite />
        </div>
      </CardPanel>
    </main>
  );
}
