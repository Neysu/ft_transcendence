"use client";

import { ButtonBasic1 } from "@/components/atoms/Button";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export default function LandingPage() {
	const { t } = useLanguage();
	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] gap-4">
		<Link href="/landing/signin">
			<ButtonBasic1 className="w-90 h-15 text-xl">{t("signIn")}</ButtonBasic1>
		</Link>
		<Link href="/landing/signup">
			<ButtonBasic1 className="w-90 h-15 text-lg">{t("signUp")}</ButtonBasic1>
		</Link>
		</div>
	);
}