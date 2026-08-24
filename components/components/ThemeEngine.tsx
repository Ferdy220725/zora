"use client";

import { useEffect } from "react";

export default function ThemeEngine() {
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      // Jika jam menunjukkan antara 6 sore (18) sampai 6 pagi (6)
      const isDark = hour >= 18 || hour < 6;
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();
    // Cek setiap 1 menit sekali kalau-kalau waktu berganti saat user lagi buka web
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  return null; // Komponen ini bekerja di balik layar saja
}