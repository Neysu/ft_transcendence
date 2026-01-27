"use client";

import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { useLanguage } from "@/components/LanguageProvider";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { CardPanel } from "@/components/molecules/CardPanel";
import { useRouter } from "next/navigation";

export default function ParamPage() {
  const { t } = useLanguage();
  const router = useRouter();
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="absolute top-4 left-4">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>
      <CardPanel>
        <div className="flex flex-col items-center gap-4">
          <ButtonBasic1 className="!w-56 !h-16" onClick={() => router.push("/param/change-email")}>{t("changeemailaddress")}</ButtonBasic1>
		  <ButtonBasic1 className="!w-56 !h-16" onClick={() => router.push("/param/change-username")}>{t("changeusername")}</ButtonBasic1>
		  <ButtonBasic1 className="!w-56 !h-16" onClick={() => router.push("/param/change-profile-picture")}>{t("changeprofilepicture")}</ButtonBasic1>
		  <ButtonBasic1 className="!w-56 !h-16" onClick={() => router.push("/param/change-password")}>{t("changepassword")}</ButtonBasic1>
        </div>
      </CardPanel>
    </main>
  );
}
