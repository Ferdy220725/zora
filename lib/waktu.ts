// lib/waktu.ts
// Semua perhitungan waktu asisten Zora dipusatkan di sini, biar konsisten
// dan gak ada logic timezone yang nyebar di banyak file.

export interface ModeWaktu {
  isDayWindow: boolean; // true = jam 06.00–17.00 WIB (mode "hari ini")
  targetDateStr: string; // format YYYY-MM-DD, sesuai targetHari
  targetDayIndex: number; // 0=Minggu...6=Sabtu, cocok sama kolom `hari` di jadwal_template
  targetDayName: string; // "Senin", "Selasa", dst — buat ditampilin & query jadwal_kuliah.day kalau formatnya nama hari
}

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function getModeWaktu(): ModeWaktu {
  const now = new Date();

  const jamWIB = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );

  const isDayWindow = jamWIB >= 6 && jamWIB < 17;

  // Tentukan tanggal target (hari ini atau besok) dalam kalender WIB, bukan kalender server.
  const targetDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(isDayWindow ? now : new Date(now.getTime() + 24 * 60 * 60 * 1000));

  // getDay() dari string YYYY-MM-DD aman dipakai karena sudah dalam kalender WIB
  const [y, m, d] = targetDateStr.split("-").map(Number);
  const targetDayIndex = new Date(y, m - 1, d).getDay();

  return {
    isDayWindow,
    targetDateStr,
    targetDayIndex,
    targetDayName: NAMA_HARI[targetDayIndex],
  };
}