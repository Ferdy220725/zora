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
  edited_at: string | null;
  nama_pengirim?: string;
}

interface ReaksiItem {
  id: string;
  bantuan_id: string | null;
  balasan_id: string | null;
  user_id: string;
  emoji: string;
}

interface TugasSocialPanelProps {
  tugasId: string;
  tugasTipe: 'kuliah' | 'praktikum';
  kelasId: string;
}

type TargetType = 'bantuan' | 'balasan';

interface PopupState {
  mode: 'menu' | 'reaksi';
  targetType: TargetType;
  targetId: string;
  x: number;
  y: number;
}

const BATAS_EDIT_MS = 15 * 60 * 1000; // 15 menit
const LONG_PRESS_MS = 450;

// Daftar emoji reaksi yang diizinkan (hanya ini yang bisa dipilih user)
const REAKSI_TERSEDIA = [
  // wajah / ekspresi
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜',
  '🤪', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😢', '😭',
  '😤', '😠', '😡', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
  '🤗', '🤔', '🙄', '😬', '🥱', '😴',
  // hati
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕',
  '💖', '💘',
  // tangan & simbol
  '👍', '👎', '👏', '🙌', '🙏', '💪', '✌️', '🤝', '✨', '🔥',
  '💯', '🎉',
];

const AVATAR_GRADIENTS = [
  'from-amber-400 to-orange-500',
  'from-indigo-400 to-purple-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-fuchsia-400 to-purple-500',
];

function warnaAvatar(nama: string) {
  const total = nama.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[total % AVATAR_GRADIENTS.length];
}

function isMasihBisaEdit(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < BATAS_EDIT_MS;
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
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

  const [balasanMap, setBalasanMap] = useState<Record<string, BalasanItem[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [balasanInput, setBalasanInput] = useState<Record<string, string>>({});
  const [sendingBalasan, setSendingBalasan] = useState<Record<string, boolean>>({});

  const [reaksiList, setReaksiList] = useState<ReaksiItem[]>([]);

  const [editingBalasanId, setEditingBalasanId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [popup, setPopup] = useState<PopupState | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);
  const pressPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const bantuanIdsRef = useRef<string[]>([]);
  const balasanIdsRef = useRef<string[]>([]);
  const threadEndRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const fetchReaksi = useCallback(async (bantuanIds: string[], balasanIds: string[]) => {
    if (bantuanIds.length === 0 && balasanIds.length === 0) {
      setReaksiList([]);
      return;
    }
    const filters: string[] = [];
    if (bantuanIds.length > 0) filters.push(`bantuan_id.in.(${bantuanIds.join(',')})`);
    if (balasanIds.length > 0) filters.push(`balasan_id.in.(${balasanIds.join(',')})`);

    const { data, error } = await supabase
      .from('bantuan_reaksi')
      .select('id, bantuan_id, balasan_id, user_id, emoji')
      .or(filters.join(','));

    if (!error && data) {
      setReaksiList(data as ReaksiItem[]);
    }
  }, [supabase]);

  const fetchBalasan = useCallback(async (bantuanIds: string[]) => {
    if (bantuanIds.length === 0) {
      setBalasanMap({});
      balasanIdsRef.current = [];
      fetchReaksi(bantuanIds, []);
      return;
    }
    const { data, error } = await supabase
      .from('bantuan_tugas_balasan')
      .select('id, bantuan_id, user_id, isi, created_at, edited_at, profiles:user_id(nama)')
      .in('bantuan_id', bantuanIds)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const grouped: Record<string, BalasanItem[]> = {};
      const ids: string[] = [];
      data.forEach((b: any) => {
        const item: BalasanItem = {
          id: b.id,
          bantuan_id: b.bantuan_id,
          user_id: b.user_id,
          isi: b.isi,
          created_at: b.created_at,
          edited_at: b.edited_at,
          nama_pengirim: b.profiles?.nama || 'Teman sekelas',
        };
        if (!grouped[b.bantuan_id]) grouped[b.bantuan_id] = [];
        grouped[b.bantuan_id].push(item);
        ids.push(item.id);
      });
      setBalasanMap(grouped);
      balasanIdsRef.current = ids;
      fetchReaksi(bantuanIds, ids);
    }
  }, [supabase, fetchReaksi]);

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

    const buktiChannel = supabase
      .channel(`bukti-tugas-${tugasId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bukti_tugas', filter: `tugas_id=eq.${tugasId}` },
        () => fetchProgres()
      )
      .subscribe();

    const bantuanChannel = supabase
      .channel(`bantuan-tugas-${tugasId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bantuan_tugas', filter: `tugas_id=eq.${tugasId}` },
        () => fetchBantuan()
      )
      .subscribe();

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

    const reaksiChannel = supabase
      .channel(`bantuan-reaksi-${tugasId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bantuan_reaksi' },
        (payload: any) => {
          const bId = payload.new?.bantuan_id || payload.old?.bantuan_id;
          const rId = payload.new?.balasan_id || payload.old?.balasan_id;
          const relevan =
            (bId && bantuanIdsRef.current.includes(bId)) ||
            (rId && balasanIdsRef.current.includes(rId));
          if (relevan) {
            fetchReaksi(bantuanIdsRef.current, balasanIdsRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buktiChannel);
      supabase.removeChannel(bantuanChannel);
      supabase.removeChannel(balasanChannel);
      supabase.removeChannel(reaksiChannel);
    };
  }, [tugasId, fetchProgres, fetchBantuan, fetchBalasan, fetchReaksi, supabase]);

  const persenSelesai = totalMahasiswa > 0 ? Math.round((totalSelesai / totalMahasiswa) * 100) : 0;

  const getRingkasanReaksi = useCallback(
    (targetType: TargetType, targetId: string) => {
      const relevan = reaksiList.filter((r) =>
        targetType === 'bantuan' ? r.bantuan_id === targetId : r.balasan_id === targetId
      );
      const map: Record<string, { count: number; mine: boolean }> = {};
      relevan.forEach((r) => {
        if (!map[r.emoji]) map[r.emoji] = { count: 0, mine: false };
        map[r.emoji].count += 1;
        if (r.user_id === currentUserId) map[r.emoji].mine = true;
      });
      return map;
    },
    [reaksiList, currentUserId]
  );

  const handleToggleReaksi = async (targetType: TargetType, targetId: string, emoji: string) => {
    if (!currentUserId) {
      toast.error('Sesi kamu tidak terdeteksi, coba refresh halaman');
      return;
    }
    const kolom = targetType === 'bantuan' ? 'bantuan_id' : 'balasan_id';
    const sudahAda = reaksiList.some(
      (r) => r.user_id === currentUserId && r.emoji === emoji && (targetType === 'bantuan' ? r.bantuan_id === targetId : r.balasan_id === targetId)
    );

    if (sudahAda) {
      setReaksiList((prev) =>
        prev.filter(
          (r) =>
            !(r.user_id === currentUserId && r.emoji === emoji && (targetType === 'bantuan' ? r.bantuan_id === targetId : r.balasan_id === targetId))
        )
      );
      const { error } = await supabase
        .from('bantuan_reaksi')
        .delete()
        .eq('user_id', currentUserId)
        .eq('emoji', emoji)
        .eq(kolom, targetId);
      if (error) {
        toast.error('Gagal menghapus reaksi: ' + error.message);
        fetchReaksi(bantuanIdsRef.current, balasanIdsRef.current);
      }
    } else {
      const { error } = await supabase.from('bantuan_reaksi').insert([{
        [kolom]: targetId,
        user_id: currentUserId,
        emoji,
      }]);
      if (error) {
        toast.error('Gagal menambah reaksi: ' + error.message);
      }
    }
  };

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
    setTimeout(() => {
      threadEndRefs.current[bantuanId]?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 150);
  };

  const handleMulaiEdit = (r: BalasanItem) => {
    if (!isMasihBisaEdit(r.created_at)) {
      toast.warning('Sudah lewat 15 menit, pesan ini tidak bisa diedit lagi');
      return;
    }
    setEditingBalasanId(r.id);
    setEditText(r.isi);
  };

  const handleBatalEdit = () => {
    setEditingBalasanId(null);
    setEditText('');
  };

  const handleSimpanEdit = async (r: BalasanItem) => {
    const isiBaru = editText.trim();
    if (!isiBaru) {
      toast.warning('Isi pesan tidak boleh kosong');
      return;
    }
    if (!isMasihBisaEdit(r.created_at)) {
      toast.warning('Sudah lewat 15 menit, pesan ini tidak bisa diedit lagi');
      setEditingBalasanId(null);
      return;
    }
    if (isiBaru === r.isi) {
      setEditingBalasanId(null);
      return;
    }

    setSavingEdit(true);
    const { error } = await supabase
      .from('bantuan_tugas_balasan')
      .update({ isi: isiBaru, edited_at: new Date().toISOString() })
      .eq('id', r.id);
    setSavingEdit(false);

    if (error) {
      toast.error('Gagal menyimpan perubahan: ' + error.message);
      return;
    }

    setEditingBalasanId(null);
    setEditText('');
    fetchBalasan(bantuanIdsRef.current);
  };

  const handleHapusBalasanById = async (id: string) => {
    if (!confirm('Hapus pesan ini?')) return;
    const { error } = await supabase.from('bantuan_tugas_balasan').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus pesan: ' + error.message);
      return;
    }
    toast.success('Pesan dihapus');
  };

  const getTeksPesan = (targetType: TargetType, targetId: string): string => {
    if (targetType === 'bantuan') {
      return bantuanList.find((b) => b.id === targetId)?.pertanyaan || '';
    }
    const semuaBalasan = Object.values(balasanMap).flat();
    return semuaBalasan.find((r) => r.id === targetId)?.isi || '';
  };

  const getBalasanById = (id: string): BalasanItem | undefined => {
    return Object.values(balasanMap).flat().find((r) => r.id === id);
  };

  const handleSalinPesan = (targetType: TargetType, targetId: string) => {
    const teks = getTeksPesan(targetType, targetId);
    if (teks && navigator.clipboard) {
      navigator.clipboard.writeText(teks);
      toast.success('Pesan disalin');
    }
    setPopup(null);
  };

  const mulaiTekan = (targetType: TargetType, targetId: string, e: React.MouseEvent | React.TouchEvent) => {
    wasLongPress.current = false;
    const titik = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    pressPos.current = { x: titik.clientX, y: titik.clientY };
    longPressTimer.current = setTimeout(() => {
      wasLongPress.current = true;
      setPopup({ mode: 'menu', targetType, targetId, x: pressPos.current.x, y: pressPos.current.y });
      if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
        (navigator as any).vibrate(15);
      }
    }, LONG_PRESS_MS);
  };

  const selesaiTekan = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const klikKananMenu = (targetType: TargetType, targetId: string, e: React.MouseEvent) => {
    e.preventDefault();
    wasLongPress.current = true;
    setPopup({ mode: 'menu', targetType, targetId, x: e.clientX, y: e.clientY });
  };

  const tutupPopup = () => {
    setPopup(null);
  };

  const bukaModeReaksi = () => {
    setPopup((prev) => (prev ? { ...prev, mode: 'reaksi' } : prev));
  };

  // Dipanggil saat user tap salah satu emoji di grid reaksi
  const pilihReaksi = (emoji: string) => {
    if (!popup) return;
    handleToggleReaksi(popup.targetType, popup.targetId, emoji);
    tutupPopup();
  };

  const hitungPosisiMenu = (x: number, y: number, lebar: number, tinggi: number) => {
    if (typeof window === 'undefined') return { left: x, top: y };
    const left = Math.min(Math.max(8, x), window.innerWidth - lebar - 8);
    const top = Math.min(Math.max(8, y), window.innerHeight - tinggi - 8);
    return { left, top };
  };

  const ReaksiChips = ({ targetType, targetId, align = 'left' }: { targetType: TargetType; targetId: string; align?: 'left' | 'right' }) => {
    const ringkasan = getRingkasanReaksi(targetType, targetId);
    const emojiTerpakai = Object.keys(ringkasan);
    if (emojiTerpakai.length === 0) return null;

    return (
      <div className={`flex items-center gap-1 flex-wrap mt-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {emojiTerpakai.map((emoji) => {
          const info = ringkasan[emoji];
          return (
            <button
              key={emoji}
              onClick={() => handleToggleReaksi(targetType, targetId, emoji)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all active:scale-95 ${
                info.mine
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>{emoji}</span>
              <span className="font-bold">{info.count}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-3">
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
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${persenSelesai}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => setShowHelpPanel((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-amber-300/70 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase tracking-wide hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-400 transition-all shadow-sm"
      >
        {bantuanList.length > 0
          ? `${bantuanList.length} teman butuh bantuan di tugas ini`
          : 'Butuh bantuan?'}
      </button>

      {showHelpPanel && (
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-white/10 space-y-2.5">
          {bantuanList.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">Belum ada yang minta bantuan di tugas ini.</p>
          ) : (
            bantuanList.map((b) => {
              const balasanTugasIni = balasanMap[b.id] || [];
              const isExpanded = expandedId === b.id;

              return (
                <div
                  key={b.id}
                  className="bg-slate-50 dark:bg-white/[0.04] rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm"
                >
                  <div className="w-full flex items-start gap-2.5 p-3 text-left">
                    <button
                      onClick={() => {
                        if (wasLongPress.current) {
                          wasLongPress.current = false;
                          return;
                        }
                        setExpandedId(isExpanded ? null : b.id);
                      }}
                      onMouseDown={(e) => mulaiTekan('bantuan', b.id, e)}
                      onMouseUp={selesaiTekan}
                      onMouseLeave={selesaiTekan}
                      onTouchStart={(e) => mulaiTekan('bantuan', b.id, e)}
                      onTouchEnd={selesaiTekan}
                      onTouchMove={selesaiTekan}
                      onContextMenu={(e) => klikKananMenu('bantuan', b.id, e)}
                      className="flex items-start gap-2.5 flex-1 min-w-0 text-left select-none"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${warnaAvatar(b.nama_pengirim || '?')} flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm`}>
                        {b.nama_pengirim?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{b.nama_pengirim}</p>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">{b.pertanyaan}</p>
                        <p className="text-[10px] text-indigo-500 font-bold mt-1.5">
                          {balasanTugasIni.length > 0
                            ? `${balasanTugasIni.length} balasan · ${isExpanded ? 'sembunyikan' : 'lihat & bantu jawab'}`
                            : (isExpanded ? 'sembunyikan' : 'balas & bantu jawab')}
                        </p>
                        <ReaksiChips targetType="bantuan" targetId={b.id} />
                      </div>
                    </button>
                    {b.user_id === currentUserId && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTutupBantuan(b.id);
                        }}
                        className="text-[9px] font-black text-emerald-600 hover:underline shrink-0 pt-0.5 whitespace-nowrap"
                      >
                        Sudah terjawab
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2.5">
                      {balasanTugasIni.length > 0 && (
                        <div className="space-y-3 py-2 max-h-72 overflow-y-auto pr-1">
                          {balasanTugasIni.map((r) => {
                            const isMine = r.user_id === currentUserId;
                            const sedangEdit = editingBalasanId === r.id;

                            return (
                              <div
                                key={r.id}
                                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                              >
                                {!isMine && (
                                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${warnaAvatar(r.nama_pengirim || '?')} flex items-center justify-center text-[9px] font-black text-white shrink-0`}>
                                    {r.nama_pengirim?.slice(0, 2).toUpperCase()}
                                  </div>
                                )}

                                <div className={`flex flex-col max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}>
                                  {!isMine && (
                                    <p className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 px-1">
                                      {r.nama_pengirim}
                                    </p>
                                  )}

                                  {sedangEdit ? (
                                    <div className="w-64 max-w-[70vw] bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/40 rounded-2xl p-2 space-y-1.5 shadow-md">
                                      <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="w-full bg-transparent text-[11.5px] text-black dark:text-white resize-none focus:outline-none"
                                        rows={2}
                                        autoFocus
                                      />
                                      <div className="flex gap-3 justify-end pt-1 border-t border-slate-100 dark:border-white/10">
                                        <button
                                          onClick={handleBatalEdit}
                                          className="text-[9.5px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                          Batal
                                        </button>
                                        <button
                                          onClick={() => handleSimpanEdit(r)}
                                          disabled={savingEdit}
                                          className="text-[9.5px] font-black text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                                        >
                                          Simpan
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onMouseDown={(e) => mulaiTekan('balasan', r.id, e)}
                                      onMouseUp={selesaiTekan}
                                      onMouseLeave={selesaiTekan}
                                      onTouchStart={(e) => mulaiTekan('balasan', r.id, e)}
                                      onTouchEnd={selesaiTekan}
                                      onTouchMove={selesaiTekan}
                                      onContextMenu={(e) => klikKananMenu('balasan', r.id, e)}
                                      className={`px-3 py-2 text-[11.5px] leading-relaxed shadow-sm select-none cursor-pointer ${
                                        isMine
                                          ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-br-md'
                                          : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-md border border-slate-100 dark:border-white/10'
                                      }`}
                                    >
                                      {r.isi}
                                      {r.edited_at && (
                                        <span className={`text-[9px] italic ml-1.5 ${isMine ? 'text-indigo-100' : 'text-slate-400'}`}>
                                          (diedit)
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {!sedangEdit && (
                                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">{formatJam(r.created_at)}</span>
                                  )}

                                  {!sedangEdit && <ReaksiChips targetType="balasan" targetId={r.id} align={isMine ? 'right' : 'left'} />}
                                </div>
                              </div>
                            );
                          })}
                          <div ref={(el) => { threadEndRefs.current[b.id] = el; }} />
                        </div>
                      )}

                      <div className="flex gap-2 items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full pl-3.5 pr-1.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-500/30 transition-all">
                        <input
                          type="text"
                          placeholder="Tulis jawabanmu di sini..."
                          className="flex-1 bg-transparent text-[11.5px] text-black dark:text-white focus:outline-none"
                          value={balasanInput[b.id] || ''}
                          onChange={(e) =>
                            setBalasanInput((prev) => ({ ...prev, [b.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleKirimBalasan(b.id)}
                        />
                        <button
                          onClick={() => handleKirimBalasan(b.id)}
                          disabled={sendingBalasan[b.id]}
                          className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white w-8 h-8 rounded-full text-[13px] font-black disabled:opacity-50 shrink-0 flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 transition-all"
                        >
                          ➤
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="flex gap-2 items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full pl-4 pr-1.5 py-2 shadow-sm focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-500/30 transition-all">
            <input
              type="text"
              placeholder="Bagian mana yang bikin kamu bingung?"
              className="flex-1 bg-transparent text-[11.5px] text-black dark:text-white focus:outline-none"
              value={pertanyaanInput}
              onChange={(e) => setPertanyaanInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleKirimBantuan()}
            />
            <button
              onClick={handleKirimBantuan}
              disabled={submitting}
              className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10.5px] font-black uppercase disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95 transition-all"
            >
              Kirim
            </button>
          </div>
        </div>
      )}

      {popup && (
        <>
          <div className="fixed inset-0 z-40" onClick={tutupPopup} onTouchStart={tutupPopup} />

          {popup.mode === 'menu' && (() => {
            const balasanObj = popup.targetType === 'balasan' ? getBalasanById(popup.targetId) : undefined;
            const isMilikSendiri = popup.targetType === 'balasan' && balasanObj?.user_id === currentUserId;
            const bisaEdit = isMilikSendiri && balasanObj && isMasihBisaEdit(balasanObj.created_at);
            const { left, top } = hitungPosisiMenu(popup.x, popup.y, 170, 160);

            return (
              <div
                className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 py-1 min-w-[168px] overflow-hidden"
                style={{ left, top }}
              >
                <button
                  onClick={() => handleSalinPesan(popup.targetType, popup.targetId)}
                  className="w-full text-left px-3.5 py-2.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Salin pesan
                </button>
                <button
                  onClick={bukaModeReaksi}
                  className="w-full text-left px-3.5 py-2.5 text-[12px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Beri reaksi
                </button>
                {bisaEdit && balasanObj && (
                  <button
                    onClick={() => {
                      handleMulaiEdit(balasanObj);
                      tutupPopup();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-[12px] font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  >
                    Edit pesan
                  </button>
                )}
                {isMilikSendiri && (
                  <button
                    onClick={() => {
                      handleHapusBalasanById(popup.targetId);
                      tutupPopup();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    Hapus pesan
                  </button>
                )}
              </div>
            );
          })()}

          {popup.mode === 'reaksi' && (() => {
            // Grid emoji terbatas & scrollable — user hanya bisa pilih dari REAKSI_TERSEDIA, tidak bisa ketik bebas
            const LEBAR_POPUP = 288;
            const TINGGI_POPUP = 240;
            const { left, top } = hitungPosisiMenu(popup.x, popup.y, LEBAR_POPUP, TINGGI_POPUP);
            return (
              <div
                className="fixed z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 p-2"
                style={{ left, top, width: LEBAR_POPUP, maxHeight: TINGGI_POPUP }}
              >
                <div className="grid grid-cols-6 gap-0.5 overflow-y-auto pr-0.5" style={{ maxHeight: TINGGI_POPUP - 16 }}>
                  {REAKSI_TERSEDIA.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => pilihReaksi(emoji)}
                      className="w-10 h-10 flex items-center justify-center text-[18px] rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
