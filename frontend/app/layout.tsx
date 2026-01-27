// Import Next.js types and utilities
import "./globals.css";
// import "./bg-random.js";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeSync } from "@/components/ThemeSync";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";

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

// Define metadata for the application (SEO and browser tab)
export const metadata: Metadata = {
  title: "ft_trans",
  description: "ft_trans for 42 :)",
};

// Root layout component that wraps all pages in the application



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            {/* Fixed position toggles at top right */}
            <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50, display: "flex", gap: 12 }}>
              <ThemeToggle />
              <LanguageToggle />
            </div>
            {children}
          </LanguageProvider>
        </ThemeSync>
      </body>
    </html>
  );
}
