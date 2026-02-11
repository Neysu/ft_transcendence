"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";
import { ButtonSubmite } from "@/components/atoms/ButtonSubmite";
import { TextInput } from "@/components/atoms/TextInput";
import { CardPanel } from "@/components/molecules/CardPanel";
import { CardPanelSolid } from "@/components/molecules/CardPanelSolid";
import { AUTH_CHANGED_EVENT } from "@/components/AuthProvider";
import { FetchJsonError, fetchJson } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUp() {
  const { t } = useLanguage();
  const router = useRouter();

  // Form state for all registration fields
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !username || !password || !confirmPassword) {
      setError(t("fillAllFields") || "Please fill all fields");
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch") || "Passwords do not match");
      return;
    }

    // Password validation
    if (password.length < 8) {
      setError(t("passwordTooShort") || "Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError(t("passwordNeedsUppercase") || "Password must contain at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(t("passwordNeedsNumber") || "Password must contain at least one number");
      return;
    }

    // Username validation
    if (username.length < 3 || username.length > 20) {
      setError(t("invalidUsername") || "Username must be 3-20 characters");
      return;
    }

    setIsLoading(true);

    try {
      await fetchJson<{ id: number }>("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username,
          password,
        }),
      }, {
        defaultMessage: "Registration failed",
        statusMessages: { 409: t("userExists") || "User already exists with this email or username" },
      });

      // Registration successful - now login
      const loginData = await fetchJson<{ token: string; id: number; username: string }>(
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
        { defaultMessage: "Registration successful but login failed. Please sign in." },
      );

      // Store token in localStorage
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("userId", String(loginData.id));
      localStorage.setItem("username", loginData.username);
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setError(t("serverUnavailable") || "Unable to connect to server. Please check if backend is running.");
      } else if (error instanceof FetchJsonError) {
        setError(error.message);
      } else {
        setError(error instanceof Error ? error.message : "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)]">
      {/* Back button at top-left */}
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      {/* Main content centered */}
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
        <CardPanel className="w-full max-w-6xl h-auto min-h-[70vh] flex !px-6">
          <CardPanelSolid className="flex-1 !w-full !mx-0 h-auto !p-2" style={{ margin: "15px" }}>
            {/* Sign-up form container */}
            <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-6 w-full h-full py-8">
              {/* Form title */}
              <h1 className="text-3xl font-bold">{t("signUp")}</h1>

              {/* Email input section with clear label */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("email") || "Email"}</label>
                <TextInput
                  type="email"
                  placeholder={t("email") || "Enter your email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Username input section with clear label */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("username") || "Username"}</label>
                <TextInput
                  placeholder={t("username") || "Choose a username"}
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
                  placeholder={t("password") || "Choose a password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Confirm password input section with clear label */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <label className="text-sm font-semibold">{t("confirmPassword") || "Confirm Password"}</label>
                <TextInput
                  type="password"
                  placeholder={t("confirmPassword") || "Re-enter your password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="w-full max-w-sm text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <ButtonSubmite onClick={handleSubmit} className="mt-6" disabled={isLoading} />
            </form>
          </CardPanelSolid>
        </CardPanel>
      </div>
    </div>
  );
}
