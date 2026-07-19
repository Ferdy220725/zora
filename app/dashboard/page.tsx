"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import AktifkanNotifikasi from '@/components/AktifkanNotifikasi';
import { toast } from 'sonner';
import {
  ClipboardList,
  CheckCircle2,
  CalendarCheck,
  ClipboardCheck,
  BookOpen,
  Users,
  MonitorPlay,
  Sparkles,
  Clock,
  MapPin,
  ArrowRight,
  PackageOpen,
  FlaskConical,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// --- INTERFACE ---
interface Tugas {
  id: string;
  judul_tugas: string;
  mk_nama: string;
  deadline: string;
  deskripsi?: string;
  link_pengumpulan?: string;
}

interface TugasPraktikum {
  id: string;
  judul_tugas: string;
  mk_nama: string;
  golongan: string;
  deadline: string;
  deskripsi?: string;
  link_pengumpulan?: string;
}

interface BuktiTugas {
  tugas_id: string;
  link_bukti: string;
  created_at: string;
}

interface Jadwal {
  id: number;
  subject: string;
  time: string;
  room: string;
  day: string;
}

interface Pengumuman {
  id: number;
  judul: string;
  isi: string;
  link?: string | null;
  is_pinned: boolean;
  created_at: string;
}

export default function Dashboard() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [tugasPraktikum, setTugasPraktikum] = useState<TugasPraktikum[]>([]);
  const [displayName, setDisplayName] = useState('Sobat Agrotek');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'perlu dikerjakan' | 'sudah selesai'>('perlu dikerjakan');
  const [zoomMeetings, setZoomMeetings] = useState<any[]>([]);
  const [jadwalHariIni, setJadwalHariIni] = useState<Jadwal[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);

  const [riwayatBukti, setRiwayatBukti] = useState<Record<string, BuktiTugas>>({});

  // kelas_id milik user yang login, dipakai saat insert ke bukti_tugas (kolom NOT NULL)
  const [kelasId, setKelasId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayName = days[today.getDay()];

  const rangeETS = { start: "2026-04-06", end: "2026-04-17" };
  const rangeEAS = { start: "2026-06-08", end: "2026-06-19" };
  const isETS = todayStr >= rangeETS.start && todayStr <= rangeETS.end;
  const isEAS = todayStr >= rangeEAS.start && todayStr <= rangeEAS.end;

  // --- AUTH GUARD: halaman ini cuma boleh diakses yang udah login ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setCheckingSession(false);
      fetchDataAndSync();
    });

    const zoomTimer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(zoomTimer);
  }, []);

  const fetchDataAndSync = async () => {
    const { data: teoriData } = await supabase.from('tugas_perkuliahan').select('*').order('deadline', { ascending: true });
    if (teoriData) setTugas(teoriData as Tugas[]);

    const { data: praktikumData } = await supabase.from('tugas_praktikum').select('*').order('deadline', { ascending: true });
    if (praktikumData) setTugasPraktikum(praktikumData as TugasPraktikum[]);

    const { data: zData } = await supabase.from('zoom_meetings').select('*').eq('is_active', true).order('waktu_mulai', { ascending: true });
    if (zData) setZoomMeetings(zData);

    const { data: jData } = await supabase
      .from('jadwal_kuliah')
      .select('*')
      .eq('is_published', true)
      .eq('day', todayStr);
    if (jData) {
      setJadwalHariIni((jData as Jadwal[]).sort((a, b) => a.time.localeCompare(b.time)));
    }

    const { data: pData } = await supabase
      .from('pengumuman')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);
    if (pData) setPengumuman(pData as Pengumuman[]);

    const savedName = localStorage.getItem('nama_user_solaria') || 'Sobat Agrotek';
    setDisplayName(savedName.trim().split(' ')[0]);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Ambil kelas_id user sekali di sini, dipakai lagi saat submit bukti tugas
      const { data: profile } = await supabase
        .from('profiles')
        .select('kelas_id')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) setKelasId(profile.kelas_id);

      const { data: buktiData } = await supabase
        .from('bukti_tugas')
        .select('tugas_id, link_bukti, created_at')
        .eq('user_id', user.id);

      if (buktiData) {
        const buktiMap: Record<string, BuktiTugas> = {};
        const completedIdsFromDB: string[] = [];

        buktiData.forEach((b) => {
          buktiMap[b.tugas_id] = b;
          completedIdsFromDB.push(b.tugas_id);
        });

        setRiwayatBukti(buktiMap);
        setCompletedTaskIds(completedIdsFromDB);
        localStorage.setItem('agrotek_completed_tasks', JSON.stringify(completedIdsFromDB));
      }
    } else {
      const currentCompletedTasks = JSON.parse(localStorage.getItem('agrotek_completed_tasks') || '[]');
      setCompletedTaskIds(currentCompletedTasks);
    }
  };

  const handleToggleDone = async (id: string, isCurrentlyDone: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Silakan login terlebih dahulu. Kamu akan diarahkan ke halaman login.");
      router.push('/login');
      return;
    }

    const willBeDone = !isCurrentlyDone;

    if (willBeDone) {
      const urlInput = prompt("Masukkan Link Bukti Pengumpulan Tugas (contoh link Google Drive / GForm / Screenshot):");
      if (urlInput === null) return;
      if (!urlInput.trim()) {
        alert("Bukti tugas wajib diisi agar tersimpan di sistem!");
        return;
      }

      // Pastikan kelas_id ada sebelum insert, karena kolom ini NOT NULL di tabel bukti_tugas
      let kelasIdToUse = kelasId;
      if (!kelasIdToUse) {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('kelas_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileErr || !profile?.kelas_id) {
          alert("Gagal menyimpan bukti: kelas kamu belum terdeteksi. Coba refresh halaman ini.");
          return;
        }
        kelasIdToUse = profile.kelas_id;
        setKelasId(kelasIdToUse);
      }

      const { error } = await supabase
        .from('bukti_tugas')
        .upsert({
          user_id: user.id,
          tugas_id: id,
          kelas_id: kelasIdToUse,
          link_bukti: urlInput.trim(),
        }, { onConflict: 'user_id,tugas_id' });

      if (error) {
        console.error('Gagal menyimpan bukti_tugas:', error);
        alert("Gagal menyimpan bukti ke sistem: " + error.message);
        return;
      }
    } else {
      const konfirmasi = confirm("Apakah Anda yakin ingin membatalkan status selesai? Bukti pengumpulan di sistem akan dihapus.");
      if (!konfirmasi) return;

      const { error } = await supabase
        .from('bukti_tugas')
        .delete()
        .eq('user_id', user.id)
        .eq('tugas_id', id);

      if (error) {
        console.error('Gagal menghapus bukti_tugas:', error);
        alert("Gagal memperbarui status di sistem: " + error.message);
        return;
      }
    }

    fetchDataAndSync();
  };

  const formatDeadline = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = days[d.getDay()];
    const date = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}, ${date}/${month} pkl ${hours}:${minutes} WIB`;
  };

  const formatDeadlineShort = (dateStr: string) => {
    const d = new Date(dateStr);
    const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatWaktuSelesai = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} pkl ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} WIB`;
  };

  const isMepet = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return diff > 0 && diff < (6 * 60 * 60 * 1000);
  };

  const getHMinus = (dateStr: string) => {
    const diffMs = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "Lewat", color: "text-slate-400" };
    if (diffDays === 0) return { label: "Hari ini", color: "text-red-600" };
    return { label: `H-${diffDays}`, color: diffDays <= 3 ? "text-red-600" : "text-slate-400" };
  };

  const displayedTugas = tugas.filter(t =>
    activeTab === 'perlu dikerjakan' ? !completedTaskIds.includes(t.id) : completedTaskIds.includes(t.id)
  );

  const tugasAktifCount = tugas.filter(t => !completedTaskIds.includes(t.id)).length;
  const tugasPraktikumAktifCount = tugasPraktikum.filter(t => !completedTaskIds.includes(t.id)).length;

  const kelasHariIni = jadwalHariIni.filter(j => !j.subject.toLowerCase().includes('praktikum'));

  const tugasTerbaru = tugas.filter(t => !completedTaskIds.includes(t.id)).slice(0, 3);

  const goComingSoon = (name: string) => {
    toast.info(`${name} segera hadir 🚧`, { description: "Fitur ini masih dalam pengembangan." });
  };

  const quickAccessItems = [
    { name: 'Absen', href: '/absensi', icon: <ClipboardCheck size={22} />, comingSoon: false },
    { name: 'Materi', href: '/materi', icon: <BookOpen size={22} />, comingSoon: false },
    { name: 'Kelompok', href: '/acak-kelompok', icon: <Users size={22} />, comingSoon: false },
    { name: 'Presentasi', href: '/presentasi', icon: <MonitorPlay size={22} />, comingSoon: false },
    { name: 'Zora AI', href: '/zora-ai', icon: <Sparkles size={22} />, comingSoon: true },
  ];

  // --- KALENDER AKADEMIK (mini calendar, murni dari currentTime, gak butuh tabel baru) ---
  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const viewDate = new Date(today.getFullYear(), today.getMonth() + calendarOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const firstDayRaw = new Date(viewYear, viewMonth, 1).getDay(); // 0=Minggu
  const firstDayIdx = (firstDayRaw + 6) % 7; // geser jadi Senin=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array(firstDayIdx).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isTodayCell = (d: number | null) =>
    d !== null && viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate();

  // Agenda mendatang: tugas terdekat (maks 3) + info masa ujian kalau lagi berlangsung
  const agendaItems: { label: string; date: string; color: string }[] = [];
  if (isETS) agendaItems.push({ label: "Masa ETS berlangsung", date: `s/d ${formatDeadlineShort(rangeETS.end)}`, color: "bg-red-500" });
  if (isEAS) agendaItems.push({ label: "Masa EAS berlangsung", date: `s/d ${formatDeadlineShort(rangeEAS.end)}`, color: "bg-red-500" });
  tugas
    .filter(t => !completedTaskIds.includes(t.id))
    .slice(0, Math.max(0, 3 - agendaItems.length))
    .forEach(t => {
      agendaItems.push({ label: t.judul_tugas, date: formatDeadlineShort(t.deadline), color: "bg-indigo-500" });
    });

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a] font-sans">

      {/* EXAM NOTIFICATION */}
      {(isETS || isEAS) && (
        <div className="mx-4 md:mx-8 mt-4 bg-red-600 text-white py-3 px-4 rounded-2xl text-center font-black uppercase text-xs md:text-sm tracking-widest shadow-lg">
          🚨 MINGGU {isETS ? 'ETS' : 'EAS'} SEDANG BERLANGSUNG! SEMANGAT! 🚨
        </div>
      )}

      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ================= KOLOM UTAMA ================= */}
          <div className="space-y-6 min-w-0">

            {/* WELCOME BANNER */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[28px] p-6 md:p-10 text-white shadow-xl">
              <div className="relative z-10 max-w-[62%] sm:max-w-lg">
                <p className="text-sm md:text-base font-medium text-indigo-100 mb-1">👋 Selamat datang kembali,</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">{displayName}!</h1>
                <p className="hidden sm:block text-sm text-indigo-100 mb-6">
                  Semangat menjalani hari ini...
                </p>
                <button
                  onClick={() => router.push('/jadwal-sistem/list')}
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  Lihat Jadwal Hari Ini <ArrowRight size={16} />
                </button>
              </div>

              {/* Ilustrasi karakter */}
              <img
                src="/icons/logo-jadwalkuliah.png"
                alt=""
                aria-hidden="true"
                className="absolute -right-2 sm:right-0 md:right-2 -bottom-8 sm:-bottom-10 md:-bottom-12 h-[135%] sm:h-[130%] w-auto object-contain drop-shadow-2xl pointer-events-none select-none"
              />

              <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute right-6 top-6 w-10 h-10 bg-white/15 rounded-2xl hidden md:flex items-center justify-center">
                <CalendarCheck size={18} />
              </div>
            </div>

            <AktifkanNotifikasi />

            {/* QUICK STAT CARDS */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3 px-1">Ringkasan Hari Ini</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/jadwal-sistem/list')}
                  className="text-left bg-white dark:bg-[#141414] p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-3">
                    <CalendarCheck size={20} />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{kelasHariIni.length}</p>
                  <p className="text-xs text-slate-400 font-medium mb-1">Kelas Hari Ini</p>
                  <span className="text-xs font-bold text-indigo-600">Lihat jadwal</span>
                </button>

                <button
                  onClick={() => router.push('/praktikum')}
                  className="text-left bg-white dark:bg-[#141414] p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3">
                    <FlaskConical size={20} />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{tugasPraktikumAktifCount}</p>
                  <p className="text-xs text-slate-400 font-medium mb-1">Tugas Praktikum</p>
                  <span className="text-xs font-bold text-indigo-600">Lihat detail</span>
                </button>

                <a href="#tugas-section" className="bg-white dark:bg-[#141414] p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 mb-3">
                    <ClipboardList size={20} />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{tugasAktifCount}</p>
                  <p className="text-xs text-slate-400 font-medium mb-1">Tugas Aktif</p>
                  <span className="text-xs font-bold text-indigo-600">Lihat tugas</span>
                </a>

                <button
                  onClick={() => router.push('/absensi')}
                  className="text-left bg-white dark:bg-[#141414] p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 mb-3">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">Kehadiran</p>
                  <p className="text-xs text-slate-400 font-medium mb-1">Presensi hari ini</p>
                  <span className="text-xs font-bold text-indigo-600">Cek kehadiran →</span>
                </button>
              </div>
            </div>

            {/* QUICK ACCESS */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3 px-1">Quick Access</h2>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {quickAccessItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => item.comingSoon ? goComingSoon(item.name) : router.push(item.href)}
                    className={`flex flex-col items-center justify-center gap-2 bg-white dark:bg-[#141414] rounded-[20px] py-5 shadow-sm border border-slate-100 dark:border-white/10 ${item.comingSoon ? 'opacity-60' : 'active:scale-95'} transition-all`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* JADWAL HARI INI & TUGAS TERBARU */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#141414] rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 dark:text-white">Jadwal Hari Ini</h3>
                  <span className="text-xs font-bold text-slate-400">{todayName}, {todayStr}</span>
                </div>
                {jadwalHariIni.length > 0 ? (
                  <div className="space-y-3">
                    {jadwalHariIni.map((j) => (
                      <div key={j.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
                          <Clock size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{j.subject}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            {j.time} <span className="mx-1">•</span> <MapPin size={11} /> {j.room}
                          </p>
                        </div>
                        {j.subject.toLowerCase().includes('praktikum') ? (
                          <span className="shrink-0 text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-lg">Praktikum</span>
                        ) : (
                          <span className="shrink-0 text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-1 rounded-lg">Kelas</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <PackageOpen className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm text-slate-400 font-medium">Tidak ada jadwal kuliah hari ini 🎉</p>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#141414] rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 dark:text-white">Tugas Terbaru</h3>
                  <a href="#tugas-section" className="text-xs font-bold text-indigo-600">Lihat semua →</a>
                </div>
                {tugasTerbaru.length > 0 ? (
                  <div className="space-y-3">
                    {tugasTerbaru.map((t) => {
                      const hminus = getHMinus(t.deadline);
                      return (

                         <a key={t.id}
                          href="#tugas-section"
                          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5"
                        >
                          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                            <ClipboardList size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{t.judul_tugas}</p>
                            <p className="text-xs text-slate-400 truncate">{t.mk_nama}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] text-slate-400">{formatDeadlineShort(t.deadline)}</p>
                            <p className={`text-[10px] font-black ${hminus.color}`}>{hminus.label}</p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <PackageOpen className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm text-slate-400 font-medium">Tidak ada tugas aktif 🎉</p>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE ZOOM */}
            <div id="zoom-section" className="bg-white dark:bg-[#141414] rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="font-black text-slate-900 dark:text-white">Live Zoom</h3>
              </div>
              {zoomMeetings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {zoomMeetings.map((zoom) => {
                    const start = new Date(zoom.waktu_mulai);
                    const isLocked = currentTime < start;
                    const h = start.getHours().toString().padStart(2, '0');
                    const m = start.getMinutes().toString().padStart(2, '0');
                    const hari = start.toLocaleDateString('id-ID', { weekday: 'long' });
                    return (
                      <div key={zoom.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-between gap-3">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{zoom.judul}</p>
                        {isLocked ? (
                          <span className="shrink-0 text-[10px] font-black text-slate-400 uppercase bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-lg">
                            {hari} {h}:{m}
                          </span>
                        ) : (
                          <a href={zoom.link} target="_blank" rel="noopener noreferrer" className="shrink-0 bg-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-xl">
                            🎥 Join
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <PackageOpen className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-sm text-slate-400 font-medium">Tidak ada jadwal Zoom aktif</p>
                </div>
              )}
            </div>

            {/* TASK SECTION (kelola tugas lengkap) */}
            <div id="tugas-section" className="bg-white dark:bg-[#141414] rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-white/10">
              <div className="flex gap-2 mb-6 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl">
                <button
                  onClick={() => setActiveTab('perlu dikerjakan')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'perlu dikerjakan' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
                >
                  Daftar Tugas
                </button>
                <button
                  onClick={() => setActiveTab('sudah selesai')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'sudah selesai' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}
                >
                  Selesai
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {activeTab === 'perlu dikerjakan' ? (
                  displayedTugas.length > 0 ? displayedTugas.map((t) => {
                    const isLewat = new Date().getTime() > new Date(t.deadline).getTime();

                    return (
                      <details key={t.id} className={`group bg-slate-50 dark:bg-white/5 border rounded-[24px] transition-all overflow-hidden ${isMepet(t.deadline) ? 'border-red-300' : 'border-slate-100 dark:border-white/10'}`}>
                        <summary className="p-5 cursor-pointer list-none flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-md">{t.mk_nama}</span>
                              <span className={`text-[10px] font-black uppercase ${isLewat ? 'text-red-600' : isMepet(t.deadline) ? 'text-red-600 animate-pulse' : 'text-slate-400'}`}>
                                ⏱️ {formatDeadline(t.deadline)}
                              </span>
                            </div>
                            <h3 className="font-black text-base md:text-lg text-slate-900 dark:text-white">
                              {t.judul_tugas}
                            </h3>
                          </div>
                          <div className="text-lg transition-transform group-open:rotate-180 text-slate-300">⌄</div>
                        </summary>

                        <div className="px-5 pb-5 pt-0 border-t border-dashed border-slate-200 dark:border-white/10">
                          <div className="py-4">
                            {isLewat ? (
                              <div className="bg-red-600 text-white text-[9px] font-black py-1 px-3 rounded-lg uppercase tracking-widest inline-block mb-2">WAKTU HABIS!</div>
                            ) : isMepet(t.deadline) && (
                              <div className="bg-red-500 text-white text-[9px] font-black py-1 px-3 rounded-lg uppercase tracking-widest inline-block mb-2 animate-bounce">DEADLINE MEPET!</div>
                            )}
                            <p className="text-[13px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">{t.deskripsi || 'Tidak ada deskripsi.'}</p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            {t.link_pengumpulan && !isLewat && (
                              <a href={t.link_pengumpulan} target="_blank" rel="noopener noreferrer" className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-[10px] text-center shadow-md active:scale-95 transition-all">
                                🚀 Kumpulkan Tugas
                              </a>
                            )}
                            <button
                              onClick={() => handleToggleDone(t.id, false)}
                              className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                            >
                              Selesai ✓
                            </button>
                          </div>
                        </div>
                      </details>
                    );
                  }) : (
                    <div className="py-20 text-center">
                      <PackageOpen className="mx-auto text-slate-300 mb-3" size={48} />
                      <p className="text-slate-300 font-black uppercase italic text-xl tracking-widest">Kosong</p>
                    </div>
                  )
                ) : (
                  (() => {
                    const groupedTugas: Record<string, Tugas[]> = {};

                    tugas.filter(t => completedTaskIds.includes(t.id)).forEach(t => {
                      if (!groupedTugas[t.mk_nama]) groupedTugas[t.mk_nama] = [];
                      groupedTugas[t.mk_nama].push(t);
                    });

                    const matkulList = Object.keys(groupedTugas);

                    if (matkulList.length === 0) {
                      return (
                        <div className="py-20 text-center">
                          <PackageOpen className="mx-auto text-slate-300 mb-3" size={48} />
                          <p className="text-slate-300 font-black uppercase italic text-xl tracking-widest">Belum ada tugas selesai</p>
                        </div>
                      );
                    }

                    return matkulList.map((mkNama) => (
                      <div key={mkNama} className="mb-2 bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-[24px] p-5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2 bg-emerald-100/70 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
                          📚 {mkNama}
                          <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                            {groupedTugas[mkNama].length} Tugas
                          </span>
                        </h4>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                <th className="pb-3 pl-1">Judul Tugas</th>
                                <th className="pb-3">Waktu Selesai</th>
                                <th className="pb-3 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                              {groupedTugas[mkNama].map((t) => {
                                const buktiUser = riwayatBukti[t.id];
                                return (
                                  <tr key={t.id} className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <td className="py-3 pl-1 font-bold text-slate-800 dark:text-slate-100 max-w-[200px] truncate">
                                      {t.judul_tugas}
                                    </td>
                                    <td className="py-3 text-slate-500 font-mono">
                                      {buktiUser ? formatWaktuSelesai(buktiUser.created_at) : "-"}
                                    </td>
                                    <td className="py-3 text-center">
                                      <div className="flex justify-center gap-2">
                                        {buktiUser && (

                                           <a href={buktiUser.link_bukti}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-indigo-600 text-white font-black uppercase text-[9px] px-3 py-1.5 rounded-xl"
                                          >
                                            🔗 Bukti
                                          </a>
                                        )}
                                        <button
                                          onClick={() => handleToggleDone(t.id, true)}
                                          className="border border-red-200 text-red-600 font-black uppercase text-[9px] px-2 py-1.5 rounded-xl hover:bg-red-50"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>
          </div>

          {/* ================= KOLOM KANAN (DESKTOP ONLY) ================= */}
          <aside className="hidden lg:flex lg:flex-col gap-6">
            {/* KALENDER AKADEMIK */}
            <div className="bg-white dark:bg-[#141414] rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Kalender</h3>
              </div>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalendarOffset((o) => o - 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">{monthLabel}</span>
                <button
                  onClick={() => setCalendarOffset((o) => o + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {dayLabels.map((d) => (
                  <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>
                ))}
                {calendarCells.map((d, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-medium py-1.5 rounded-lg ${
                      d === null ? '' :
                      isTodayCell(d) ? 'bg-indigo-600 text-white font-black' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d ?? ''}
                  </span>
                ))}
              </div>
            </div>

            {/* AGENDA MENDATANG */}
            <div className="bg-white dark:bg-[#141414] rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/10">
              <h3 className="font-black text-slate-900 dark:text-white text-sm mb-4">Agenda Mendatang</h3>
              {agendaItems.length > 0 ? (
                <div className="space-y-3">
                  {agendaItems.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${a.color}`} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{a.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{a.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Belum ada agenda mendatang.</p>
              )}
            </div>

            {/* PENGUMUMAN TERBARU */}
            <div className="bg-white dark:bg-[#141414] rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/10">
              <h3 className="font-black text-slate-900 dark:text-white text-sm mb-4">Pengumuman Terbaru</h3>
              {pengumuman.length > 0 ? (
                <div className="space-y-3">
                  {pengumuman.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border ${
                        p.is_pinned
                          ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1 leading-snug">
                          {p.is_pinned && <span>📌</span>} {p.judul}
                        </p>
                        <span className="shrink-0 text-[9px] text-slate-400 font-medium">
                          {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {p.isi}
                      </p>
                      {p.link && (

                        <a href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1.5 text-[10px] font-black text-indigo-600 hover:underline truncate max-w-full"
                        >
                          🔗 Buka link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Megaphone className="mx-auto text-slate-300 mb-2" size={28} />
                  <p className="text-xs text-slate-400 font-medium">Belum ada pengumuman</p>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
