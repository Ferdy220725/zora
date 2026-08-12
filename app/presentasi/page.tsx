"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { generateKode } from "@/lib/generateKode";
import { MonitorPlay, LogIn } from "lucide-react";

type Retensi = "24h" | "permanent";

export default function PresentasiHome() {
  const [namaSesi, setNamaSesi] = useState("");
  const [retensi, setRetensi] = useState<Retensi>("24h");
  const [kodeMasuk, setKodeMasuk] = useState("");
  const [loading, setLoading] = useState(false);

  // Profil user: kelas_id & role, diambil sekali saat halaman dibuka
  const [kelasId, setKelasId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      setProfileLoading(true);
      setProfileError(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        if (mounted) {
          setProfileError("Kamu belum login. Silakan login dulu untuk membuat sesi.");
          setProfileLoading(false);
        }
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("kelas_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profileErr || !profile) {
        setProfileError("Gagal memuat profil kamu. Coba refresh halaman ini.");
        setProfileLoading(false);
        return;
      }

      setKelasId(profile.kelas_id);
      setProfileLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleBuatSesi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSesi.trim()) return;

    if (!kelasId) {
      alert("Kelas kamu belum terdeteksi. Pastikan profil kamu sudah terhubung ke kelas.");
      return;
    }
    setLoading(true);

    let lastError: string | null = null;

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
        kelas_id: kelasId, // wajib, karena policy INSERT butuh kelas_id = current_kelas_id()
      });

      if (!error) {
        router.push(`/presentasi/${kode}`);
        return;
      }

      lastError = error.message;
      console.error("Insert sesi_presentasi gagal:", error);

      // Kalau errornya bukan soal duplicate kode, tidak ada gunanya retry
      if (!error.message.toLowerCase().includes("duplicate")) break;
    }

    setLoading(false);
    alert(
      lastError
        ? `Gagal membuat sesi: ${lastError}`
        : "Gagal membuat sesi, coba lagi."
    );
  };

  const handleMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    const kode = kodeMasuk.trim().toUpperCase();
    if (!kode) return;
    router.push(`/presentasi/${kode}`);
  };

  const buatSesiDisabled = loading || profileLoading || !kelasId;

  return (
    <div className="w-full min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a]">
      <div className="p-4 md:p-8 max-w-3xl mx-auto pb-32">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Ruang Presentasi
        </h1>
        <p className="text-slate-400 font-medium mb-8 sm:mb-10 text-sm">
          Upload PPT kelompokmu, tinggal buka pas presentasi. Tanpa cari-cari file lagi.
        </p>

        {profileError && (
          <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
            {profileError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Buat Sesi */}
          <form
            onSubmit={handleBuatSesi}
            className="bg-white dark:bg-[#141414] p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <MonitorPlay size={18} />
              </div>
              <span className="font-black text-slate-900 dark:text-white text-sm">Buat sesi baru</span>
            </div>

            <input
              type="text"
              placeholder="Nama sesi, misal: Kelas C - 5 Juli"
              value={namaSesi}
              onChange={(e) => setNamaSesi(e.target.value)}
              disabled={buatSesiDisabled}
              className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              required
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={retensi === "24h"}
                  onChange={() => setRetensi("24h")}
                  disabled={buatSesiDisabled}
                  className="accent-indigo-600"
                />
                Hapus otomatis 24 jam
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={retensi === "permanent"}
                  onChange={() => setRetensi("permanent")}
                  disabled={buatSesiDisabled}
                  className="accent-indigo-600"
                />
                Simpan permanen
              </label>
            </div>

            <button
              type="submit"
              disabled={buatSesiDisabled}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-2xl shadow-md disabled:opacity-50 active:scale-95 transition-all"
            >
              {profileLoading ? "Memuat..." : loading ? "Membuat..." : "Buat Sesi"}
            </button>
          </form>

          {/* Masuk pakai kode */}
          <form
            onSubmit={handleMasuk}
            className="bg-white dark:bg-[#141414] p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <LogIn size={18} />
              </div>
              <span className="font-black text-slate-900 dark:text-white text-sm">Masuk pakai kode</span>
            </div>

            <input
              type="text"
              placeholder="Contoh: ZR8X2K"
              value={kodeMasuk}
              onChange={(e) => setKodeMasuk(e.target.value)}
              className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl px-4 py-3 uppercase tracking-widest text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:tracking-normal placeholder:normal-case outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />

            <button
              type="submit"
              className="w-full bg-slate-800 dark:bg-white/10 hover:bg-slate-900 dark:hover:bg-white/20 text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-2xl shadow-md active:scale-95 transition-all"
            >
              Masuk Sesi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}