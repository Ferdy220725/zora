'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client' 
import { Trash2, Send, Plus, Loader2 } from 'lucide-react'

interface Jadwal {
  id: number;
  subject: string;
  time: string;
  room: string;
  day: string;
  is_published: boolean;
}

export default function MonitorJadwal() {
  const supabase = createClient()
  const [jadwal, setJadwal] = useState<Jadwal[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Fungsi Mengambil Data
  const fetchJadwal = async () => {
    const { data, error } = await supabase
      .from('jadwal_kuliah')
      .select('*')
      .order('day', { ascending: true })
    
    if (error) console.error("Error fetch:", error.message)
    if (data) setJadwal(data as Jadwal[])
  }

  useEffect(() => {
    fetchJadwal()
  }, [])

  // 2. Fungsi Tambah Baris (Draft)
  const tambahBaris = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('jadwal_kuliah')
      .insert([{ 
        subject: '', 
        time: '', 
        room: '', 
        day: today, 
        is_published: false 
      }])
      .select() // Mengambil data yang baru saja di-insert

    if (error) {
      alert("Gagal menambah baris: " + error.message)
    } else if (data) {
      setJadwal((prev) => [...prev, ...data])
    }
    setLoading(false)
  }

  // 3. Fungsi Update Data (Auto-save saat kursor keluar / onBlur)
  const updateData = async (id: number, column: string, value: any) => {
    const { error } = await supabase
      .from('jadwal_kuliah')
      .update({ [column]: value })
      .eq('id', id)
    
    if (error) console.error("Update error:", error.message)
  }

  // 4. Fungsi Hapus Jadwal
  const hapusJadwal = async (id: number) => {
    if (confirm('Hapus jadwal ini secara permanen?')) {
      const { error } = await supabase.from('jadwal_kuliah').delete().eq('id', id)
      if (!error) {
        setJadwal(jadwal.filter(item => item.id !== id))
      } else {
        alert("Gagal menghapus")
      }
    }
  }

  // 5. Fungsi Publikasikan (Luncurkan ke Mahasiswa)
  const publikasikan = async (id: number) => {
    const { error } = await supabase
      .from('jadwal_kuliah')
      .update({ is_published: true })
      .eq('id', id)
    
    if (!error) {
      setJadwal(jadwal.map(item => item.id === id ? { ...item, is_published: true } : item))
      alert('Jadwal berhasil diluncurkan ke kalender mahasiswa!')
    } else {
      alert("Gagal mempublikasikan")
    }
  }

  return (
    <div className="p-4 md:p-8 bg-[#050505] min-h-screen text-white font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-[#800020] pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#FFD700] tracking-tighter uppercase italic">
              Control Center <span className="text-white/20">/</span> Jadwal
            </h1>
            <p className="text-gray-500 text-xs mt-1 font-medium tracking-wide">
              Mode Editor: Isi data lalu klik <span className="text-blue-400">Jadwalkan</span> untuk meluncurkan.
            </p>
          </div>
          
          <button 
            onClick={tambahBaris}
            disabled={loading}
            className="flex items-center gap-2 bg-[#800020] hover:bg-red-800 disabled:opacity-50 text-white text-xs font-black py-3 px-8 rounded-full transition-all border border-[#FFD700]/30 shadow-[0_0_20px_rgba(128,0,32,0.3)] active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            DRAFT JADWAL BARU
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-[#0f0f0f] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="p-5">Mata Kuliah</th>
                  <th className="p-5 text-center">Tanggal Pelaksanaan</th>
                  <th className="p-5">Waktu / Jam</th>
                  <th className="p-5">Ruangan</th>
                  <th className="p-5 text-center">Status & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jadwal.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-3">
                      <input 
                        className="w-full bg-transparent p-2 focus:text-[#FFD700] outline-none text-sm font-semibold transition-colors" 
                        placeholder="Nama Mata Kuliah..." 
                        defaultValue={item.subject} 
                        onBlur={(e) => updateData(item.id, 'subject', e.target.value)} 
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="date" 
                        className="mx-auto block bg-[#1a1a1a] border border-white/10 p-2 rounded-lg text-xs text-[#FFD700] outline-none focus:border-[#800020] transition-all" 
                        defaultValue={item.day} 
                        onChange={(e) => updateData(item.id, 'day', e.target.value)} 
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        className="w-full bg-transparent p-2 focus:text-[#FFD700] outline-none text-sm font-medium" 
                        placeholder="Contoh: 08.00 - 10.00" 
                        defaultValue={item.time} 
                        onBlur={(e) => updateData(item.id, 'time', e.target.value)} 
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        className="w-full bg-transparent p-2 focus:text-[#FFD700] outline-none text-sm" 
                        placeholder="Gedung / Lab" 
                        defaultValue={item.room} 
                        onBlur={(e) => updateData(item.id, 'room', e.target.value)} 
                      />
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-3">
                        {item.is_published ? (
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            Live
                          </div>
                        ) : (
                          <button 
                            onClick={() => publikasikan(item.id)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                          >
                            <Send size={12} /> JADWALKAN
                          </button>
                        )}
                        <button 
                          onClick={() => hapusJadwal(item.id)}
                          className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Hapus Permanen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {jadwal.length === 0 && !loading && (
            <div className="p-24 text-center">
              <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
                <Plus className="text-gray-700" size={32} />
              </div>
              <p className="text-gray-500 text-sm font-medium italic">Belum ada draf jadwal yang dibuat.</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-[#800020]/5 border border-[#800020]/20">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full" />
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                Data akan tersimpan secara otomatis setiap kali Anda selesai mengisi kolom (onBlur).
            </p>
        </div>
      </div>
    </div>
  )
}