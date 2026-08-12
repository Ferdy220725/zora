'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Gift, Calendar, Edit2, ChevronLeft, ChevronRight, Clock, MapPin, AlertTriangle, ImagePlus, Loader2 } from 'lucide-react'

interface JadwalTemplate {
  id: number;
  hari: number;
  subject: string;
  time: string;
  room: string;
  is_active: boolean;
}

interface JadwalPengecualian {
  id: number;
  subject: string | null;
  time: string | null;
  room: string | null;
  day: string;
  tipe: 'ganti' | 'tambahan' | 'libur';
  keterangan: string | null;
}

interface JadwalTampil {
  key: string;
  subject: string;
  time: string;
  room: string;
  isException: boolean;
}

interface HariPenting {
  nama: string;
  isLibur: boolean;
}

export default function KalenderJadwal() {
  const [jadwalTemplate, setJadwalTemplate] = useState<JadwalTemplate[]>([])
  const [jadwalPengecualian, setJadwalPengecualian] = useState<JadwalPengecualian[]>([])
  const [kelasId, setKelasId] = useState<string | null>(null)
  const [loadingKelas, setLoadingKelas] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hariIni] = useState(new Date())

  const [ultahUser, setUltahUser] = useState<string | null>(null)
  const [inputUltah, setInputUltah] = useState("")
  const [showUltahModal, setShowUltahModal] = useState(false)

  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoUrlTersimpan, setFotoUrlTersimpan] = useState<string | null>(null)
  const [menyimpan, setMenyimpan] = useState(false)

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

  const [selectedJadwal, setSelectedJadwal] = useState<JadwalTampil[] | null>(null)
  const [selectedLiburInfo, setSelectedLiburInfo] = useState<string | null>(null)
  const [selectedDateLabel, setSelectedDateLabel] = useState("")

  const supabase = createClient()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

  const jumlahHari = new Date(year, month + 1, 0).getDate()
  const hariPertama = new Date(year, month, 1).getDay()
  const listHari = Array.from({ length: jumlahHari }, (_, i) => i + 1)

  const getKelasId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoadingKelas(false)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('kelas_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile?.kelas_id) setKelasId(profile.kelas_id)
    setLoadingKelas(false)
  }

  const getProfilUltah = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('profiles')
      .select('birthday_date, birthday_photo_url')
      .eq('id', session.user.id)
      .maybeSingle()

    if (data?.birthday_photo_url) setFotoUrlTersimpan(data.birthday_photo_url)

    if (data?.birthday_date) {
      const [, mm, dd] = data.birthday_date.split('-')
      const formatUltah = `${mm}-${dd}`
      localStorage.setItem('user_birthday', formatUltah)
      setUltahUser(formatUltah)
    }
  }

  const getData = async (kelasIdParam: string) => {
    const { data: dTemplate } = await supabase
      .from('jadwal_template')
      .select('*')
      .eq('kelas_id', kelasIdParam)
      .eq('is_active', true)
    if (dTemplate) setJadwalTemplate(dTemplate as JadwalTemplate[])

    const { data: dPengecualian } = await supabase
      .from('jadwal_kuliah')
      .select('*')
      .eq('kelas_id', kelasIdParam)
    if (dPengecualian) setJadwalPengecualian(dPengecualian as JadwalPengecualian[])
  }

  useEffect(() => {
    getKelasId()
    getProfilUltah()

    const savedUltah = localStorage.getItem('user_birthday')
    if (!savedUltah) {
      setShowUltahModal(true)
    } else {
      setUltahUser(savedUltah)
    }
  }, [])

  useEffect(() => {
    if (!kelasId) return
    getData(kelasId)

    const sub = supabase.channel('realtime_calendar')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'jadwal_kuliah', filter: `kelas_id=eq.${kelasId}` },
        () => getData(kelasId))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'jadwal_template', filter: `kelas_id=eq.${kelasId}` },
        () => getData(kelasId))
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [kelasId])

  const handlePilihFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const uploadFotoUltah = async (userId: string, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${userId}.${ext}`

    const { error } = await supabase.storage
      .from('birthday-photos')
      .upload(path, file, { upsert: true })

    if (error) return null

    const { data } = supabase.storage.from('birthday-photos').getPublicUrl(path)
    return data.publicUrl
  }

  const simpanUlangThn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputUltah) return
    setMenyimpan(true)

    const [, mm, dd] = inputUltah.split('-')
    const formatUltah = `${mm}-${dd}`
    localStorage.setItem('user_birthday', formatUltah)
    setUltahUser(formatUltah)

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      let fotoUrl = fotoUrlTersimpan

      if (fotoFile) {
        const hasilUpload = await uploadFotoUltah(session.user.id, fotoFile)
        if (hasilUpload) fotoUrl = hasilUpload
      }

      await supabase
        .from('profiles')
        .update({ birthday_date: inputUltah, birthday_photo_url: fotoUrl })
        .eq('id', session.user.id)

      setFotoUrlTersimpan(fotoUrl)
    }

    setMenyimpan(false)
    setShowUltahModal(false)
    setFotoFile(null)
  }

  const gantiBulan = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1))
  }

  const getJadwalUntukTanggal = (tanggalFull: string, hariIndex: number): { list: JadwalTampil[]; liburInfo: string | null } => {
    const pengecualianHariIni = jadwalPengecualian.filter(p => p.day === tanggalFull)
    const liburEntry = pengecualianHariIni.find(p => p.tipe === 'libur')

    if (liburEntry) {
      return { list: [], liburInfo: liburEntry.keterangan || 'Tidak ada perkuliahan' }
    }

    const gantiEntries = pengecualianHariIni.filter(p => p.tipe === 'ganti')
    const tambahanEntries = pengecualianHariIni.filter(p => p.tipe === 'tambahan')

    const basis: JadwalTampil[] = gantiEntries.length > 0
      ? gantiEntries.map(p => ({
          key: `ganti-${p.id}`,
          subject: p.subject || '-',
          time: p.time || '-',
          room: p.room || '-',
          isException: true,
        }))
      : jadwalTemplate
          .filter(t => t.hari === hariIndex)
          .map(t => ({
            key: `template-${t.id}`,
            subject: t.subject,
            time: t.time,
            room: t.room || '-',
            isException: false,
          }))

    const tambahan: JadwalTampil[] = tambahanEntries.map(p => ({
      key: `tambahan-${p.id}`,
      subject: p.subject || '-',
      time: p.time || '-',
      room: p.room || '-',
      isException: true,
    }))

    return { list: [...basis, ...tambahan], liburInfo: null }
  }

  const handleDateClick = (tgl: number, jadwalHariIni: JadwalTampil[], liburInfo: string | null) => {
    if (jadwalHariIni.length > 0 || liburInfo) {
      setSelectedJadwal(jadwalHariIni)
      setSelectedLiburInfo(liburInfo)
      setSelectedDateLabel(`${tgl} ${namaBulan[month]} ${year}`)
    }
  }

  if (loadingKelas) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!kelasId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb] dark:bg-[#0a0a0a] p-6 text-center">
        <p className="text-sm font-bold text-slate-400">Silakan login terlebih dahulu untuk melihat jadwal kelasmu.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a] font-sans">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Jadwal Kuliah</h1>
            <p className="text-sm text-slate-400 font-medium mt-0.5">Kalender akademik & jadwal kelas kamu</p>
          </div>
          <button
            onClick={() => setShowUltahModal(true)}
            className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-[#141414] px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95"
          >
            <Edit2 size={12} />
            {ultahUser ? 'Ubah Tanggal & Foto Ulang Tahun' : 'Atur Ulang Tahun'}
          </button>
        </div>

        <div className="bg-white dark:bg-[#141414] rounded-[28px] shadow-sm border border-slate-100 dark:border-white/10 overflow-hidden">

          <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100 dark:border-white/10">
            <button
              onClick={() => gantiBulan(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-black text-slate-900 dark:text-white text-sm md:text-base uppercase tracking-wide">
              {namaBulan[month]} {year}
            </span>
            <button
              onClick={() => gantiBulan(1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
            {["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((h, i) => (
              <div key={h} className={`py-2.5 text-center text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {h}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-white/5">
            {Array.from({ length: hariPertama }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/60 dark:bg-white/[0.02]"></div>
            ))}

            {listHari.map((tgl) => {
              const formatM = String(month + 1).padStart(2, '0')
              const formatD = String(tgl).padStart(2, '0')
              const tanggalFull = `${year}-${formatM}-${formatD}`
              const mDanD = `${formatM}-${formatD}`
              const hariIndex = new Date(year, month, tgl).getDay()

              const { list: jadwalHariIni, liburInfo } = getJadwalUntukTanggal(tanggalFull, hariIndex)
              const detailHariPenting = daftarHariPenting[tanggalFull]
              const isLibur = detailHariPenting?.isLibur || false
              const isLiburKelas = !!liburInfo
              const isHariIni = hariIni.getDate() === tgl && hariIni.getMonth() === month && hariIni.getFullYear() === year
              const isUserUltah = ultahUser === mDanD

              return (
                <div
                  key={tgl}
                  onClick={() => handleDateClick(tgl, jadwalHariIni, liburInfo)}
                  className={`h-24 md:h-32 p-2 relative flex flex-col justify-between group select-none overflow-hidden transition-colors
                    bg-white dark:bg-[#141414] hover:bg-slate-50 dark:hover:bg-white/5
                    ${(jadwalHariIni.length > 0 || isLiburKelas) ? 'cursor-pointer' : ''}
                    ${isHariIni ? 'ring-2 ring-inset ring-indigo-500' : ''}
                  `}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className={`text-xs font-black h-6 w-6 flex items-center justify-center rounded-lg transition-all
                      ${isLibur ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                        isHariIni ? 'bg-indigo-600 text-white' :
                        jadwalHariIni.length > 0 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {tgl}
                    </span>

                    <div className="flex items-center gap-1">
                      {isUserUltah && (
                        <span className="p-1 bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg animate-bounce" title="Hari Ulang Tahunmu!">
                          <Gift size={12} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 flex-1 flex flex-col justify-end gap-1 z-10 overflow-hidden">
                    {detailHariPenting && (
                      <div className={`text-[9px] font-bold px-1.5 py-1 rounded-lg leading-tight text-center break-words
                        ${isLibur ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10' : 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10'}`}>
                        {detailHariPenting.nama}
                      </div>
                    )}

                    {isLiburKelas && (
                      <div className="text-[9px] font-bold px-1.5 py-1 rounded-lg leading-tight text-center break-words text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10">
                        Libur Kelas
                      </div>
                    )}

                    {jadwalHariIni.slice(0, 2).map((j) => (
                      <div key={j.key} className={`text-[9px] text-white px-1.5 py-1 rounded-lg font-bold truncate ${j.isException ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                        {j.subject}
                      </div>
                    ))}
                    {jadwalHariIni.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-400 px-1">+{jadwalHariIni.length - 2} lainnya</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {showUltahModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-[#141414] w-full max-w-sm rounded-[28px] p-6 shadow-2xl border border-slate-100 dark:border-white/10 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Kapan Hari Ulang Tahunmu?</h3>
                <p className="text-xs text-slate-400 mt-1">Isi tanggal & upload 1 foto terbaikmu buat kejutan spesial saat harinya tiba!</p>
              </div>
              <form onSubmit={simpanUlangThn} className="space-y-3">
                <input
                  type="date"
                  required
                  onChange={(e) => setInputUltah(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700 dark:text-slate-200"
                />

                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl py-5 cursor-pointer hover:border-indigo-400 transition overflow-hidden">
                  {(fotoPreview || fotoUrlTersimpan) ? (
                    <img
                      src={fotoPreview || fotoUrlTersimpan || ''}
                      alt="Preview foto ulang tahun"
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-500/30"
                    />
                  ) : (
                    <ImagePlus size={22} className="text-slate-400" />
                  )}
                  <span className="text-[11px] font-bold text-slate-400">
                    {fotoFile ? fotoFile.name : (fotoUrlTersimpan ? 'Ganti foto' : 'Upload 1 foto terbaikmu')}
                  </span>
                  <input type="file" accept="image/*" onChange={handlePilihFoto} className="hidden" />
                </label>

                <div className="flex gap-2">
                  {ultahUser && (
                    <button
                      type="button"
                      onClick={() => setShowUltahModal(false)}
                      className="w-1/3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl text-xs transition"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={menyimpan}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    {menyimpan ? 'Menyimpan...' : 'Simpan & Ingat'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedJadwal && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#141414] w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 flex justify-between items-center text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">Detail Jadwal</p>
                  <h2 className="text-lg font-black">{selectedDateLabel}</h2>
                </div>
                <button onClick={() => { setSelectedJadwal(null); setSelectedLiburInfo(null); }} className="p-2 bg-black/20 rounded-full hover:bg-black/30 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                {selectedLiburInfo ? (
                  <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-rose-700 dark:text-rose-400 font-black text-sm">Tidak Ada Perkuliahan</p>
                      <p className="text-rose-600/80 dark:text-rose-400/70 text-xs mt-0.5">{selectedLiburInfo}</p>
                    </div>
                  </div>
                ) : selectedJadwal.map((j) => (
                  <div key={j.key} className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-slate-900 dark:text-white font-black text-base leading-tight">{j.subject}</h3>
                      {j.isException && (
                        <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full">
                          Perubahan
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Clock size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Waktu</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">{j.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Ruangan</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">{j.room}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setSelectedJadwal(null); setSelectedLiburInfo(null); }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 font-black uppercase tracking-widest text-xs transition-colors"
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