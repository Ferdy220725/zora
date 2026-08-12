"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
      setCheckingSession(false);
    });
  }, []);

  const handleMasuk = () => {
    router.push(isLoggedIn ? '/dashboard' : '/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-[#f7f7fb] dark:bg-[#0a0a0a] font-sans">
      {/* Aksen gradasi lembut di pojok, senada tema indigo/purple dashboard */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,#4f46e5_1px,transparent_0)] [background-size:32px_32px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg">
        {/* CARD UTAMA */}
        <div className="bg-white dark:bg-[#141414] rounded-[32px] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-white/10 flex flex-col items-center">
          <img
            src="/logo-zora.png"
            alt="Logo Zora"
            className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-lg mb-6"
          />

          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 rounded-full mb-4">
            Class Management System
          </span>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            Selamat Datang di{' '}
            <span className="bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Zora
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            Sistem Manajemen Kelas  — pantau tugas, deadline,
            absensi, dan jadwal Zoom kelas dalam satu tempat.
          </p>

          <button
            onClick={handleMasuk}
            disabled={checkingSession}
            className="w-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-wider text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {checkingSession ? 'Memuat...' : 'Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
}