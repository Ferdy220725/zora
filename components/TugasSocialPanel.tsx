"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface BantuanItem {
  id: string;
  user_id: string;
  pertanyaan: string;
  status: string;
  created_at: string;
  nama_pengirim?: string;
}

interface TugasSocialPanelProps {
  tugasId: string;
  tugasTipe: 'kuliah' | 'praktikum';
  kelasId: string;
}

export default function TugasSocialPanel({ tugasId, tugasTipe, kelasId }: TugasSocialPanelProps) {
  const supabase = createClient();

  const [totalMahasiswa, setTotalMahasiswa] = useState(0);
  const [totalSelesai, setTotalSelesai] = useState(0);
  const [progresLoaded, setProgresLoaded] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [bantuanList, setBantuanList] = useState<BantuanItem[]>([]);
  const [pertanyaanInput, setPertanyaanInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // --- Ambil progres: berapa yang sudah selesai vs total mahasiswa di kelas ---
  const fetchProgres = useCallback(async () => {
    const { count: selesaiCount } = await supabase
      .from('bukti_tugas')
      .select('*', { count: 'exact', head: true })
      .eq('tugas_id', tugasId);

    const { count: mahasiswaCount, error: mahasiswaError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('kelas_id', kelasId)
      .eq('role', 'mahasiswa');

    if (mahasiswaError) {
      console.error('Gagal hitung total mahasiswa:', mahasiswaError.message);
    }

    setTotalSelesai(selesaiCount || 0);
    setTotalMahasiswa(mahasiswaCount || 0);
    setProgresLoaded(true);
  }, [supabase, tugasId, kelasId]);

  // --- Ambil daftar permintaan bantuan yang masih terbuka buat tugas ini ---
  const fetchBantuan = useCallback(async () => {
    const { data, error } = await supabase
      .from('bantuan_tugas')
      .select('id, user_id, pertanyaan, status, created_at, profiles:user_id(nama)')
      .eq('tugas_id', tugasId)
      .eq('status', 'terbuka')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBantuanList(
        data.map((b: any) => ({
          id: b.id,
          user_id: b.user_id,
          pertanyaan: b.pertanyaan,
          status: b.status,
          created_at: b.created_at,
          nama_pengirim: b.profiles?.nama || 'Teman sekelas',
        }))
      );
    }
  }, [supabase, tugasId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });

    fetchProgres();
    fetchBantuan();

    // --- Subscribe realtime: progres ikut update kalau ada yang tandai selesai ---
    const buktiChannel = supabase
      .channel(`bukti-tugas-${tugasId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bukti_tugas', filter: `tugas_id=eq.${tugasId}` },
        () => fetchProgres()
      )
      .subscribe();

    // --- Subscribe realtime: daftar bantuan ikut update kalau ada permintaan baru ---
    const bantuanChannel = supabase
      .channel(`bantuan-tugas-${tugasId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bantuan_tugas', filter: `tugas_id=eq.${tugasId}` },
        () => fetchBantuan()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buktiChannel);
      supabase.removeChannel(bantuanChannel);
    };
  }, [tugasId, fetchProgres, fetchBantuan, supabase]);

  const persenSelesai = totalMahasiswa > 0 ? Math.round((totalSelesai / totalMahasiswa) * 100) : 0;

  const handleKirimBantuan = async () => {
    if (!pertanyaanInput.trim()) {
      toast.warning('Tulis dulu yang kamu butuhkan');
      return;
    }
    if (!currentUserId) {
      toast.error('Sesi kamu tidak terdeteksi, coba refresh halaman');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('bantuan_tugas').insert([{
      tugas_id: tugasId,
      tugas_tipe: tugasTipe,
      user_id: currentUserId,
      kelas_id: kelasId,
      pertanyaan: pertanyaanInput.trim(),
    }]);
    setSubmitting(false);

    if (error) {
      toast.error('Gagal mengirim: ' + error.message);
      return;
    }

    toast.success('Permintaan bantuan terkirim ke teman sekelas');
    setPertanyaanInput('');
  };

  const handleTutupBantuan = async (id: string) => {
    const { error } = await supabase
      .from('bantuan_tugas')
      .update({ status: 'ditutup' })
      .eq('id', id);

    if (error) {
      toast.error('Gagal menutup: ' + error.message);
      return;
    }
    toast.success('Ditandai sudah terjawab');
  };

  return (
    <div className="mt-3">
      {/* PROGRES SOSIAL */}
      <div className="mb-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[11px] text-slate-500 font-medium">
            {!progresLoaded
              ? 'Memuat progres...'
              : totalMahasiswa > 0
              ? `${totalSelesai} dari ${totalMahasiswa} mahasiswa sudah selesai`
              : 'Belum ada data mahasiswa di kelas ini'}
          </span>
          <span className="text-[11px] font-bold text-indigo-600">{persenSelesai}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${persenSelesai}%` }}
          />
        </div>
      </div>

      {/* TOMBOL BUTUH BANTUAN */}
      <button
        onClick={() => setShowHelpPanel((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
      >
        {bantuanList.length > 0
          ? `${bantuanList.length} teman butuh bantuan di tugas ini`
          : 'Butuh bantuan?'}
      </button>

      {/* PANEL BANTUAN */}
      {showHelpPanel && (
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-white/10 space-y-2">
          {bantuanList.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">Belum ada yang minta bantuan di tugas ini.</p>
          ) : (
            bantuanList.map((b) => (
              <div
                key={b.id}
                className="flex items-start gap-2 bg-slate-50 dark:bg-white/5 rounded-xl p-2.5"
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-700 dark:text-amber-400 shrink-0">
                  {b.nama_pengirim?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{b.nama_pengirim}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{b.pertanyaan}</p>
                </div>
                {b.user_id === currentUserId && (
                  <button
                    onClick={() => handleTutupBantuan(b.id)}
                    className="text-[9px] font-black text-emerald-600 hover:underline shrink-0"
                  >
                    Sudah terjawab
                  </button>
                )}
              </div>
            ))
          )}

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Bagian mana yang bikin kamu bingung?"
              className="flex-1 border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent p-2.5 rounded-xl text-[11px] text-black dark:text-white"
              value={pertanyaanInput}
              onChange={(e) => setPertanyaanInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleKirimBantuan()}
            />
            <button
              onClick={handleKirimBantuan}
              disabled={submitting}
              className="bg-amber-500 text-white px-4 rounded-xl text-[11px] font-black uppercase disabled:opacity-50"
            >
              Kirim
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
