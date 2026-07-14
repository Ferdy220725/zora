export interface JadwalItem {
  id: string;
  hari: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu";
  mataKuliah: string;
  dosen?: string;
  jamMulai: string;
  jamSelesai: string;
  gedung: string;
  lantai: string;
}

export interface JadwalWallpaperData {
  namaKelas: string;
  semester?: string;
  items: JadwalItem[];
}