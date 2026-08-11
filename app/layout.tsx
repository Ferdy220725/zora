import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import Navbar from "@/components/Navbar";
import ThemeEngine from "@/components/ThemeEngine";
import BirthdayOverlay from "@/components/BirthdayOverlay";
import AsistenZoraOverlay from "@/components/AsistenZoraOverlay";
import { AsistenZoraProvider } from "@/lib/asisten-zora-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zora - Manajemen Agroteknologi C",
  description: "Zora: Pusat informasi dan manajemen akademik mahasiswa Agroteknologi C. Dimana Bumi dan Ilmu Pengetahuan Bersatu.",
  keywords: ["Zora", "Zoraferrs", "Agroteknologi", "UPN", "Manajemen Kelas", "Pertanian"],
  verification: {
    google: ["googlec0409801ae0d1598", "-c_oKPxD--bqsEt7rMvILOccQIqJQfajX5CJUZQbxpM"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-700 bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white`}
      >
        <ThemeEngine />

        {/* AsistenZoraProvider membungkus Navbar + seluruh halaman, biar status
            on/off asisten Zora sinkron di mana pun (sidebar, bottom tab, Dashboard) */}
        <AsistenZoraProvider>
          <Navbar />
          <BirthdayOverlay />
          <AsistenZoraOverlay />

          <main className="relative z-10 md:pl-64 pt-16 md:pt-0 pb-[68px] md:pb-0">
            {children}
          </main>
        </AsistenZoraProvider>

        <Toaster position="top-center" richColors theme="system" />
      </body>
    </html>
  );
}
