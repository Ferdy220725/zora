"use client";

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Loader2, Check } from 'lucide-react';
import { subscribeUser, getNotificationStatus } from '@/lib/push';

export default function AktifkanNotifikasi() {
  const [checking, setChecking] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getNotificationStatus().then((status) => {
      setEnabled(status);
      setChecking(false);
    });
  }, []);

  const handleAktifkan = async () => {
    setLoading(true);
    setErrorMsg('');
    const result = await subscribeUser();
    setLoading(false);

    if (result.success) {
      setEnabled(true);
      return;
    }

    if (result.reason === 'denied') {
      setErrorMsg('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser untuk mencoba lagi.');
    } else if (result.reason === 'unsupported') {
      setErrorMsg('Browser ini belum mendukung notifikasi push.');
    } else if (result.reason === 'not-logged-in') {
      setErrorMsg('Sesi login tidak ditemukan, coba muat ulang halaman.');
    } else {
      setErrorMsg('Gagal mengaktifkan notifikasi, coba lagi.');
    }
  };

  if (checking) return null;

  if (enabled) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-4 py-3 rounded-2xl">
        <Check size={16} />
        Notifikasi tugas H-1 & H-0 aktif di perangkat ini
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#141414] rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-white/10">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
          <Bell size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Aktifkan Pengingat Tugas</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-3">
            Dapatkan notifikasi otomatis langsung ke browser/HP saat ada tugas deadline besok maupun hari ini.
          </p>
          <button
            onClick={handleAktifkan}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
            {loading ? 'Mengaktifkan...' : 'Aktifkan Notifikasi'}
          </button>
          {errorMsg && <p className="text-[11px] font-bold text-red-500 mt-2">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}