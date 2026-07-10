import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- METADATA TETAP UTUH AGAR JUDUL TAB TETAP MEYAKINKAN ---
export const metadata: Metadata = {
  title: "Zora - Manajemen Agroteknologi C",
  description: "Zora: Pusat informasi dan manajemen akademik mahasiswa Agroteknologi C. Dimana Bumi dan Ilmu Pengetahuan Bersatu.",
  keywords: ["Zora", "Zoraferrs", "Agroteknologi", "UPN", "Manajemen Kelas", "Pertanian"],
  verification: {
    google: ["googlec0409801ae0d1598", "-c_oKPxD--bqsEt7rMvILOccQIqJQfajX5CJUZQbxpM"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Langsung potong proses di sini. Tidak me-render HTML, body, navbar, maupun children.
  return null;
}
