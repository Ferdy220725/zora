"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { jsPDF } from "jspdf";
import { sendTelegramNotification } from '../actions/telegram';

export default function SuperAdminPage() {
  const [role, setRole] = useState<'GUEST' | 'WEB' | 'ABSEN'>('GUEST');
  const [password, setPassword] = useState('');
  const supabase = createClient();

  // --- STATE DATA ---
  const [izins, setIzins] = useState<any[]>([]);
  const [tugasPrak, setTugasPrak] = useState<any[]>([]);
  const [tugasKuliah, setTugasKuliah] = useState<any[]>([]);
  const [absensi, setAbsensi] = useState<any[]>([]);
  const [absensiEnabled, setAbsensiEnabled] = useState(false);
  const [kodeAbsen, setKodeAbsen] = useState('');

  // --- STATE DATA VERIFIKASI MAHASISWA (FITUR TERBARU) ---
  const [profiles, setProfiles] = useState<any[]>([]);

  // --- STATE BARU: ZOOM (UPDATED FOR SERVER-SIDE AUTO DELETE) ---
  const [zoomMeetings, setZoomMeetings] = useState<any[]>([]);
  const [zoomJudul, setZoomJudul] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [zoomWaktu, setZoomWaktu] = useState('');
  const [zoomWaktuSelesai, setZoomWaktuSelesai] = useState(''); // State Baru untuk Waktu Selesai
  const [zoomActive, setZoomActive] = useState(false);

  // --- STATE INPUT ---
  const [judulPrak, setJudulPrak] = useState('');
  const [mkPrak, setMkPrak] = useState('FISTAN');
  const [golongan, setGolongan] = useState('C1');
  const [linkPrak, setLinkPrak] = useState('');
  const [deadlinePrak, setDeadlinePrak] = useState('');
  const [deskripsiPrak, setDeskripsiPrak] = useState('');

  const [judulKuliah, setJudulKuliah] = useState('');
  const [mkKuliah, setMkKuliah] = useState('');
  const [deadlineKuliah, setDeadlineKuliah] = useState('');
  const [deskripsiKuliah, setDeskripsiKuliah] = useState('');
  const [linkKuliah, setLinkKuliah] = useState('');

  const [judulMateri, setJudulMateri] = useState('');
  const [mkMateri, setMkMateri] = useState('');
  const [semesterMateri, setSemesterMateri] = useState(''); // State Baru untuk Input Semester Materi
  const [file, setFile] = useState<File | null>(null);

  // --- HELPER ---
  const formatToWIB = (dateString: string) => {
    if (!dateString) return null;
    return `${dateString}:00+07:00`;
  };

  // Helper kecil khusus untuk format tampilan tanggal di pesan Telegram
  const formatTanggalTampil = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(`${dateString}:00+07:00`).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateString;
    }
  };

  const fetchData = async () => {
    const sekarang = new Date();

    if (role === 'WEB') {
      const { data: dIzin } = await supabase.from('perizinan').select('*').order('created_at', { ascending: false });
      const { data: dPrak } = await supabase.from('tugas_praktikum').select('*').order('deadline', { ascending: true });
      const { data: dKuliah } = await supabase.from('tugas_perkuliahan').select('*').order('deadline', { ascending: true });

      // --- FETCH DATA VERIFIKASI MAHASISWA (FITUR TERBARU) ---
      const { data: dProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (dProfiles) setProfiles(dProfiles);

      // --- LOGIKA ZOOM (DATABASE CRON ENABLED) ---
      const { data: dZoomRaw } = await supabase.from('zoom_meetings').select('*').order('waktu_mulai', { ascending: true });
      if (dZoomRaw) setZoomMeetings(dZoomRaw);

      if (dIzin) setIzins(dIzin);

      if (dPrak) {
        const prakAktif = dPrak.filter((t) => {
          const tglDeadline = new Date(t.deadline);
          const batasHapus = new Date(tglDeadline);
          batasHapus.setDate(tglDeadline.getDate() + 3);
          return sekarang <= batasHapus;
        });
        setTugasPrak(prakAktif);
      }

      if (dKuliah) setTugasKuliah(dKuliah);
    }

    if (role === 'ABSEN') {
      const { data: dAbsen } = await supabase.from('absensi').select('*').order('waktu_absen', { ascending: false });
      const { data: sAbsen } = await supabase.from('status_sistem').select('*').eq('id', 'absensi').maybeSingle();
      if (dAbsen) setAbsensi(dAbsen);
      if (sAbsen) {
        setAbsensiEnabled(sAbsen.is_active);
        setKodeAbsen(sAbsen.kode_akses || '');
      }
    }
  };

  useEffect(() => {
    if (role !== 'GUEST') fetchData();
  }, [role]);

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (password === "adminC22") setRole('WEB');
    else if (password === "absenC789") setRole('ABSEN');
    else alert("Password Salah!");
  };

  // --- HANDLER VERIFIKASI MAHASISWA (FITUR TERBARU) ---
  const handleApproveStudent = async (id: string, nama: string, statusSaatIni: boolean) => {
    const targetStatus = !statusSaatIni;
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: targetStatus })
      .eq('id', id);

    if (!error) {
      alert(`Status verifikasi ${nama} berhasil diubah menjadi ${targetStatus ? 'TERVERIFIKASI' : 'BELUM ACC'}!`);

      // Notifikasi Telegram: verifikasi mahasiswa
      sendTelegramNotification(
        `👤 <b>VERIFIKASI MAHASISWA</b>\n` +
        `Nama: <b>${nama}</b>\n` +
        `Status: <b>${targetStatus ? 'TERVERIFIKASI ✅' : 'DIBATALKAN ❌'}</b>`
      );

      fetchData();
    } else {
      alert("Gagal memperbarui status: " + error.message);
    }
  };

  const handleDeleteStudentProfile = async (id: string, nama: string) => {
    if (confirm(`Hapus permanen profil pengajuan milik ${nama}? Langkah ini juga akan memutus data auth user terkait.`)) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) {
        alert("Profil pendaftaran mahasiswa berhasil dihapus!");
        fetchData();
      } else {
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  // --- HANDLER ZOOM (INTEGRATED WITH WAKTU_SELESAI) ---
  const handleAddZoom = async () => {
    if (!zoomJudul || !zoomLink || !zoomWaktu || !zoomWaktuSelesai) {
      return alert("Isi Judul, Link, Waktu Mulai & Selesai!");
    }

    const { error } = await supabase.from('zoom_meetings').insert([{
      judul: zoomJudul.trim(),
      link: zoomLink.trim(),
      waktu_mulai: formatToWIB(zoomWaktu),
      waktu_selesai: formatToWIB(zoomWaktuSelesai),
      is_active: true,
    }]);

    if (!error) {
      alert("Jadwal Zoom Berhasil Ditambahkan!");

      // Notifikasi Telegram: jadwal zoom baru
      sendTelegramNotification(
        `🎥 <b>JADWAL ZOOM BARU</b>\n` +
        `Judul: <b>${zoomJudul.trim()}</b>\n` +
        `Mulai: ${formatTanggalTampil(zoomWaktu)}\n` +
        `Selesai: ${formatTanggalTampil(zoomWaktuSelesai)}\n` +
        `Link: ${zoomLink.trim()}`
      );

      setZoomJudul(''); setZoomLink(''); setZoomWaktu(''); setZoomWaktuSelesai('');
      fetchData();
    } else {
      alert("Gagal: " + error.message);
    }
  };

  const toggleZoomStatus = async (id: number, status: boolean) => {
    await supabase.from('zoom_meetings').update({ is_active: status }).eq('id', id);
    fetchData();
  };

  const handlePostTugasKuliah = async () => {
    if (!judulKuliah || !deadlineKuliah) return alert("Isi Judul & Deadline!");
    const { error } = await supabase.from('tugas_perkuliahan').insert([{
      judul_tugas: judulKuliah.trim(),
      mk_nama: mkKuliah.trim(),
      deadline: formatToWIB(deadlineKuliah),
      deskripsi: deskripsiKuliah.trim(),
      link_pengumpulan: linkKuliah.trim()
    }]);

    if (!error) {
      alert("Tugas Kuliah Terbit!");

      // Notifikasi Telegram: tugas perkuliahan baru
      sendTelegramNotification(
        `📚 <b>TUGAS PERKULIAHAN BARU</b>\n` +
        `Matkul: <b>${mkKuliah.trim() || "-"}</b>\n` +
        `Judul: ${judulKuliah.trim()}\n` +
        `Deadline: ${formatTanggalTampil(deadlineKuliah)}` +
        (linkKuliah.trim() ? `\nLink: ${linkKuliah.trim()}` : '')
      );

      setJudulKuliah(''); setMkKuliah(''); setDeadlineKuliah(''); setDeskripsiKuliah(''); setLinkKuliah('');
      fetchData();
    }
  };

  const handlePostTugasPrak = async () => {
    if (!judulPrak || !deadlinePrak) return alert("Isi Judul & Deadline!");
    const { error } = await supabase.from('tugas_praktikum').insert([{
      judul_tugas: judulPrak.trim(),
      mk_nama: mkPrak.trim().toUpperCase(),
      golongan: golongan.trim().toUpperCase(),
      deadline: formatToWIB(deadlinePrak),
      deskripsi: deskripsiPrak.trim(),
      link_pengumpulan: linkPrak.trim()
    }]);

    if (!error) {
      alert("Tugas Praktikum Terbit!");

      // Notifikasi Telegram: tugas praktikum baru
      sendTelegramNotification(
        `🧪 <b>TUGAS PRAKTIKUM BARU</b>\n` +
        `Matkul: <b>${mkPrak.trim().toUpperCase()}</b> (Gol. ${golongan.trim().toUpperCase()})\n` +
        `Judul: ${judulPrak.trim()}\n` +
        `Deadline: ${formatTanggalTampil(deadlinePrak)}` +
        (linkPrak.trim() ? `\nLink: ${linkPrak.trim()}` : '')
      );

      setJudulPrak('');
      setLinkPrak('');
      setDeskripsiPrak('');
      fetchData();
    }
  };

  const handleUploadMateri = async () => {
    if (!file) return alert("Silakan pilih file terlebih dahulu!");
    if (!judulMateri.trim()) return alert("Judul materi tidak boleh kosong!");
    if (!mkMateri.trim()) return alert("Nama Mata Kuliah tidak boleh kosong!");
    if (!semesterMateri) return alert("Semester harus diisi!");

    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (storageError) {
        console.error("Storage Error:", storageError);
        return alert("Gagal Upload File ke Storage: " + storageError.message);
      }

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      if (!urlData?.publicUrl) {
        return alert("Gagal mendapatkan URL file dari storage.");
      }

      const { error: dbError } = await supabase.from('materi').insert([{
        judul: judulMateri.trim(),
        file_url: urlData.publicUrl,
        mk_nama: mkMateri.trim(),
        semester: parseInt(semesterMateri)
      }]);

      if (dbError) {
        console.error("Database Error:", dbError);
        return alert("File terupload, tapi GAGAL simpan ke Database: " + dbError.message);
      }

      alert("Materi Berhasil Diunggah dan Disimpan!");

      // Notifikasi Telegram: materi baru
      sendTelegramNotification(
        `📄 <b>MATERI BARU DIUNGGAH</b>\n` +
        `Matkul: <b>${mkMateri.trim()}</b>\n` +
        `Judul: ${judulMateri.trim()}\n` +
        `Semester: ${semesterMateri}\n` +
        `Link: ${urlData.publicUrl}`
      );

      setJudulMateri('');
      setMkMateri('');
      setSemesterMateri('');
      setFile(null);

      if (typeof fetchData === 'function') fetchData();

    } catch (err: any) {
      console.error("Crash Error:", err);
      alert("Terjadi kesalahan sistem: " + err.message);
    }
  };

  const deleteData = async (id: any, table: string) => {
    if (confirm("Hapus data ini?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    }
  };

  const downloadPDF = async (data: any) => {
    const doc = new jsPDF();
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("SURAT PERMOHONAN IZIN KULIAH", 105, 25, { align: "center" });
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Kepada Yth.", 20, 45);
    doc.setFont("times", "bold");
    doc.text("Bapak/Ibu Dosen Pengampu Mata Kuliah", 20, 51);
    doc.text(data.mk_nama || "-", 20, 57);
    doc.text("Di Tempat", 20, 63);
    doc.setFont("times", "normal");
    doc.text("Dengan hormat,", 20, 75);
    doc.text("Saya yang bertanda tangan di bawah ini:", 20, 82);
    const dX = 30;
    doc.text(`Nama Mahasiswa`, dX, 92);
    doc.text(`: ${data.nama_lengkap}`, dX + 40, 92);
    doc.text(`NPM`, dX, 99);
    doc.text(`: ${data.npm}`, dX + 40, 99);
    doc.text(`Program Studi`, dX, 106);
    doc.text(`: ${data.prodi || "Agroteknologi"}`, dX + 40, 106);
    const isi = `Melalui surat ini, saya bermaksud untuk mengajukan permohonan izin tidak mengikuti kegiatan perkuliahan pada tanggal ${data.tgl_izin || "-"}, dikarenakan ${data.alasan || "-"}.`;
    doc.text(doc.splitTextToSize(isi, 170), 20, 120);
    doc.text("Demikian surat permohonan ini saya sampaikan. Atas perhatiannya saya ucapkan terima kasih.", 20, 140);
    const ttdY = 165;
    doc.text("Mengetahui,", 50, ttdY, { align: "center" });
    doc.text("Wali Mahasiswa,", 50, ttdY + 6, { align: "center" });
    doc.text("Hormat saya,", 150, ttdY, { align: "center" });
    doc.text("Mahasiswa,", 150, ttdY + 6, { align: "center" });
    if (data.surat_dokter_url) { try { doc.addImage(data.surat_dokter_url, "PNG", 30, ttdY + 10, 40, 15); } catch (e) {} }
    if (data.tanda_tangan_url) { try { doc.addImage(data.tanda_tangan_url, "PNG", 130, ttdY + 10, 40, 15); } catch (e) {} }
    doc.setFont("times", "bold");
    doc.text(`( ${data.nama_wali || "________________"} )`, 50, ttdY + 35, { align: "center" });
    doc.text(`( ${data.nama_lengkap} )`, 150, ttdY + 35, { align: "center" });
    if (data.file_pdf_url) { doc.addPage(); doc.text("LAMPIRAN BUKTI", 105, 20, { align: "center" }); try { doc.addImage(data.file_pdf_url, "JPEG", 15, 30, 180, 240); } catch (e) {} }
    doc.save(`Izin_${data.npm}.pdf`);
  };

  const toggleAbsensi = async (status: boolean) => {
    const { error } = await supabase.from('status_sistem').update({ is_active: status }).eq('id', 'absensi');
    if (!error) {
      setAbsensiEnabled(status);

      // Notifikasi Telegram: status absensi diubah
      sendTelegramNotification(
        `🚪 <b>STATUS ABSENSI DIUBAH</b>\n` +
        `Status: <b>${status ? 'DIBUKA ✅' : 'DITUTUP ❌'}</b>`
      );

      fetchData();
    }
  };

  const updateKodeAbsen = async () => {
    const { error } = await supabase.from('status_sistem').update({ kode_akses: kodeAbsen.toUpperCase() }).eq('id', 'absensi');
    if (!error) {
      alert("Kode Absen Berhasil Diperbarui!");

      // Notifikasi Telegram: kode absen diperbarui
      sendTelegramNotification(
        `🔑 <b>KODE ABSEN DIPERBARUI</b>\n` +
        `Kode baru: <code>${kodeAbsen.toUpperCase()}</code>`
      );
    }
  };

  const hitungTotalPerTanggal = () => {
    const rekap: { [key: string]: number } = {};
    izins.forEach(i => {
      const tgl = i.tgl_izin || "Tidak Ada Tanggal";
      rekap[tgl] = (rekap[tgl] || 0) + 1;
    });
    return Object.entries(rekap);
  };

  if (role === 'GUEST') return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-3xl border-t-8 border-[#800020] w-full max-w-sm text-center">
        <h2 className="text-xl font-black text-[#800020] mb-6 uppercase">Login Admin</h2>
        <input type="password" placeholder="Password Admin" className="w-full p-4 border-2 rounded-2xl mb-4 text-center font-bold text-black" onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-[#800020] text-white py-4 rounded-2xl font-black uppercase">Masuk</button>
      </form>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-black text-[#800020] uppercase">{role === 'WEB' ? 'Admin Manajemen Konten' : 'Admin Absensi'}</h1>
        <button onClick={() => setRole('GUEST')} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-xs">LOGOUT</button>
      </div>

      {role === 'WEB' ? (
        <div className="space-y-10">

          {/* MANAJEMEN ZOOM (UPDATED: SERVER-SIDE AUTO DELETE) */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[35px] shadow-lg text-white border-b-8 border-blue-900">
            <h2 className="font-black mb-4 uppercase text-xs flex items-center gap-2"><span>🎥</span> KONTROL JADWAL ZOOM MEETING</h2>
            <div className="grid md:grid-cols-6 gap-4 items-end mb-6">
                <div className="md:col-span-1">
                   <p className="text-[9px] font-black uppercase mb-1 opacity-70">Mata Kuliah</p>
                   <input type="text" placeholder="Genetik Tanaman" className="w-full p-3 rounded-xl text-xs text-slate-900 font-bold" value={zoomJudul} onChange={e => setZoomJudul(e.target.value)} />
                </div>
                <div className="md:col-span-1">
                   <p className="text-[9px] font-black uppercase mb-1 opacity-70">Link Zoom</p>
                   <input type="text" placeholder="https://..." className="w-full p-3 rounded-xl text-xs text-slate-900 font-bold" value={zoomLink} onChange={e => setZoomLink(e.target.value)} />
                </div>
                <div className="md:col-span-1">
                   <p className="text-[9px] font-black uppercase mb-1 opacity-70">Waktu Mulai</p>
                   <input type="datetime-local" className="w-full p-3 rounded-xl text-xs text-slate-900 font-bold" value={zoomWaktu} onChange={e => setZoomWaktu(e.target.value)} />
                </div>
                <div className="md:col-span-1">
                   <p className="text-[9px] font-black uppercase mb-1 opacity-70">Waktu Selesai (Hapus)</p>
                   <input type="datetime-local" className="w-full p-3 rounded-xl text-xs text-slate-900 font-bold" value={zoomWaktuSelesai} onChange={e => setZoomWaktuSelesai(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                   <button onClick={handleAddZoom} className="w-full bg-white text-blue-700 py-3 rounded-xl font-black text-xs shadow-xl">TAMBAHKAN JADWAL</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {zoomMeetings.map((z) => (
                <div key={z.id} className="bg-white/10 p-4 rounded-2xl flex justify-between items-center border border-white/20">
                  <div>
                    <p className="text-[10px] font-black uppercase">{z.judul}</p>
                    <p className="text-[8px] opacity-60 font-bold">Mulai: {new Date(z.waktu_mulai).toLocaleString('id-ID')}</p>
                    <p className="text-[8px] text-red-300 font-bold italic">Hapus: {new Date(z.waktu_selesai).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleZoomStatus(z.id, !z.is_active)} className={`p-2 rounded-lg text-[8px] font-black ${z.is_active ? 'bg-green-400 text-green-900' : 'bg-slate-400 text-slate-800'}`}>
                      {z.is_active ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => deleteData(z.id, 'zoom_meetings')} className="p-2 bg-red-500 rounded-lg text-[8px] font-black">DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-[#004d40]">
              <h2 className="font-black mb-4 text-[#004d40] uppercase text-xs">1. Post Tugas Kuliah</h2>
              <input type="text" placeholder="Matkul" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={mkKuliah} onChange={e => setMkKuliah(e.target.value)} />
              <input type="text" placeholder="Judul" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={judulKuliah} onChange={e => setJudulKuliah(e.target.value)} />
              <input type="datetime-local" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={deadlineKuliah} onChange={e => setDeadlineKuliah(e.target.value)} />
              <input type="text" placeholder="Link Pengumpulan" className="w-full border p-3 mb-2 rounded-xl text-xs bg-blue-50 text-black" value={linkKuliah} onChange={e => setLinkKuliah(e.target.value)} />
              <textarea placeholder="Deskripsi..." className="w-full border p-3 mb-4 rounded-xl text-xs min-h-[80px] text-black" value={deskripsiKuliah} onChange={e => setDeskripsiKuliah(e.target.value)} />
              <button onClick={handlePostTugasKuliah} className="w-full bg-[#004d40] text-white py-3 rounded-xl font-black text-xs shadow-md">PUBLISH</button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-[#D4AF37]">
              <h2 className="font-black mb-4 text-[#800020] uppercase text-xs">2. Post Praktikum</h2>
              <select className="w-full border p-3 mb-2 rounded-xl text-xs font-bold text-black" value={mkPrak} onChange={e => {setMkPrak(e.target.value); setGolongan(e.target.value === 'DIT' ? 'B1' : 'C1');}}>
                <option value="FISTAN">FISTAN</option><option value="DBT">DBT</option><option value="DPT">DPT</option><option value="DIT">DIT</option>
              </select>
              <select className="w-full border p-3 mb-2 rounded-xl text-xs font-bold text-black" value={golongan} onChange={e => setGolongan(e.target.value)}>
                {mkPrak === 'DIT' ? (<><option value="B1">GOL B1</option><option value="B3">GOL B3</option><option value="C3">GOL C3</option></>) : (<><option value="C1">GOL C1</option><option value="C2">GOL C2</option><option value="C3">GOL C3</option></>)}
              </select>
              <input type="text" placeholder="Judul" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={judulPrak} onChange={e => setJudulPrak(e.target.value)} />
              <input type="datetime-local" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={deadlinePrak} onChange={e => setDeadlinePrak(e.target.value)} />
              <input type="text" placeholder="Link Pengumpulan" className="w-full border p-3 mb-2 rounded-xl text-xs bg-yellow-50 text-black" value={linkPrak} onChange={e => setLinkPrak(e.target.value)} />
              <textarea placeholder="Deskripsi Praktikum..." className="w-full border p-3 mb-4 rounded-xl text-xs min-h-[80px] text-black" value={deskripsiPrak} onChange={e => setDeskripsiPrak(e.target.value)} />
              <button onClick={handlePostTugasPrak} className="w-full bg-[#D4AF37] text-white py-3 rounded-xl font-black text-xs shadow-md">PUBLISH</button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-[#800020]">
              <h2 className="font-black mb-4 text-slate-700 uppercase text-xs">3. Upload Materi</h2>
              <input type="text" placeholder="Matkul" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={mkMateri} onChange={e => setMkMateri(e.target.value)} />
              <input type="text" placeholder="Judul Materi" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={judulMateri} onChange={e => setJudulMateri(e.target.value)} />

              {/* Tambahan Input Semester Baru */}
              <input type="number" placeholder="Semester (Contoh: 3)" className="w-full border p-3 mb-2 rounded-xl text-xs text-black font-bold focus:border-[#800020] outline-none" value={semesterMateri} onChange={e => setSemesterMateri(e.target.value)} min="1" />

              <input type="file" className="w-full mb-4 text-[10px] text-black" onChange={e => setFile(e.target.files?.[0] || null)} />
              <button onClick={handleUploadMateri} className="w-full bg-[#800020] text-white py-3 rounded-xl font-black text-xs shadow-md">UPLOAD</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-black text-xs uppercase mb-4 text-slate-400">Daftar Tugas Aktif</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-blue-600 mb-2 uppercase">Perkuliahan</p>
                  {tugasKuliah.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-black">{t.mk_nama}: {t.judul_tugas}</span>
                      <button onClick={() => deleteData(t.id, 'tugas_perkuliahan')} className="text-red-500 text-[9px] font-black hover:underline">HAPUS</button>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[9px] font-black text-orange-600 mb-2 uppercase">Praktikum</p>
                  {tugasPrak.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-black">{t.mk_nama} ({t.golongan}): {t.judul_tugas}</span>
                      <button onClick={() => deleteData(t.id, 'tugas_praktikum')} className="text-red-500 text-[9px] font-black hover:underline">HAPUS</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-xs uppercase mb-4 text-slate-400">Surat Izin Mahasiswa</h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {izins.map(i => (
                    <div key={i.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-black uppercase text-slate-800">{i.nama_lengkap}</p>
                          <p className="text-[9px] font-bold text-slate-500">NPM: {i.npm}</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => downloadPDF(i)} className="text-[#800020] text-[10px] font-black hover:underline">PDF</button>
                          <button onClick={() => deleteData(i.id, 'perizinan')} className="text-red-500 text-[10px] font-black hover:underline">X</button>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-600 font-medium pt-1 border-t border-dashed border-slate-200">
                        <p><span className="font-bold text-[#800020]">MK:</span> {i.mk_nama || "-"}</p>
                        <p><span className="font-bold text-[#800020]">Alasan:</span> {i.alasan || "-"}</p>
                        <p className="text-[8px] text-slate-400 italic mt-0.5">Izin untuk tanggal: {i.tgl_izin || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">📊 Total Perizinan Per Tanggal</p>
                <div className="grid grid-cols-2 gap-2">
                  {hitungTotalPerTanggal().length > 0 ? (
                    hitungTotalPerTanggal().map(([tanggal, total]) => (
                      <div key={tanggal} className="flex justify-between items-center bg-slate-100 px-3 py-1.5 rounded-lg text-[9px] font-bold text-slate-700">
                        <span>{tanggal}</span>
                        <span className="bg-[#800020] text-white px-2 py-0.5 rounded-full text-[8px] font-black">{total}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[9px] font-bold text-slate-400 italic col-span-2">Belum ada data perizinan.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-3xl shadow-sm text-center border-l-8 border-blue-600">
                <h2 className="font-black text-slate-800 uppercase text-xs mb-4">Pintu Absensi</h2>
                <button onClick={() => toggleAbsensi(!absensiEnabled)} className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${absensiEnabled ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {absensiEnabled ? 'SISTEM: OPEN' : 'SISTEM: CLOSED'}
                </button>
             </div>
             <div className="bg-white p-8 rounded-3xl shadow-sm text-center border-l-8 border-[#800020]">
                <h2 className="font-black text-slate-800 uppercase text-xs mb-4">Kode Akses Hari Ini</h2>
                <div className="flex gap-2">
                  <input type="text" placeholder="SET KODE" className="flex-1 border-2 p-3 rounded-xl font-black text-center uppercase text-sm focus:border-[#800020] outline-none text-black" value={kodeAbsen} onChange={e => setKodeAbsen(e.target.value)} />
                  <button onClick={updateKodeAbsen} className="bg-[#800020] text-white px-6 rounded-xl font-black text-[10px] uppercase shadow-md">Simpan</button>
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-xs uppercase mb-4 text-slate-400 italic">Daftar Mahasiswa Sudah Absen</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b uppercase text-slate-400 font-black">
                    <th className="py-2">Nama Mahasiswa</th>
                    <th className="py-2">NPM</th>
                    <th className="py-2">Waktu Absen</th>
                  </tr>
                </thead>
                <tbody>
                  {absensi.map((a, idx) => (
                    <tr key={idx} className="border-b font-bold text-slate-700">
                      <td className="py-3 uppercase">{a.nama_mahasiswa}</td>
                      <td className="py-3">{a.npm}</td>
                      <td className="py-3 text-slate-400">{a.waktu_absen ? new Date(a.waktu_absen).toLocaleString('id-ID') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}