"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { ButtonBasic1 } from "@/components/atoms/Button";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { TextInput } from "@/components/atoms/TextInput";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { AUTH_CHANGED_EVENT } from "@/components/AuthProvider";
import { FetchJsonError, fetchJson } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignIn() {
  const { t } = useLanguage();
  const router = useRouter();
  // Form state for username and password
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>("green");

  useEffect(() => {
    if (typeof document !== "undefined") {
      setTheme(document.documentElement.getAttribute("data-theme") || "green");
    }
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "green");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!username || !password) {
      setError(t("fillAllFields"));
      return;
    }

    setIsLoading(true);

    try {
      const data = await fetchJson<{ token: string; id: number; username: string }>(
        "/api/user/login",
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
        },
        {
          defaultMessage: "Login failed",
          statusMessages: { 401: t("incorrectCredentials") },
        },
      );

      // Store token in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", String(data.id));
      localStorage.setItem("username", data.username);
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError(t("serverUnavailable"));
      } else if (error instanceof FetchJsonError) {
        setError(error.message);
      } else {
        setError(error instanceof Error ? error.message : "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
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

              {/* Error message */}
              {error && (
                <div className="w-full max-w-sm px-4 py-3 rounded-lg bg-red-500/10 backdrop-blur-sm border border-red-500/30">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit button */}
              <ButtonSubmite onClick={handleSubmit} className="mt-6" disabled={isLoading} />

              {/* Sign up button - same style as submit */}
              <button
                type="button"
                onClick={() => router.push("/landing/signup")}
                className="px-8 py-3 font-semibold rounded-lg transition-transform hover:scale-105 active:scale-95 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black mt-4"
                style={{
                  backgroundColor: theme === 'purple' ? '#9D33FA' : '#9BFA32'
                }}
              >
                {t("signUp") || "Sign Up"}
              </button>
            </form>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}
