"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  GraduationCap,
  Plus,
  Loader2,
  PackageOpen,
  Pencil,
  Archive,
  ArchiveRestore,
  ShieldAlert,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { getScholarshipStatus, getStatusLabel, getStatusBadgeClass } from '@/lib/scholarship-status';

interface Scholarship {
  id: string;
  name: string;
  provider_name: string;
  application_start: string;
  application_deadline: string;
  application_deadline_time: string | null;
  is_active: boolean;
  verification_status: string;
}

export default function AdminBeasiswaListPage() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, [showArchived]);

  const checkAdminAndLoad = async () => {
    setCheckingRole(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      setIsAdmin(false);
      setCheckingRole(false);
      return;
    }

    setIsAdmin(true);
    setCheckingRole(false);
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    setError(false);

    // Admin melihat semua (aktif + arsip) — RLS mengizinkan karena is_admin()
    const { data, error: fetchError } = await supabase
      .from('scholarships')
      .select('id, name, provider_name, application_start, application_deadline, application_deadline_time, is_active, verification_status')
      .eq('is_active', !showArchived ? true : false)
      .order('application_deadline', { ascending: true });

    if (fetchError) {
      console.error('Gagal memuat beasiswa (admin):', fetchError);
      setError(true);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as Scholarship[]);
    setLoading(false);
  };

  const toggleArchive = async (item: Scholarship) => {
    const nextActive = !item.is_active;
    setItems((prev) => prev.filter((i) => i.id !== item.id)); // optimistic: hilang dari list saat ini

    const { error: updateError } = await supabase
      .from('scholarships')
      .update({ is_active: nextActive })
      .eq('id', item.id);

    if (updateError) {
      console.error('Gagal ubah status arsip:', updateError);
      loadData(); // reload penuh kalau gagal, biar konsisten lagi
    }
  };

  // ------------------------------------------------------------
  // Guard states
  // ------------------------------------------------------------

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a] p-6">
        <div className="text-center space-y-3">
          <ShieldAlert className="mx-auto text-rose-400" size={40} />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Halaman ini khusus admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a] font-sans">
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Kelola Beasiswa</h1>
              <p className="text-xs text-slate-400 font-medium">Admin panel</p>
            </div>
          </div>
          <Link
            href="/admin/beasiswa/baru"
            className="flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-3 rounded-2xl hover:bg-indigo-700 transition-all shrink-0"
          >
            <Plus size={16} /> Tambah
          </Link>
        </div>

        {/* TABS */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !showArchived
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-[#141414] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/10'
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              showArchived
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-[#141414] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/10'
            }`}
          >
            Diarsipkan
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        )}

        {error && !loading && (
          <div className="bg-white dark:bg-[#141414] rounded-[24px] p-8 text-center shadow-sm border border-rose-100 dark:border-rose-500/20 space-y-3">
            <AlertCircle className="mx-auto text-rose-400" size={36} />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Gagal memuat data.</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
            >
              <RotateCcw size={14} /> Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-white dark:bg-[#141414] rounded-[28px] py-16 text-center shadow-sm border border-slate-100 dark:border-white/10">
            <PackageOpen className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-300 font-black uppercase italic text-sm tracking-widest">
              {showArchived ? 'Belum ada beasiswa diarsipkan' : 'Belum ada beasiswa'}
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => {
              const status = getScholarshipStatus(item);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#141414] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-white/10 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white text-sm truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {item.provider_name}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${getStatusBadgeClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 dark:bg-white/5">
                        {item.verification_status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/admin/beasiswa/${item.id}`}
                      className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                      aria-label="Edit beasiswa"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => toggleArchive(item)}
                      className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 transition-all"
                      aria-label={item.is_active ? 'Arsipkan' : 'Aktifkan kembali'}
                    >
                      {item.is_active ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}