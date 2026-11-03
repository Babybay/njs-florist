import type { Metadata } from "next";
import { Geist_Mono, Playfair_Display, Source_Sans_3 } from "next/font/google";
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

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toko Bunga Dalung & Denpasar, Bali | NJS Projects",
    template: "%s | NJS Projects",
  },
  description: "Temukan buket bunga, flower box, dan rangkaian custom di NJS Projects. Pilih koleksi untuk hadiah Anda atau diskusikan pesanan di Dalung dan Denpasar, Bali.",
  icons: {
    icon: [{ url: "/brand-mark.svg?v=4", type: "image/svg+xml" }],
    apple: "/apple-icon.png?v=4",
    shortcut: "/favicon.ico?v=4",
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
      className={`${sourceSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">Lewati navigasi</a>
        {children}
      </body>
    </html>
  );
}
