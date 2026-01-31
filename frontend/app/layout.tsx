"use client";

// Import Next.js types and utilities
import "./globals.css";
// import "./bg-random.js";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeSync } from "@/components/ThemeSync";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import ExtraInfo from "@/components/atoms/ExtraInfo";
import { Logo } from "@/components/Logo";
import { ProfilePicButton } from "@/components/atoms/ProfilePicButton";
import { usePathname, useRouter } from "next/navigation";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


// Configure the Geist Sans font with CSS variable
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Configure the Geist Mono font with CSS variable
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Root layout component that wraps all pages in the application

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const hideProfileButton = pathname?.startsWith("/landing") || pathname?.startsWith("/extra-info") || pathname?.startsWith("/landing/signin") || pathname?.startsWith("/landing/signup");
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
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
        {/* Optional: background div for custom backgrounds */}
        {/* <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 to-gray-700 opacity-60 pointer-events-none" /> */}
        <ThemeSync>
          <LanguageProvider>
            <Logo />
            {/* Fixed position toggles at top right */}
            <div style={{ position: "fixed", top: 15, right: 16, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ThemeToggle />
                <LanguageToggle />
              </div>
              {!hideProfileButton && (
                <ProfilePicButton onClick={() => router.push("/param")} />
              )}
            </div>
            {children}
            <ExtraInfo />
          </LanguageProvider>
        </ThemeSync>
      </body>
    </html>
  );
}
