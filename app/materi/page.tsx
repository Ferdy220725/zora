"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { BookOpen, PackageOpen, Download } from 'lucide-react';

// --- KOMPONEN INTERAKTIF (3D EFFECT) ---
function InteractiveCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Membuat gerakan lebih smooth seperti pegas
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseXSpring, [-100, 100], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ perspective: 1000, rotateX, rotateY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

// --- HALAMAN UTAMA MATERI ---
interface Materi {
  id: string;
  judul: string;
  mk_nama: string;
  file_url: string;
  semester?: string | number; // Menambahkan field semester (opsional agar aman)
}

export default function MateriPage() {
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [filter, setFilter] = useState('Semua');
  const [filterSemester, setFilterSemester] = useState('Semua'); // State baru untuk filter semester

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('materi')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Gagal ambil data Supabase:", error.message);
      } else if (data) {
        setMateriList(data as Materi[]);
      }
    }
    fetchData();
  }, [supabase]);

  // 1. Mengambil daftar semester unik secara dinamis dari data yang ada
  const daftarSemester = Array.from(new Set(materiList.map(m => m.semester).filter(Boolean))).sort();

  // 2. SELARASKAN FILTER MK: Hanya ambil mata kuliah yang termasuk ke dalam semester yang sedang di-filter
  const daftarMK = Array.from(
    new Set(
      materiList
        .filter(m => filterSemester === 'Semua' || String(m.semester) === String(filterSemester))
        .map(m => m.mk_nama)
    )
  );

  // Logika Filter Ganda: Memfilter berdasarkan Mata Kuliah DAN Semester sekaligus
  const filteredMateri = materiList.filter(m => {
    const matchMK = filter === 'Semua' || m.mk_nama === filter;
    const matchSemester = filterSemester === 'Semua' || String(m.semester) === String(filterSemester);
    return matchMK && matchSemester;
  });

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a] font-sans pb-32">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">

        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Materi Kuliah
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-1">Eksplorasi bahan ajar Agroteknologi</p>
          </div>

          {/* Container Filter */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Filter Semester */}
            <select
              className="bg-white dark:bg-[#141414] border border-slate-100 dark:border-white/10 shadow-sm px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer active:scale-95 transition-all"
              value={filterSemester}
              onChange={(e) => {
                setFilterSemester(e.target.value);
                setFilter('Semua'); // Otomatis reset filter matkul saat semester berubah agar tidak macet
              }}
            >
              <option value="Semua">Semua Semester</option>
              {daftarSemester.map(sem => (
                <option key={String(sem)} value={String(sem)}>Semester {sem}</option>
              ))}
            </select>

            {/* Filter Mata Kuliah - Isinya dinamis disaring oleh pilihan Semester di atas */}
            <select
              className="bg-white dark:bg-[#141414] border border-slate-100 dark:border-white/10 shadow-sm px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer active:scale-95 transition-all"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="Semua">Semua Mata Kuliah</option>
              {daftarMK.map(mk => <option key={mk} value={mk}>{mk}</option>)}
            </select>
          </div>
        </div>

        {/* Grid Materi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMateri.map((m) => (
            <InteractiveCard key={m.id}>
              <div className="bg-white dark:bg-[#141414] p-6 rounded-[28px] flex flex-col justify-between h-full border border-slate-100 dark:border-white/10 shadow-sm transition-all group">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <BookOpen size={18} />
                    </div>
                    <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase bg-indigo-100 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg tracking-widest">
                      {m.mk_nama}
                    </span>
                    {m.semester && (
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg tracking-widest">
                        Smstr {m.semester}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base md:text-lg font-black leading-snug text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {m.judul}
                  </h2>
                </div>

                {/* Action Button */}
                <div className="mt-6 flex gap-2">
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    Lihat Materi
                  </a>
                  <a
                    href={m.file_url}
                    download
                    className="w-14 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl shadow-sm hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all"
                    title="Unduh Materi"
                  >
                    <Download size={16} strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            </InteractiveCard>
          ))}
        </div>

        {filteredMateri.length === 0 && (
          <div className="py-20 text-center">
            <PackageOpen className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-slate-300 dark:text-slate-600 font-black uppercase italic text-xl tracking-widest">Kosong</p>
          </div>
        )}
      </div>
    </div>
  );
}
