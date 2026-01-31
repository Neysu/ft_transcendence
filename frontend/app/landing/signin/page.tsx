"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { TextInput } from "@/components/atoms/TextInput";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const { t } = useLanguage();
  const router = useRouter();
  // Form state for username and password
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic here
    console.log("Login attempt:", { username, password });
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
        <CardPanel className="w-full max-w-6xl h-auto min-h-[70vh] flex !px-6">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-2" style={{ margin: "15px" }}>
            {/* Sign-in form container */}
            <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-6 w-full h-full py-8">
              {/* Form title */}
              <h1 className="text-3xl font-bold">{t("signIn")}</h1>

              {/* Username input section with clear label */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("username") || "Username"}</label>
                <TextInput
                  placeholder={t("username") || "Enter your username"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Password input section with clear label */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("password") || "Password"}</label>
                <TextInput
                  type="password"
                  placeholder={t("password") || "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Submit button */}
              <ButtonSubmite onClick={handleSubmit} className="mt-6" />
            </form>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}
