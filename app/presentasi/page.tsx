"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { generateKode } from "@/lib/generateKode";
import { MonitorPlay, LogIn } from "lucide-react";

export default function PresentasiHome() {
  const [namaSesi, setNamaSesi] = useState("");
  const [retensi, setRetensi] = useState<"24h" | "permanent">("24h");
  const [kodeMasuk, setKodeMasuk] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleBuatSesi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSesi.trim()) return;
    setLoading(true);

    for (let attempt = 0; attempt < 5; attempt++) {
      const kode = generateKode();
      const expires_at =
        retensi === "24h"
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null;

      const { error } = await supabase.from("sesi_presentasi").insert({
        kode,
        nama_sesi: namaSesi.trim(),
        retensi,
        expires_at,
      });

      if (!error) {
        router.push(`/presentasi/${kode}`);
        return;
      }
      if (!error.message.includes("duplicate")) break;
    }
    setLoading(false);
    alert("Gagal membuat sesi, coba lagi.");
  };

  const handleMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    const kode = kodeMasuk.trim().toUpperCase();
    if (!kode) return;
    router.push(`/presentasi/${kode}`);
  };

  return (
    // w-full + bg di sini memastikan area di luar max-w juga ikut terang,
    // bukan warna default body
    <div className="w-full min-h-screen bg-[#f8f9fa]">
      <div className="p-4 sm:p-8 max-w-3xl mx-auto pb-32">
        <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-[#800020] mb-2">
          Ruang Presentasi
        </h1>
        <p className="text-slate-500 mb-8 sm:mb-10">
          Upload PPT kelompokmu, tinggal buka pas presentasi. Tanpa cari-cari file lagi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleBuatSesi}
            className="bg-white p-6 rounded-[30px] shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center gap-2 text-[#800020] font-bold">
              <MonitorPlay size={20} />
              Buat sesi baru
            </div>
            <input
              type="text"
              placeholder="Nama sesi, misal: Kelas C - 5 Juli"
              value={namaSesi}
              onChange={(e) => setNamaSesi(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400"
              required
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={retensi === "24h"}
                  onChange={() => setRetensi("24h")}
                />
                Hapus otomatis 24 jam
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={retensi === "permanent"}
                  onChange={() => setRetensi("permanent")}
                />
                Simpan permanen
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#800020] text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? "Membuat..." : "Buat Sesi"}
            </button>
          </form>

          <form
            onSubmit={handleMasuk}
            className="bg-white p-6 rounded-[30px] shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center gap-2 text-[#800020] font-bold">
              <LogIn size={20} />
              Masuk pakai kode
            </div>
            <input
              type="text"
              placeholder="Contoh: ZR8X2K"
              value={kodeMasuk}
              onChange={(e) => setKodeMasuk(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 uppercase tracking-widest text-slate-800 placeholder:text-slate-400 placeholder:tracking-normal placeholder:normal-case"
            />
            <button
              type="submit"
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl"
            >
              Masuk Sesi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}