"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

interface BalasanItem {
  id: string;
  bantuan_id: string;
  user_id: string;
  isi: string;
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

  // --- Balasan per pertanyaan: dikelompokkan per bantuan_id ---
  const [balasanMap, setBalasanMap] = useState<Record<string, BalasanItem[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [balasanInput, setBalasanInput] = useState<Record<string, string>>({});
  const [sendingBalasan, setSendingBalasan] = useState<Record<string, boolean>>({});

  // ref biar realtime callback selalu tahu daftar bantuan terbaru,
  // tanpa perlu re-subscribe channel tiap kali bantuanList berubah
  const bantuanIdsRef = useRef<string[]>([]);

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

  // --- Ambil semua balasan buat daftar bantuan_id yang lagi tampil ---
  const fetchBalasan = useCallback(async (bantuanIds: string[]) => {
    if (bantuanIds.length === 0) {
      setBalasanMap({});
      return;
    }
    const { data, error } = await supabase
      .from('bantuan_tugas_balasan')
      .select('id, bantuan_id, user_id, isi, created_at, profiles:user_id(nama)')
      .in('bantuan_id', bantuanIds)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const grouped: Record<string, BalasanItem[]> = {};
      data.forEach((b: any) => {
        const item: BalasanItem = {
          id: b.id,
          bantuan_id: b.bantuan_id,
          user_id: b.user_id,
          isi: b.isi,
          created_at: b.created_at,
          nama_pengirim: b.profiles?.nama || 'Teman sekelas',
        };
        if (!grouped[b.bantuan_id]) grouped[b.bantuan_id] = [];
        grouped[b.bantuan_id].push(item);
      });
      setBalasanMap(grouped);
    }
  }, [supabase]);

  // --- Ambil daftar permintaan bantuan yang masih terbuka buat tugas ini ---
  const fetchBantuan = useCallback(async () => {
    const { data, error } = await supabase
      .from('bantuan_tugas')
      .select('id, user_id, pertanyaan, status, created_at, profiles:user_id(nama)')
      .eq('tugas_id', tugasId)
      .eq('status', 'terbuka')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const list = data.map((b: any) => ({
        id: b.id,
        user_id: b.user_id,
        pertanyaan: b.pertanyaan,
        status: b.status,
        created_at: b.created_at,
        nama_pengirim: b.profiles?.nama || 'Teman sekelas',
      }));
      setBantuanList(list);
      const ids = list.map((b) => b.id);
      bantuanIdsRef.current = ids;
      fetchBalasan(ids);
    }
  }, [supabase, tugasId, fetchBalasan]);

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

    // --- Subscribe realtime: balasan baru ikut muncul di thread yang relevan ---
    // Tabel ini tidak difilter tugas_id langsung, jadi disaring manual lewat bantuanIdsRef
    const balasanChannel = supabase
      .channel(`bantuan-balasan-${tugasId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bantuan_tugas_balasan' },
        (payload: any) => {
          const relatedId = payload.new?.bantuan_id || payload.old?.bantuan_id;
          if (relatedId && bantuanIdsRef.current.includes(relatedId)) {
            fetchBalasan(bantuanIdsRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buktiChannel);
      supabase.removeChannel(bantuanChannel);
      supabase.removeChannel(balasanChannel);
    };
  }, [tugasId, fetchProgres, fetchBantuan, fetchBalasan, supabase]);

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

  // --- Kirim balasan ke pertanyaan tertentu ---
  const handleKirimBalasan = async (bantuanId: string) => {
    const isi = (balasanInput[bantuanId] || '').trim();
    if (!isi) {
      toast.warning('Tulis dulu jawabanmu');
      return;
    }
    if (!currentUserId) {
      toast.error('Sesi kamu tidak terdeteksi, coba refresh halaman');
      return;
    }

    setSendingBalasan((prev) => ({ ...prev, [bantuanId]: true }));
    const { error } = await supabase.from('bantuan_tugas_balasan').insert([{
      bantuan_id: bantuanId,
      user_id: currentUserId,
      isi,
    }]);
    setSendingBalasan((prev) => ({ ...prev, [bantuanId]: false }));

    if (error) {
      toast.error('Gagal mengirim balasan: ' + error.message);
      return;
    }

    setBalasanInput((prev) => ({ ...prev, [bantuanId]: '' }));
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
            bantuanList.map((b) => {
              const balasanTugasIni = balasanMap[b.id] || [];
              const isExpanded = expandedId === b.id;

              return (
                <div
                  key={b.id}
                  className="bg-slate-50 dark:bg-white/5 rounded-xl overflow-hidden"
                >
                  {/* PERTANYAAN — klik buat expand/collapse thread */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                    className="w-full flex items-start gap-2 p-2.5 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-700 dark:text-amber-400 shrink-0">
                      {b.nama_pengirim?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{b.nama_pengirim}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{b.pertanyaan}</p>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">
                        {balasanTugasIni.length > 0
                          ? `${balasanTugasIni.length} balasan — ${isExpanded ? 'sembunyikan' : 'lihat & bantu jawab'}`
                          : (isExpanded ? 'sembunyikan' : 'balas & bantu jawab')}
                      </p>
                    </div>
                    {b.user_id === currentUserId && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTutupBantuan(b.id);
                        }}
                        className="text-[9px] font-black text-emerald-600 hover:underline shrink-0 pt-0.5"
                      >
                        Sudah terjawab
                      </span>
                    )}
                  </button>

                  {/* THREAD BALASAN */}
                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 space-y-2">
                      {balasanTugasIni.length > 0 && (
                        <div className="space-y-2 pl-3 border-l-2 border-amber-200 dark:border-amber-500/30">
                          {balasanTugasIni.map((r) => (
                            <div key={r.id} className="bg-white dark:bg-white/10 rounded-lg p-2">
                              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                {r.nama_pengirim}
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300">{r.isi}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tulis jawabanmu di sini..."
                          className="flex-1 border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent p-2 rounded-xl text-[11px] text-black dark:text-white"
                          value={balasanInput[b.id] || ''}
                          onChange={(e) =>
                            setBalasanInput((prev) => ({ ...prev, [b.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleKirimBalasan(b.id)}
                        />
                        <button
                          onClick={() => handleKirimBalasan(b.id)}
                          disabled={sendingBalasan[b.id]}
                          className="bg-indigo-600 text-white px-4 rounded-xl text-[11px] font-black uppercase disabled:opacity-50"
                        >
                          Balas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* FORM PERTANYAAN BARU */}
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
