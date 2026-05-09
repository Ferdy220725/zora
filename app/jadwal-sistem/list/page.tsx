'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Jadwal {
  id: number;
  subject: string;
  time: string;
  room: string;
  day: string; 
  is_published: boolean;
}

export default function KalenderJadwal() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const supabase = createClient()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

  const jumlahHari = new Date(year, month + 1, 0).getDate()
  const hariPertama = new Date(year, month, 1).getDay() 
  const listHari = Array.from({ length: jumlahHari }, (_, i) => i + 1)

  const getData = async () => {
    // Menambahkan filter .eq('is_published', true) agar selaras dengan menu monitor
    const { data } = await supabase
      .from('jadwal_kuliah')
      .select('*')
      .eq('is_published', true) 
    if (data) setJadwal(data as Jadwal[])
  }

  useEffect(() => {
    getData()
    const sub = supabase.channel('realtime_calendar').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'jadwal_kuliah' }, getData).subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Kalender */}
        <div className="bg-[#800020] text-white p-6 rounded-t-3xl shadow-xl flex justify-between items-center border-x-2 border-t-2 border-[#800020] border-b-4 border-[#FFD700]">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-widest text-[#FFD700]">Jadwal Kuliah</h1>
            <p className="text-sm font-bold opacity-100">{namaBulan[month]} {year}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition border border-white/30">◀</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition border border-white/30">▶</button>
          </div>
        </div>

        {/* Grid Kalender dengan Border yang Dipertegas */}
        <div className="bg-white shadow-2xl rounded-b-3xl overflow-hidden border-2 border-[#800020]">
          {/* Label Hari */}
          <div className="grid grid-cols-7 bg-gray-200 border-b-2 border-gray-400">
            {["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((h) => (
              <div key={h} className="py-3 text-center text-[11px] font-black uppercase text-gray-700 border-r border-gray-300 last:border-r-0">
                {h}
              </div>
            ))}
          </div>

          {/* Grid Tanggal */}
          <div className="grid grid-cols-7 bg-gray-300 gap-[1px]"> {/* Gap 1px memberikan efek line tipis antar kotak */}
            
            {/* Padding Hari Kosong */}
            {Array.from({ length: hariPertama }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50/80"></div>
            ))}

            {listHari.map((tgl) => {
              const tanggalFull = `${year}-${String(month + 1).padStart(2, '0')}-${String(tgl).padStart(2, '0')}`
              const jadwalHariIni = jadwal.filter(j => j.day === tanggalFull)

              return (
                <div key={tgl} className="h-24 md:h-32 bg-white p-2 hover:bg-gray-50 transition-all group relative overflow-hidden">
                  {/* Angka Tanggal dengan Border Circle saat ada Jadwal */}
                  <div className="flex justify-between items-start">
                    <span className={`text-[13px] font-black px-1.5 py-0.5 rounded ${jadwalHariIni.length > 0 ? 'bg-[#800020] text-[#FFD700]' : 'text-gray-500'}`}>
                      {tgl}
                    </span>
                  </div>
                  
                  {/* List Jadwal */}
                  <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[75%] scrollbar-hide">
                    {jadwalHariIni.map((j) => (
                      <div key={j.id} className="bg-[#800020] text-[9px] text-white p-1.5 rounded-md border-l-4 border-[#FFD700] leading-tight shadow-md">
                        <div className="font-black truncate uppercase">{j.subject}</div>
                        <div className="flex justify-between mt-1 text-[8px] font-medium opacity-90 border-t border-white/20 pt-1">
                          <span>{j.time}</span>
                          <span className="text-[#FFD700]">{j.room}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visual Kosong */}
                  {jadwalHariIni.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 pointer-events-none text-[9px] font-bold text-gray-300 uppercase tracking-tighter">
                      No Class
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Legend / Keterangan */}
        <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#800020] border border-[#FFD700] rounded"></div> Jadwal Kuliah</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-gray-400 rounded"></div> Hari Kosong</div>
        </div>
      </div>
    </div>
  )
}