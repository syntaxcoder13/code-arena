import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Caveat, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting",
  display: "swap",
  weight: ["600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} • Real-Time Multiplayer Coding Platform`,
  description: siteConfig.description,
  keywords: [
    "CodeArena",
    "multiplayer coding",
    "real-time coding battle",
    "developer arena",
    "competitive programming",
    "code duels",
    "algorithms",
    "developer rank",
  ],
  authors: [{ name: "CodeArena Team" }],
  openGraph: {
    title: `${siteConfig.name} • Real-Time Multiplayer Coding Platform`,
    description: "Code. Compete. Level Up. Where Code Meets Real-Time Competition.",
    url: "https://codearena.dev",
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} • Real-Time Multiplayer Coding Platform`,
    description: "Code. Compete. Level Up. Where Code Meets Real-Time Competition.",
  },
};

import { SoundProvider } from "@/components/sound/SoundProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${playfairDisplay.variable} ${caveat.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#060709] text-white selection:bg-white selection:text-black antialiased overflow-x-hidden font-body"
      >
        <SoundProvider>{children}</SoundProvider>
      </body>
    </html>
  );
}
