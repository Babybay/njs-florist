import type { Metadata } from "next";
import { Anton, Fredoka, Geist_Mono, Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";

// Primary body sans — humanist, optimized for editorial commerce.
const sourceSans = Source_Sans_3({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif — used for editorial headlines and category names across the storefront.
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

// Rounded display for the hero bloom wordmark.
const fredoka = Fredoka({
  variable: "--font-bloom",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

// Condensed poster face for the footer wordmark.
const anton = Anton({
  variable: "--font-poster",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NJS Projects",
    template: "%s | NJS Projects",
  },
  description: "Studio bunga NJS Projects di Bali untuk buket, flower box, dan rangkaian custom.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${sourceSans.variable} ${geistMono.variable} ${playfair.variable} ${fredoka.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
