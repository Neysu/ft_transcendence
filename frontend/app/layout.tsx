"use client";

import "./globals.css";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import PresenceSocket from "@/components/PresenceSocket";
import { ThemeSync } from "@/components/ThemeSync";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import ExtraInfo from "@/components/atoms/ExtraInfo";
import { Logo } from "@/components/Logo";
import { ProfilePicButton } from "@/components/atoms/ProfilePicButton";
import { usePathname, useRouter } from "next/navigation";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const hideProfileButton = pathname?.startsWith("/landing") || pathname?.startsWith("/extra-info") || pathname?.startsWith("/landing/signin") || pathname?.startsWith("/landing/signup");
  const hideExtraInfo = pathname?.startsWith("/extra-info") || pathname?.startsWith("/policy");
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <title>ft_transcendence</title>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta
          name="description"
          content="ft_transcendence: jeu Pong en ligne avec amis, chat et profil utilisateur."
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'green';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-foreground min-h-screen`}
        style={{ position: "relative", minHeight: "100vh" }}
      >
        <ThemeSync>
          <AuthProvider>
            <PresenceSocket />
            <LanguageProvider>
              <Logo />
              <div style={{ position: "fixed", top: 15, right: 16, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ThemeToggle />
                  <LanguageToggle />
                </div>
                {!hideProfileButton && (
                  <ProfilePicButton onClick={() => router.push("/profile")} />
                )}
              </div>
              <AuthGuard>{children}</AuthGuard>
              {!hideExtraInfo && <ExtraInfo />}
            </LanguageProvider>
          </AuthProvider>
        </ThemeSync>
      </body>
    </html>
  );
}
