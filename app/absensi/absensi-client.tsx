"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Lock, CheckCircle2, ClipboardCheck, XCircle, Loader2, AlertTriangle, LogIn } from 'lucide-react';

// Daftar Mahasiswa tetap dipertahankan sesuai aslinya
const DAFTAR_MAHASISWA = [
  { npm: "25025010093", nama: "SITI NUR FADILAH" },
  { npm: "25025010094", nama: "AGNIA LAQUINTA AL-ABIN" },
  { npm: "25025010095", nama: "AFIA DWI AGUSTIN" },
  { npm: "25025010096", nama: "APRILITA MASYFATAH" },
  { npm: "25025010097", nama: "SYAKILA BALQIS AL-FANEZA" },
  { npm: "25025010098", nama: "AULIA EKA SAITRI" },
  { npm: "25025010099", nama: "CALLISTA ZAHRATUNISSA" },
  { npm: "25025010100", nama: "AHMAT CHOYRUL FERDYANSYAH" },
  { npm: "25025010101", nama: "DHEA FITRI RAMADHANI" },
  { npm: "25025010102", nama: "ALIEF RAHMAT AKBARANI" },
  { npm: "25025010103", nama: "KARISMA ZAHRA LAILATUL FUADAH" },
  { npm: "25025010104", nama: "JAZZICA AZZURRA ANINDYA ZANDRA" },
  { npm: "25025010105", nama: "ENDYATMA ADRIEL FABIAN DAVID" },
  { npm: "25025010106", nama: "RIZQI SURYA PRATAMA" },
  { npm: "25025010107", nama: "ANNISA AULIA RAMADANI" },
  { npm: "25025010108", nama: "EKA RISZIANA AGUSTIN" },
  { npm: "25025010109", nama: "KHULLATUL BARIROH" },
  { npm: "25025010110", nama: "AGATHA ZULEYKA RAMDAN" },
  { npm: "25025010111", nama: "FAQIHATUN NISA’" },
  { npm: "25025010112", nama: "SALSABILLA OCTAVIA RAMADHANI" },
  { npm: "25025010113", nama: "KEYSHA AULIA AZZAHRA" },
  { npm: "25025010114", nama: "ANGEL MONICA NH" },
  { npm: "25025010115", nama: "USWATUN KHASANAH" },
  { npm: "25025010116", nama: "DHARMA AJI WISNU UTAMA" },
  { npm: "25025010117", nama: "KEIKY RESVANTI RAMADHANTI" },
  { npm: "25025010118", nama: "ANDINI SALWA INGRAINI" },
  { npm: "25025010119", nama: "TALITHA LISTYA SALSABILA" },
  { npm: "25025010120", nama: "ANDREA BENAYA PAGONGGANG" },
  { npm: "25025010121", nama: "AQDRIA YASHIRLY AMIRILA" },
  { npm: "25025010122", nama: "MOHAMMAD RIZKY HIKMAL PRAWIRA" },
  { npm: "25025010123", nama: "SAFRINA BR TINJAK" },
  { npm: "25025010124", nama: "CITRA PUTRI RAHMADANY" },
  { npm: "25025010125", nama: "ARJUNA WIRA KUSUMA" },
  { npm: "25025010126", nama: "NADIA FEBRISCA RACHMA" },
  { npm: "25025010127", nama: "KHANZA AFIFAH AMALINA" },
  { npm: "25025010128", nama: "FARINA PUTRI AURELIA" },
  { npm: "25025010129", nama: "M. FAREL AL FAHREZI" },
  { npm: "25025010130", nama: "LILIS DWI NURFADILAH" },
  { npm: "25025010131", nama: "AGNIA ALYA PUTRI" },
  { npm: "25025010132", nama: "CIKA RAHMA DWI ANJARSARI" },
  { npm: "25025010133", nama: "MARCELLY ELZA VARODIES" },
  { npm: "25025010134", nama: "MUHAMMAD DAFFA ABYANSYAH" },
  { npm: "25025010135", nama: "RAFINES AL MUSLIM" },
  { npm: "25025010137", nama: "SONYA DAMAYANTI AZ-ZAHARA" },
  { npm: "25025010138", nama: "PRATIWI CITRA OKTAVIA" }
];

export default function AbsensiMahasiswa() {
  const searchParams = useSearchParams();
  const kelasIdFromUrl = searchParams.get('kelas');

  const [selectedStudent, setSelectedStudent] = useState('');
  const [namaManual, setNamaManual] = useState('');
  const [npmManual, setNpmManual] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- STATE UNTUK KODE AKSES (diverifikasi di server saat submit) ---
  const [inputKode, setInputKode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // --- STATE UNTUK RESOLVE kelas_id (dari URL, atau fallback dari akun login) ---
  const [resolvedKelasId, setResolvedKelasId] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [kelasNotFound, setKelasNotFound] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    resolveKelasAndCheckStatus();
  }, [kelasIdFromUrl]);

  // Prioritas: 1) ?kelas= di URL (link publik per-kelas yang dibagikan dosen/admin)
  //            2) kelas_id dari profil user yang lagi login (akses dari dalam dashboard, tanpa link khusus)
  const resolveKelasAndCheckStatus = async () => {
    setLoading(true);
    setNeedsLogin(false);
    setKelasNotFound(false);

    if (kelasIdFromUrl) {
      setResolvedKelasId(kelasIdFromUrl);
      await checkStatus(kelasIdFromUrl);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('kelas_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.kelas_id) {
      setKelasNotFound(true);
      setLoading(false);
      return;
    }

    setResolvedKelasId(profile.kelas_id);
    await checkStatus(profile.kelas_id);
  };

  // 1 request ringan: cuma nanya "absen lagi dibuka atau nggak"
  const checkStatus = async (kelasIdParam: string) => {
    const { data } = await supabase.rpc('absen_status', { p_kelas_id: kelasIdParam });
    setIsOpen(data === true);
    setLoading(false);
  };

  // Kode TIDAK dicek di browser lagi (biar gak bisa diintip). Dicek di server saat submit.
  const handleVerifikasiKode = () => {
    if (!inputKode.trim()) {
      alert("Masukkan kode absensi dulu!");
      return;
    }
    setIsVerified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolvedKelasId) {
      alert("Kelas tidak terdeteksi. Silakan refresh halaman ini.");
      return;
    }

    let finalNama = "";
    let finalNpm = "";

    if (selectedStudent === "LAINNYA") {
      if (!namaManual || !npmManual) return alert("Mohon isi Nama dan NPM!");
      finalNama = namaManual.trim().toUpperCase();
      finalNpm = npmManual.trim();
    } else if (selectedStudent !== "") {
      const student = DAFTAR_MAHASISWA.find(s => s.npm === selectedStudent);
      finalNama = student?.nama || "";
      finalNpm = student?.npm || "";
    } else {
      return alert("Silakan pilih nama Anda!");
    }

    setIsSubmitting(true);

    try {
      // 1 request: server yang cek status, kode, duplikat, lalu insert
      const { data, error } = await supabase.rpc('submit_absensi', {
        p_kelas_id: resolvedKelasId,
        p_kode: inputKode,
        p_nama: finalNama,
        p_npm: finalNpm
      });

      if (error) throw error;

      if (data === 'CLOSED') {
        setIsOpen(false);
        return;
      }
      if (data === 'WRONG_CODE') {
        alert("Kode Absensi Salah! Silakan hubungi Admin/Dosen.");
        setIsVerified(false);
        setInputKode('');
        return;
      }
      if (data === 'DUPLICATE') {
        alert("NPM ini sudah melakukan presensi hari ini!");
        return;
      }
      if (data !== 'OK') {
        throw new Error("Respons tidak dikenali dari server.");
      }

      localStorage.setItem('nama_user_solaria', finalNama);
      setIsSuccess(true);

    } catch (err: any) {
      alert("Sistem Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a]">
      <Loader2 className="animate-spin text-indigo-600" size={28} />
    </div>
  );

  // --- BELUM LOGIN & LINK GAK BAWA ?kelas= ---
  if (needsLogin) return (
    <div className="flex h-screen items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a] p-6">
      <div className="text-center bg-white dark:bg-[#141414] p-10 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/10 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
          <LogIn className="text-amber-600" size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Silakan Login Dulu</h1>
        <p className="text-sm font-medium text-slate-400">Kamu perlu login supaya sistem tahu kelasmu sebelum bisa mengisi presensi.</p>
      </div>
    </div>
  );

  // --- SUDAH LOGIN TAPI PROFIL GAK PUNYA kelas_id ---
  if (kelasNotFound) return (
    <div className="flex h-screen items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a] p-6">
      <div className="text-center bg-white dark:bg-[#141414] p-10 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/10 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="text-amber-600" size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Kelas Tidak Terdeteksi</h1>
        <p className="text-sm font-medium text-slate-400">Akun kamu belum terhubung ke kelas manapun. Hubungi admin untuk memperbaiki ini.</p>
      </div>
    </div>
  );

  if (!isOpen) return (
    <div className="flex h-screen items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a] p-6">
      <div className="text-center bg-white dark:bg-[#141414] p-10 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/10 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <XCircle className="text-red-600" size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Absen Ditutup</h1>
        <p className="text-sm font-medium text-slate-400">Sistem sedang ditutup oleh Admin.</p>
      </div>
    </div>
  );

  if (isSuccess) return (
    <div className="flex h-screen items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a] p-6">
      <div className="text-center bg-white dark:bg-[#141414] p-10 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/10 max-w-md w-full">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-emerald-600" size={36} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Berhasil!</h1>
        <p className="text-sm font-medium text-slate-400">Presensi kamu sudah direkam</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6">

      {/* TAMPILAN 1: INPUT KODE (GERBANG AWAL) */}
      {!isVerified ? (
        <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-[32px] shadow-sm border border-slate-100 dark:border-white/10 p-8 md:p-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
              <Lock className="text-white" size={22} />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Masukkan Kode Akses</h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Minta kode akses ke dosen atau admin</p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="KODE DISINI"
              value={inputKode}
              onChange={(e) => setInputKode(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 focus:border-indigo-500 rounded-2xl outline-none font-black text-center uppercase tracking-widest transition-all text-slate-900 dark:text-white"
            />
            <button
              onClick={handleVerifikasiKode}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Verifikasi & Buka Form →
            </button>
          </div>
        </div>
      ) : (
        /* TAMPILAN 2: FORMULIR ABSENSI ASLI (MUNCUL SETELAH KODE DIISI) */
        <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-[32px] shadow-sm border border-slate-100 dark:border-white/10 animate-in slide-in-from-bottom-10 duration-500">
          <div className="p-8 md:p-10">
            <div className="mb-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
                <ClipboardCheck className="text-white" size={22} />
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Absensi Mahasiswa</h1>
              <p className="text-xs font-bold text-slate-400 mt-1">Pilih nama lalu kirim</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-wider">Cari Nama</label>
                {/*
                  PENTING: <option> di dalam <select> dirender pakai popup native
                  browser, background-nya HAMPIR SELALU PUTIH walau web-nya dark mode
                  (ini kontrol OS/browser, bukan CSS kita). Makanya <option> di bawah
                  sengaja dikasih warna teks gelap TETAP (gak pakai dark: variant),
                  biar teksnya selalu kebaca di atas background putih itu, baik pas
                  web mode terang maupun dark.
                */}
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold appearance-none cursor-pointer transition-all text-slate-900 dark:text-white"
                >
                  <option value="" className="text-slate-900 bg-white">-- Klik untuk memilih nama --</option>
                  {DAFTAR_MAHASISWA.map((m) => (
                    <option key={m.npm} value={m.npm} className="text-slate-900 bg-white">{m.nama}</option>
                  ))}
                  <option value="LAINNYA" className="text-slate-900 bg-white">--- Saya tidak ada di daftar (Lainnya) ---</option>
                </select>
              </div>

              {selectedStudent === "LAINNYA" && (
                <div className="space-y-3 animate-in fade-in duration-500">
                  <input
                    type="text"
                    placeholder="MASUKKAN NAMA LENGKAP"
                    className="w-full p-4 bg-slate-50 dark:bg-white/5 border-2 border-indigo-100 dark:border-indigo-500/20 focus:border-indigo-500 rounded-2xl outline-none font-bold uppercase text-slate-900 dark:text-white"
                    value={namaManual}
                    onChange={(e) => setNamaManual(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="MASUKKAN NPM"
                    className="w-full p-4 bg-slate-50 dark:bg-white/5 border-2 border-indigo-100 dark:border-indigo-500/20 focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                    value={npmManual}
                    onChange={(e) => setNpmManual(e.target.value)}
                  />
                </div>
              )}

              <button
                disabled={isSubmitting}
                type="submit"
                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all ${isSubmitting ? 'bg-slate-400' : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95'}`}
              >
                {isSubmitting ? 'Memproses...' : 'Kirim Absensi'}
              </button>
            </form>
          </div>
        </div>
      )}

      <p className="mt-6 text-[10px] font-bold text-slate-400 text-center tracking-wide">Satu NPM hanya diperbolehkan satu kali absen per hari</p>
    </div>
  );
}
