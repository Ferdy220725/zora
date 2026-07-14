"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Lottie from "lottie-react";
import catAnimation from "../../public/cat.json";

// --- INTERFACE ---
interface Tugas {
  id: string;
  judul_tugas: string;
  mk_nama: string;
  deadline: string;
  deskripsi?: string;
  link_pengumpulan?: string;
}

interface Leader {
  nama_user: string;
  tugas_selesai: number;
}

interface BuktiTugas {
  tugas_id: string;
  link_bukti: string;
  created_at: string;
}

export default function Dashboard() {
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [displayName, setDisplayName] = useState('Hallo, Sobat Agrotek 🍃');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'perlu dikerjakan' | 'sudah selesai'>('perlu dikerjakan');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [topThree, setTopThree] = useState<Leader[]>([]);
  const [zoomMeetings, setZoomMeetings] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [riwayatBukti, setRiwayatBukti] = useState<Record<string, BuktiTugas>>({});

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

  useEffect(() => {
    localStorage.removeItem("isDashboardOpened");
    fetchDataAndSync();
    checkDeadlineTrigger();
    const zoomTimer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(zoomTimer);
  }, []);

  useEffect(() => {
    if (showLeaderboard) {
      const timer = setTimeout(() => setShowLeaderboard(false), 10000);
      return () => clearInterval(timer);
    }
  }, [showLeaderboard]);

  const fetchDataAndSync = async () => {
    const savedName = localStorage.getItem('nama_user_solaria') || 'Sobat Agrotek';
    setDisplayName(`${savedName.trim().split(' ')[0]} 🍃`);

    const [tugasRes, zoomRes, userRes] = await Promise.all([
      supabase.from('tugas_perkuliahan').select('*').order('deadline', { ascending: true }),
      supabase.from('zoom_meetings').select('*').eq('is_active', true).order('waktu_mulai', { ascending: true }),
      supabase.auth.getUser(),
    ]);

    if (tugasRes.data) setTugas(tugasRes.data as Tugas[]);
    if (zoomRes.data) setZoomMeetings(zoomRes.data);

    const user = userRes.data.user;
    let currentCompletedTasks = JSON.parse(localStorage.getItem('agrotek_completed_tasks') || '[]');

    if (user) {
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
        currentCompletedTasks = completedIdsFromDB;
        setCompletedTaskIds(completedIdsFromDB);
        localStorage.setItem('agrotek_completed_tasks', JSON.stringify(completedIdsFromDB));
      }
    } else {
      setCompletedTaskIds(currentCompletedTasks);
    }

    supabase.from('user_progress').upsert({
      nama_user: savedName,
      tugas_selesai: currentCompletedTasks.length,
      last_update: new Date(),
    }, { onConflict: 'nama_user' }).then(({ error }) => {
      if (error) console.error('Gagal update user_progress:', error.message);
    });
  };

  const checkDeadlineTrigger = async () => {
    const lastShowed = localStorage.getItem('last_leaderboard_show');
    const now = new Date();
    if (lastShowed && (now.getTime() - new Date(lastShowed).getTime()) / (1000 * 60 * 60) < 24) return;

    const isMomentOfTruth = tugas.some(t => {
      const diff = (now.getTime() - new Date(t.deadline).getTime()) / (1000 * 60);
      return diff > 0 && diff < 60;
    });

    if (isMomentOfTruth) {
      const { data: leaders } = await supabase.from('user_progress').select('nama_user, tugas_selesai').order('tugas_selesai', { ascending: false }).limit(3);
      if (leaders) {
        setTopThree(leaders);
        setShowLeaderboard(true);
        localStorage.setItem('last_leaderboard_show', now.toISOString());
      }
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
    let linkBuktiInput = "";

    if (willBeDone) {
      const urlInput = prompt("Masukkan Link Bukti Pengumpulan Tugas (contoh link Google Drive / Elena / Screenshot):");
      if (urlInput === null) return;
      if (!urlInput.trim()) {
        alert("Bukti tugas wajib diisi agar tersimpan di sistem!");
        return;
      }
      linkBuktiInput = urlInput.trim();

      const { error } = await supabase
        .from('bukti_tugas')
        .upsert({
          user_id: user.id,
          tugas_id: id,
          link_bukti: linkBuktiInput,
        }, { onConflict: 'user_id,tugas_id' });

      if (error) {
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
        alert("Gagal memperbarui status di sistem: " + error.message);
        return;
      }
    }

    const newCompleted = willBeDone
      ? [...completedTaskIds, id]
      : completedTaskIds.filter(tid => tid !== id);

    setCompletedTaskIds(newCompleted);
    localStorage.setItem('agrotek_completed_tasks', JSON.stringify(newCompleted));
    const rawName = localStorage.getItem('nama_user_solaria') || 'Sobat Agrotek';

    await supabase.from('user_progress').upsert({
      nama_user: rawName,
      tugas_selesai: newCompleted.length,
      last_update: new Date()
    }, { onConflict: 'nama_user' });

    fetchDataAndSync();

    if (willBeDone) {
      const { data: leaders } = await supabase.from('user_progress').select('nama_user, tugas_selesai').order('tugas_selesai', { ascending: false }).limit(3);
      if (leaders) { setTopThree(leaders); setShowLeaderboard(true); }
    }
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

  const formatWaktuSelesai = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} pkl ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} WIB`;
  };

  const isMepet = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return diff > 0 && diff < (6 * 60 * 60 * 1000);
  };

  const displayedTugas = tugas.filter(t =>
    activeTab === 'perlu dikerjakan' ? !completedTaskIds.includes(t.id) : completedTaskIds.includes(t.id)
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans pb-20 overflow-x-hidden">
      {showLeaderboard && (
        <div className="fixed inset-0 z-[999] bg-[#800020] flex items-center justify-center p-6 text-white animate-in fade-in duration-500">
          <div className="max-w-2xl w-full text-center">
            <h2 className="text-4xl md:text-7xl font-black mb-8 uppercase italic leading-none">THE HARVEST KINGS 👑</h2>
            <div className="grid grid-cols-1 gap-4">
              {topThree.map((user, i) => (
                <div key={i} className={`flex items-center justify-between p-6 rounded-[30px] border-b-8 ${i === 0 ? 'bg-orange-500 border-orange-700' : 'bg-white/10'}`}>
                  <div className="flex items-center gap-5">
                    <span className="text-4xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <p className="font-black text-xl uppercase">{user.nama_user}</p>
                  </div>
                  <span className="font-black text-2xl">{user.tugas_selesai}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(isETS || isEAS) && (
        <div className="sticky top-0 z-[60] bg-red-600 text-white py-3 border-b-4 border-yellow-400 text-center font-black uppercase text-xs md:text-sm tracking-widest shadow-xl px-4">
          🚨 MINGGU {isETS ? 'ETS' : 'EAS'} SEDANG BERLANGSUNG! SEMANGAT! 🚨
        </div>
      )}

      <div className="relative w-full">
        <div className="relative w-full h-[220px] md:h-[300px] overflow-hidden shadow-lg border-b-8 border-slate-300">
          <img
            src="/foto-kelas-c-01.webp"
            alt="Foto Kelas C"
            className="w-full h-full object-cover grayscale-[20%] brightness-75 transition-all hover:scale-105 duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-2xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">
              SISTEM MANAJEMEN KELAS C
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-200 mt-2 uppercase tracking-[0.3em] bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm">
              Dimana Bumi dan Ilmu Pengetahuan Bersatu
            </p>
          </div>
        </div>
        <div className="w-full h-12 bg-gradient-to-b from-slate-300 to-[#fcfcfc]"></div>
      </div>

      <div className={`p-4 md:p-10 max-w-7xl mx-auto transition-all ${showLeaderboard ? 'blur-2xl' : ''}`}>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <button
            onClick={() => router.push('/desain-jadwal')}
            className="bg-[#004d40] text-white p-6 rounded-[35px] font-black uppercase text-lg border-b-8 border-[#00332b] italic active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
          >
            🖼️ Desain Jadwal
          </button>

          <div className="bg-white p-5 rounded-[35px] shadow-xl border-b-8 border-blue-600 border-2 border-slate-200 flex flex-col justify-center items-center text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase italic mb-1">Status Academic:</p>
            <p className={`font-black uppercase text-xs ${isETS || isEAS ? 'text-red-600' : 'text-blue-700'}`}>
              {isETS || isEAS ? 'Masa Evaluasi (ETS/EAS)' : 'Perkuliahan Aktif'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-[35px] shadow-xl border-b-8 border-slate-800 border-2 border-slate-200 flex flex-col justify-center items-center text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase italic mb-1">Hari & Tanggal:</p>
            <p className="font-black uppercase text-xs text-slate-800">{todayName}, {todayStr}</p>
          </div>

          <div className="bg-white p-4 rounded-[35px] shadow-xl border-b-8 border-blue-600 border-2 border-slate-200 flex flex-col h-full max-h-[140px] overflow-y-auto no-scrollbar relative">
            <h3 className="font-black uppercase text-[10px] text-blue-600 mb-2 tracking-widest flex items-center justify-center gap-2 sticky top-0 bg-white z-10 pb-1">
              <span className="animate-pulse">🔴</span> LIVE ZOOM
            </h3>
            {zoomMeetings.length > 0 ? (
              <div className="space-y-2">
                {zoomMeetings.map((zoom) => {
                  const start = new Date(zoom.waktu_mulai);
                  const isLocked = currentTime < start;
                  const h = start.getHours().toString().padStart(2, '0');
                  const m = start.getMinutes().toString().padStart(2, '0');
                  const hari = start.toLocaleDateString('id-ID', { weekday: 'long' });
                  return (
                    <div key={zoom.id} className="p-2 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center">
                      <h4 className="font-black text-slate-800 text-[9px] uppercase leading-tight mb-1 truncate">{zoom.judul}</h4>
                      {isLocked ? (
                        <div className="p-1 bg-slate-200 rounded-lg text-[8px] font-black text-slate-500 uppercase border border-dashed border-slate-300">
                          ⏰ Mulai hari {hari} pukul {h}:{m}
                        </div>
                      ) : (
                        <a href={zoom.link} target="_blank" rel="noopener noreferrer" className="block p-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase shadow-md active:scale-95 transition-all">
                          🎥 Join
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center mt-2 border-2 border-dashed border-slate-200 rounded-2xl p-2 bg-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">Tidak ada jadwal</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full bg-white p-6 md:p-8 rounded-[40px] shadow-xl border-t-[10px] border-[#004d40] border-2 border-slate-200">
          <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('perlu dikerjakan')}
              className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'perlu dikerjakan' ? 'bg-[#004d40] text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              Daftar Tugas
            </button>
            <button
              onClick={() => setActiveTab('sudah selesai')}
              className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'sudah selesai' ? 'bg-green-800 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              Selesai
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeTab === 'perlu dikerjakan' ? (
              displayedTugas.length > 0 ? displayedTugas.map((t) => {
                const isLewat = new Date().getTime() > new Date(t.deadline).getTime();

                return (
                  <details key={t.id} className={`group bg-[#fdfdfd] border-2 rounded-[30px] transition-all overflow-hidden ${isMepet(t.deadline) ? 'border-red-400' : 'border-slate-200'}`}>
                    <summary className="p-6 cursor-pointer list-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-black uppercase rounded italic tracking-tighter">{t.mk_nama}</span>
                          <span className={`text-[9px] font-black uppercase ${isLewat ? 'text-red-600' : isMepet(t.deadline) ? 'text-red-600 animate-pulse' : 'text-slate-400'}`}>
                            ⏱️ {formatDeadline(t.deadline)}
                          </span>
                        </div>
                        <h3 className="font-black text-lg md:text-xl uppercase leading-none tracking-tighter text-slate-900">
                          {t.judul_tugas}
                        </h3>
                      </div>
                      <div className="text-xl transition-transform group-open:rotate-180 text-slate-300">⬇️</div>
                    </summary>

                    <div className="p-6 pt-0 border-t-2 border-dashed border-slate-100 bg-slate-50/50">
                      <div className="py-4">
                        {isLewat ? (
                          <div className="p-1 bg-red-700 text-white text-[8px] font-black py-1 px-3 rounded uppercase tracking-widest inline-block">WAKTU HABIS!</div>
                        ) : isMepet(t.deadline) && (
                          <div className="p-1 bg-red-600 text-white text-[8px] font-black py-1 px-3 rounded uppercase tracking-widest animate-bounce inline-block">DEADLINE MEPET!</div>
                        )}
                        <p className="text-[13px] text-slate-700 font-medium leading-relaxed whitespace-pre-line">{t.deskripsi || 'Tidak ada deskripsi.'}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {t.link_pengumpulan && !isLewat && (
                          <a href={t.link_pengumpulan} target="_blank" rel="noopener noreferrer" className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-[10px] text-center shadow-lg active:scale-95 transition-all">
                            🚀 Kumpulkan Tugas
                          </a>
                        )}
                        <button
                          onClick={() => handleToggleDone(t.id, false)}
                          className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] border-4 transition-all border-green-700 text-green-800 hover:bg-green-50"
                        >
                          Selesai ✓
                        </button>
                      </div>
                    </div>
                  </details>
                );
              }) : (
                <div className="py-24 text-center">
                  <div className="text-6xl mb-4 grayscale opacity-30">📦</div>
                  <p className="text-slate-300 font-black uppercase italic text-2xl tracking-[0.2em]">Kosong</p>
                </div>
              )
            ) : (
              (() => {
                const groupedTugas: Record<string, Tugas[]> = {};

                tugas.filter(t => completedTaskIds.includes(t.id)).forEach(t => {
                  if (!groupedTugas[t.mk_nama]) {
                    groupedTugas[t.mk_nama] = [];
                  }
                  groupedTugas[t.mk_nama].push(t);
                });

                const matkulList = Object.keys(groupedTugas);

                if (matkulList.length === 0) {
                  return (
                    <div className="py-24 text-center">
                      <div className="text-6xl mb-4 grayscale opacity-30">📦</div>
                      <p className="text-slate-300 font-black uppercase italic text-2xl tracking-[0.2em]">Belum ada tugas selesai</p>
                    </div>
                  );
                }

                return matkulList.map((mkNama) => (
                  <div key={mkNama} className="mb-6 bg-green-50/40 border-2 border-green-100 rounded-[35px] p-6 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-wider text-green-800 mb-4 flex items-center gap-2 bg-green-100/60 px-4 py-2 rounded-full w-fit">
                      📚 Matkul: {mkNama}
                      <span className="bg-green-700 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {groupedTugas[mkNama].length} Tugas
                      </span>
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-green-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <th className="pb-3 pl-2">Judul Tugas</th>
                            <th className="pb-3">Waktu Selesai (Sistem)</th>
                            <th className="pb-3 text-center">Aksi / Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {groupedTugas[mkNama].map((t) => {
                            const buktiUser = riwayatBukti[t.id];
                            return (
                              <tr key={t.id} className="text-xs font-medium text-slate-700 hover:bg-white/80 transition-all">
                                <td className="py-3 pl-2 font-bold text-slate-800 uppercase max-w-[200px] truncate">
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
                                        className="bg-blue-600 text-white font-black uppercase text-[9px] px-3 py-1.5 rounded-xl hover:bg-blue-700 tracking-tighter"
                                      >
                                        🔗 Lihat Bukti
                                      </a>
                                    )}
                                    <button
                                      onClick={() => handleToggleDone(t.id, true)}
                                      className="border-2 border-red-200 text-red-600 font-black uppercase text-[9px] px-2 py-1 rounded-xl hover:bg-red-50"
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
    </div>
  );
}