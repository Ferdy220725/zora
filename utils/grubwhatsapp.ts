// ── Daftar grup WhatsApp tujuan pengiriman surat izin ───────────────────────
// Di-hardcode dulu untuk Kelas C. Kalau nanti ada kelas lain yang ikut pakai
// Zora, daftar ini tinggal dipindah ke tabel database (per kelas_id).
//
// Link invite grup dipakai apa adanya (format https://chat.whatsapp.com/KODE).
// Kalau ada grup yang link-nya di-reset admin grup, ganti di sini saja.

export type GrupWhatsapp = {
  id: string;
  nama: string; // nama yang tampil di kartu pilihan (juga dipakai untuk mencocokkan dengan input Mata Kuliah)
  link: string;
  umum?: boolean; // true = grup kelas (bukan grup per mata kuliah)
};

export const GRUP_WHATSAPP: GrupWhatsapp[] = [
  {
    id: "mikrobiologi-pertanian",
    nama: "Mikrobiologi Pertanian",
    link: "https://chat.whatsapp.com/DFlKsCLTGdk98dDbelJDJs",
  },
  {
    id: "ekologi-pertanian",
    nama: "Ekologi Pertanian",
    link: "https://chat.whatsapp.com/K7fL7JsEYPyCgvAJ5iXbA3",
  },
  {
    id: "hppt",
    nama: "HPPT",
    link: "https://chat.whatsapp.com/DRGVSJwGphJ6hzZphSTCQf",
  },
  {
    id: "tpth",
    nama: "TPTH",
    link: "https://chat.whatsapp.com/DV3xuGn0rfN6jINpKXPRKK",
  },
  {
    id: "pemuliaan-tanaman",
    nama: "Pemuliaan Tanaman",
    link: "https://chat.whatsapp.com/LxzLwCTFByvH0IdGyNjDOM",
  },
  {
    id: "kesuburan-tanah",
    nama: "Kesuburan Tanah",
    link: "https://chat.whatsapp.com/BFFs4ZfGODtDQk3BV2x8y8",
  },
  {
    id: "kelas-c",
    nama: "Kelas C",
    link: "https://chat.whatsapp.com/Gjj7R02TZ0T33JGN5Egf9V",
    umum: true,
  },
];