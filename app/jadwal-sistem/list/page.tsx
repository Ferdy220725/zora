'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Gift, Calendar, Edit2 } from 'lucide-react' 

interface Jadwal {
  id: number;
  subject: string;
  time: string;
  room: string;
  day: string; 
  is_published: boolean;
}

interface HariPenting {
  nama: string;
  isLibur: boolean;
}

export default function KalenderJadwal() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hariIni] = useState(new Date())

  // --- LOGIKA: State Manajemen Ulang Tahun (TETAP AMAN) ---
  const [ultahUser, setUltahUser] = useState<string | null>(null) // Format: "MM-DD"
  const [inputUltah, setInputUltah] = useState("")
  const [showUltahModal, setShowUltahModal] = useState(false)
  const [showKejutanUltah, setShowKejutanUltah] = useState(false)

  // --- LOGIKA DATA: Daftar Hari Penting & Libur Nasional Lengkap 2026 ---
  const daftarHariPenting: Record<string, HariPenting> = {
    "2026-01-01": { nama: "Tahun Baru Masehi", isLibur: true },
    "2026-01-23": { nama: "Isra Mikraj Nabi Muhammad SAW", isLibur: true },
    "2026-02-17": { nama: "Tahun Baru Imlek 2577", isLibur: true },
    "2026-03-19": { nama: "Hari Raya Nyepi (Tahun Baru Saka 1948)", isLibur: true },
    "2026-03-20": { nama: "Hari Raya Idul Fitri 1447 H (Hari ke-1)", isLibur: true },
    "2026-03-21": { nama: "Hari Raya Idul Fitri 1447 H (Hari ke-2)", isLibur: true },
    "2026-04-03": { nama: "Wafat Yesus Kristus", isLibur: true },
    "2026-04-05": { nama: "Hari Paskah", isLibur: false },
    "2026-05-01": { nama: "Hari Buruh Internasional", isLibur: true },
    "2026-05-14": { nama: "Kenaikan Yesus Kristus", isLibur: true },
    "2026-05-27": { nama: "Hari Raya Waisak 2570", isLibur: true },
    "2026-05-28": { nama: "Hari Raya Idul Adha 1447 H", isLibur: true }, 
    "2026-06-01": { nama: "Hari Lahir Pancasila", isLibur: true },
    "2026-06-17": { nama: "Tahun Baru Islam 1448 Hijriah", isLibur: true },
    "2026-08-17": { nama: "Hari Kemerdekaan RI ke-81", isLibur: true },
    "2026-08-26": { nama: "Maulid Nabi Muhammad SAW", isLibur: true },
    "2026-10-28": { nama: "Hari Sumpah Pemuda", isLibur: false },
    "2026-11-10": { nama: "Hari Pahlawan", isLibur: false },
    "2026-12-25": { nama: "Hari Raya Natal", isLibur: true },
  }
  
  // Bawaan Asli (TETAP AMAN)
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal[] | null>(null)
  const [selectedDateLabel, setSelectedDateLabel] = useState("")

  const supabase = createClient()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

  const jumlahHari = new Date(year, month + 1, 0).getDate() 
  const hariPertama = new Date(year, month, 1).getDay() 
  const listHari = Array.from({ length: jumlahHari }, (_, i) => i + 1)

  // Fungsi Fetching Asli (TETAP AMAN)
  const getData = async () => {
    const { data } = await supabase
      .from('jadwal_kuliah')
      .select('*')
      .eq('is_published', true) 
    if (data) setJadwal(data as Jadwal[])
  }

  // Realtime Subscriptions Asli (TETAP AMAN)
  useEffect(() => {
    getData()
    const sub = supabase.channel('realtime_calendar').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'jadwal_kuliah' }, getData).subscribe()

    // Cek Ulang Tahun di LocalStorage saat Pertama Masuk
    const savedUltah = localStorage.getItem('user_birthday')
    if (!savedUltah) {
      setShowUltahModal(true)
    } else {
      setUltahUser(savedUltah)
      cekApakahHariIniUltah(savedUltah)
    }

    return () => { supabase.removeChannel(sub) }
  }, [])

  // Fungsi Pendukung Ulang Tahun (TETAP AMAN)
  const simpanUlangThn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUltah) return
    const [_, mm, dd] = inputUltah.split('-') 
    const formatUltah = `${mm}-${dd}`
    localStorage.setItem('user_birthday', formatUltah)
    setUltahUser(formatUltah)
    setShowUltahModal(false)
    cekApakahHariIniUltah(formatUltah)
  }

  const cekApakahHariIniUltah = (tanggalUltah: string) => {
    const mHariIni = String(hariIni.getMonth() + 1).padStart(2, '0')
    const tHariIni = String(hariIni.getDate()).padStart(2, '0')
    if (`${mHariIni}-${tHariIni}` === tanggalUltah) {
      setShowKejutanUltah(true)
    }
  }

  const gantiBulan = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1))
  }

  const handleDateClick = (tgl: number, jadwalHariIni: Jadwal[]) => {
    if (jadwalHariIni.length > 0) {
      setSelectedJadwal(jadwalHariIni)
      setSelectedDateLabel(`${tgl} ${namaBulan[month]} ${year}`)
    }
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen font-sans text-slate-900 selection:bg-rose-200">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Widget Akses Cepat Mengubah Ulang Tahun */}
        <div className="flex justify-end">
          <button 
            onClick={() => setShowUltahModal(true)}
            className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-full shadow-md border border-slate-200 hover:border-amber-400 text-slate-600 hover:text-amber-600 transition-all active:scale-95"
          >
            <Edit2 size={12} />
            {ultahUser ? 'Ubah Tanggal Ulang Tahun' : 'Atur Ulang Tahun'}
          </button>
        </div>

        {/* Header Kalender */}
        <div className="bg-[#800020] text-white p-6 rounded-t-3xl shadow-xl flex justify-between items-center border-x-2 border-t-2 border-[#800020] border-b-4 border-[#FFD700]">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-[#FFD700] drop-shadow-md">Jadwal Kuliah</h1>
            <p className="text-sm font-bold uppercase tracking-widest opacity-90">{namaBulan[month]} {year}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => gantiBulan(-1)} className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition border border-white/10 active:scale-95 text-xs font-bold">◀ PREV</button>
            <button onClick={() => gantiBulan(1)} className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition border border-white/10 active:scale-95 text-xs font-bold">NEXT ▶</button>
          </div>
        </div>

        {/* Grid Kalender */}
        <div className="bg-white shadow-2xl rounded-b-3xl overflow-hidden border-2 border-[#800020]">
          {/* Header Nama Hari */}
          <div className="grid grid-cols-7 bg-[#4a5568] border-b-2 border-[#800020]">
            {["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((h, i) => (
              <div key={h} className={`py-3 text-center text-xs font-black uppercase tracking-wider border-r border-slate-600/30 last:border-r-0 ${i === 0 ? 'text-red-400' : 'text-white'}`}>
                {h}
              </div>
            ))}
          </div>

          {/* Grid Angka Tanggal */}
          <div className="grid grid-cols-7 bg-[#800020]/20 gap-[2px]"> 
            {Array.from({ length: hariPertama }).map((_, i) => (
              <div key={`empty-${i}`} className="h-28 md:h-36 bg-slate-200/50 backdrop-blur-sm"></div>
            ))}

            {listHari.map((tgl) => {
              const formatM = String(month + 1).padStart(2, '0')
              const formatD = String(tgl).padStart(2, '0')
              const tanggalFull = `${year}-${formatM}-${formatD}`
              const mDanD = `${formatM}-${formatD}`
              
              const jadwalHariIni = jadwal.filter(j => j.day === tanggalFull)
              const detailHariPenting = daftarHariPenting[tanggalFull]
              const isLibur = detailHariPenting?.isLibur || false
              const isHariIni = hariIni.getDate() === tgl && hariIni.getMonth() === month && hariIni.getFullYear() === year
              const isUserUltah = ultahUser === mDanD

              return (
                <div 
                  key={tgl} 
                  onClick={() => handleDateClick(tgl, jadwalHariIni)}
                  className={`h-28 md:h-36 p-2.5 transition-all duration-300 relative flex flex-col justify-between group select-none overflow-hidden
                    /* --- REVISI: Background Gradasi Emas ke Putih Metalik Premium --- */
                    bg-gradient-to-br from-amber-100 via-white to-amber-50/70 hover:from-amber-200 hover:via-white hover:to-indigo-50/50
                    
                    /* --- LOGIKA BARU & REALISTIS: Tanggal Berjalan Timbul Tebal Emas Solid 3D --- */
                    ${isHariIni ? 'z-10 bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-500 shadow-[0_15px_30px_-5px_rgba(217,119,6,0.5),0_10px_15px_-5px_rgba(217,119,6,0.4)] ring-4 ring-amber-600 ring-offset-1 border-none scale-[1.04] rounded-xl font-bold translate-y-[-6px]' : ''}
                  `}
                >
                  {/* Efek Hover Kejutan Kilauan Metalik Emas Khusus Tanggal Hari Ini */}
                  {isHariIni && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
                  )}

                  {/* Top Row: Angka Tanggal, Icon Ultah & Indikator Gelombang Hari Ini */}
                  <div className="flex justify-between items-start z-10">
                    <span className={`text-sm font-black h-7 w-7 flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 shadow-md
                      ${isLibur ? 'bg-rose-600 text-white shadow-rose-200' : 
                        isHariIni ? 'bg-[#800020] text-[#FFD700] shadow-amber-900/40' :
                        jadwalHariIni.length > 0 ? 'bg-[#800020] text-[#FFD700]' : 'bg-white border border-amber-200/60 text-slate-800'}`}>
                      {tgl}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isUserUltah && (
                        <span className="p-1 bg-rose-100 text-rose-600 rounded-lg animate-bounce shadow-sm border border-rose-200" title="Hari Ulang Tahunmu!">
                          <Gift size={14} />
                        </span>
                      )}

                      {isHariIni && (
                        <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-white opacity-85 group-hover:bg-rose-500 group-hover:h-8 group-hover:w-8 transition-all duration-300"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#800020] group-hover:bg-rose-700 transition-colors"></span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Row: Area Maksimasi Ruang untuk Hari Penting & Jadwal Kuliah */}
                  <div className="mt-1.5 flex-1 flex flex-col justify-end gap-1.5 z-10 overflow-hidden">
                    
                    {/* Teks Peringatan Hari Penting (Sudah Direvisi Besar & Menguasai Ruang Sisa) */}
                    {detailHariPenting && (
                      <div className={`text-[11px] font-extrabold tracking-normal px-2 py-2 rounded-xl border backdrop-blur-sm shadow-md flex-1 flex items-center justify-center text-center font-sans leading-tight whitespace-normal break-words min-h-[45px]
                        ${isLibur ? 'text-rose-900 bg-rose-50/95 border-rose-200 shadow-rose-100' : 'text-indigo-900 bg-indigo-50/95 border-indigo-200 shadow-indigo-100'}`}>
                        🎉 {detailHariPenting.nama}
                      </div>
                    )}

                    {/* Jadwal Kuliah Asli */}
                    {jadwalHariIni.map((j) => (
                      <div key={j.id} className="bg-[#800020] text-[9px] text-white p-1.5 rounded-lg border-l-4 border-[#FFD700] font-bold truncate tracking-tight shadow-md transition-transform group-hover:translate-x-1">
                        {j.subject}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MODAL INPUT TANGGAL ULANG TAHUN (Pop Up Awal - TETAP AMAN) */}
        {showUltahModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Kapan Hari Ulang Tahunmu?</h3>
                <p className="text-xs text-slate-400 mt-1">Kami ingin menyiapkan kejutan kecil spesial saat harinya tiba!</p>
              </div>
              <form onSubmit={simpanUlangThn} className="space-y-3">
                <input 
                  type="date" 
                  required
                  onChange={(e) => setInputUltah(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-semibold text-slate-700"
                />
                <div className="flex gap-2">
                  {ultahUser && (
                    <button 
                      type="button" 
                      onClick={() => setShowUltahModal(false)}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs transition"
                    >
                      Batal
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-rose-100 transition active:scale-95"
                  >
                    Simpan & Ingat
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL KEJUTAN KEJUTAN ULANG TAHUN (TETAP AMAN) */}
        {showKejutanUltah && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-b from-rose-500 via-pink-500 to-amber-500 w-full max-w-md rounded-3xl p-8 text-center text-white relative shadow-[0_0_60px_rgba(244,63,94,0.4)] overflow-hidden border-4 border-white/20">
              <div className="absolute top-4 left-6 animate-bounce text-xl">✨</div>
              <div className="absolute top-12 right-8 animate-pulse text-2xl">🎉</div>
              <div className="absolute bottom-8 left-12 animate-bounce text-lg">🎈</div>
              
              <div className="space-y-4 relative z-10">
                <div className="inline-flex p-4 bg-white/20 rounded-full">
                  <Gift size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-black tracking-wide drop-shadow-md">SELAMAT ULANG TAHUN! 🥳</h2>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  Semoga harimu dipenuhi kebahagiaan, urusan perkuliahan berjalan lancar, dan semua impianmu segera terwujud! Tetap semangat belajar ya! 🚀
                </p>
                <button 
                  onClick={() => setShowKejutanUltah(false)}
                  className="w-full bg-white text-rose-600 font-black tracking-widest py-3.5 rounded-xl text-xs shadow-xl hover:bg-slate-50 transition active:scale-95 uppercase"
                >
                  Terima Kasih Banyak!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Jadwal Kuliah Bawaan Asli (TETAP AMAN) */}
        {selectedJadwal && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(128,0,32,0.5)] border-2 border-[#FFD700]">
              <div className="bg-[#800020] p-5 flex justify-between items-center text-white border-b-4 border-[#FFD700]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">Detail Jadwal</p>
                  <h2 className="text-xl font-black">{selectedDateLabel}</h2>
                </div>
                <button onClick={() => setSelectedJadwal(null)} className="p-2 bg-black/20 rounded-full hover:bg-black/40 transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {selectedJadwal.map((j) => (
                  <div key={j.id} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 shadow-inner">
                    <h3 className="text-[#800020] font-black uppercase text-lg leading-tight mb-2 border-b-2 border-gray-200 pb-1">{j.subject}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Waktu</span>
                        <span className="font-bold text-gray-800">🕒 {j.time}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Ruangan</span>
                        <span className="font-bold text-[#800020]">📍 {j.room}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setSelectedJadwal(null)}
                className="w-full bg-[#800020] text-[#FFD700] py-4 font-black uppercase tracking-widest text-xs hover:bg-red-900 transition-colors"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}