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
  title: "ZORA - Sistem Manajemen dan Informasi Akademik",
  description: "Zora: Pusat informasi dan manajemen kelas digital yang dapat memudahkan mahasiswa serta pengajar dalam kegiatan perkuliahan",
  keywords: [
    "Zora",
    "ZORA",
    "Zoraferrs",
    "Sistem Informasi Akademik",
    "Sistem Manajemen Akademik",
    "Sistem Manajemen Kelas",
    "Manajemen Kelas",
    "Aplikasi Kampus",
    "Aplikasi Mahasiswa",
    "Platform Akademik",
    "Absensi Online",
    "Absensi Digital",
    "Absensi Kuliah",
    "Jadwal Kuliah",
    "Materi Kuliah",
    "Tugas Kuliah",
    "Pengumuman Kampus",
    "Portal Mahasiswa",
    "Portal Akademik",
    "UPN",
    "UPN Veteran Jawa Timur",
    "Kampus Digital",
    "Sistem Kampus",
    "Manajemen Perkuliahan",
    "mahasiswa",
    "Kelas",
    "kelas",
  ],
  openGraph: {
    title: "ZORA - Sistem Manajemen dan Informasi Akademik",
    description: "Pusat informasi dan manajemen kelas untuk seluruh mahasiswa lintas program studi. Dimana Bumi dan Ilmu Pengetahuan Bersatu.",
    url: "https://zora.example.com", // ganti dengan domain asli Zora
    siteName: "Zora",
    images: [
      {
        url: "/og-image.png", // taruh file gambar di folder /public
        width: 1200,
        height: 630,
        alt: "Zora - Sistem Manajemen dan Informasi Akademik",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZORA - Sistem Manajemen dan Informasi Akademik",
    description: "Pusat informasi dan manajemen kelas untuk seluruh mahasiswa lintas program studi.",
    images: ["/og-image.png"],
  },
  verification: {
    google: [
      "googlec0409801ae0d1598",
      "-c_oKPxD--bqsEt7rMvILOccQIqJQfajX5CJUZQbxpM",
      "AR9_6P7RJUU2rPvyjrF_dZN2Pi1RZE0s8Q-kGItQjuM"
    ],
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
