"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useLanguage } from "@/components/LanguageProvider";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-6">
      <CardPanelSolid className="justify-center gap-6">
        <Image
          src="/puit-removebg-preview.png"
          alt={t("notFoundImageAlt")}
          width={200}
          height={200}
          className="object-contain"
        />
        <h1 className="text-4xl font-bold">{t("notFoundTitle")}</h1>
        <p className="text-lg text-center">
          {t("notFoundDescription")}
        </p>
        <ButtonBasic1 variant="primary" onClick={() => router.push("/")}>
          {t("notFoundGoHome")}
        </ButtonBasic1>
      </CardPanelSolid>
    </div>
  );
}
