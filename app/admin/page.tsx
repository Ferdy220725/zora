"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import { jsPDF } from "jspdf";
import { sendTelegramNotification } from '../actions/telegram';
import Link from 'next/link';

export default function SuperAdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminProfile, setAdminProfile] = useState<{ id: string; nama: string; kelas_id: string; kelas_nama: string; role: string } | null>(null);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerShowBeasiswa, setOwnerShowBeasiswa] = useState(false);
  const [view, setView] = useState<'WEB' | 'ABSEN' | 'JADWAL' | 'BEASISWA'>('WEB');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const supabase = createClient();

  // --- STATE DATA ---
  const [izins, setIzins] = useState<any[]>([]);
  const [tugasPrak, setTugasPrak] = useState<any[]>([]);
  const [tugasKuliah, setTugasKuliah] = useState<any[]>([]);
  const [absensi, setAbsensi] = useState<any[]>([]);
  const [absensiEnabled, setAbsensiEnabled] = useState(false);
  const [kodeAbsen, setKodeAbsen] = useState('');

  // --- STATE DATA VERIFIKASI MAHASISWA ---
  const [profiles, setProfiles] = useState<any[]>([]);

  // --- STATE ZOOM ---
  const [zoomMeetings, setZoomMeetings] = useState<any[]>([]);
  const [zoomJudul, setZoomJudul] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [zoomWaktu, setZoomWaktu] = useState('');
  const [zoomWaktuSelesai, setZoomWaktuSelesai] = useState('');

  // --- STATE JADWAL AKADEMIK (BARU) ---
  const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const [jadwalTemplate, setJadwalTemplate] = useState<any[]>([]);
  const [jadwalPengecualian, setJadwalPengecualian] = useState<any[]>([]);

  const [hariTemplate, setHariTemplate] = useState('1'); // default Senin
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [timeTemplate, setTimeTemplate] = useState('');
  const [roomTemplate, setRoomTemplate] = useState('');

  const [tglPengecualian, setTglPengecualian] = useState('');
  const [tipePengecualian, setTipePengecualian] = useState('ganti');
  const [subjectPengecualian, setSubjectPengecualian] = useState('');
  const [timePengecualian, setTimePengecualian] = useState('');
  const [roomPengecualian, setRoomPengecualian] = useState('');
  const [keteranganPengecualian, setKeteranganPengecualian] = useState('');

  // --- STATE INPUT ---
  const [judulPrak, setJudulPrak] = useState('');
  const [mkPrak, setMkPrak] = useState('');
  const [golongan, setGolongan] = useState('');
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
  const [semesterMateri, setSemesterMateri] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // --- STATE PENGUMUMAN ---
  const [pengumuman, setPengumuman] = useState<any[]>([]);
  const [judulPengumuman, setJudulPengumuman] = useState('');
  const [isiPengumuman, setIsiPengumuman] = useState('');
  const [linkPengumuman, setLinkPengumuman] = useState('');
  const [pinPengumuman, setPinPengumuman] = useState(false);

  // --- STATE BEASISWA ---
  const [beasiswaList, setBeasiswaList] = useState<any[]>([]);
  const [beasiswaShowArchived, setBeasiswaShowArchived] = useState(false);
  const jenjangOptions = ['D3', 'D4', 'S1', 'S2'];
  const kategoriOptions = [
    { value: 'akademik', label: 'Akademik' },
    { value: 'ekonomi', label: 'Ekonomi' },
    { value: 'prestasi', label: 'Prestasi' },
    { value: 'organisasi', label: 'Organisasi' },
    { value: 'kepemimpinan', label: 'Kepemimpinan' },
    { value: 'riset', label: 'Riset' },
    { value: 'khusus_daerah', label: 'Khusus Daerah' },
    { value: 'lainnya', label: 'Lainnya' },
  ];
  const verifikasiOptions = [
    { value: 'unverified', label: 'Unverified' },
    { value: 'verified_external', label: 'Verified (Eksternal)' },
    { value: 'official', label: 'Official Source' },
    { value: 'upn_verified', label: 'UPN Verified' },
  ];

  const [namaBeasiswa, setNamaBeasiswa] = useState('');
  const [penyelenggaraBeasiswa, setPenyelenggaraBeasiswa] = useState('');
  const [logoBeasiswa, setLogoBeasiswa] = useState('');
  const [deskripsiBeasiswa, setDeskripsiBeasiswa] = useState('');
  const [kategoriBeasiswa, setKategoriBeasiswa] = useState('lainnya');
  const [jenjangBeasiswa, setJenjangBeasiswa] = useState<string[]>([]);
  const [tglBukaBeasiswa, setTglBukaBeasiswa] = useState('');
  const [tglTutupBeasiswa, setTglTutupBeasiswa] = useState('');
  const [jamTutupBeasiswa, setJamTutupBeasiswa] = useState('');
  const [nominalBeasiswa, setNominalBeasiswa] = useState('');
  const [wilayahBeasiswa, setWilayahBeasiswa] = useState('');
  const [sumberResmiBeasiswa, setSumberResmiBeasiswa] = useState('');
  const [linkDaftarBeasiswa, setLinkDaftarBeasiswa] = useState('');
  const [statusVerifikasiBeasiswa, setStatusVerifikasiBeasiswa] = useState('unverified');
  const [ipkMinBeasiswa, setIpkMinBeasiswa] = useState('');
  const [semesterMinBeasiswa, setSemesterMinBeasiswa] = useState('');
  const [semesterMaxBeasiswa, setSemesterMaxBeasiswa] = useState('');
  const [fakultasBeasiswa, setFakultasBeasiswa] = useState('');
  const [prodiBeasiswa, setProdiBeasiswa] = useState('');
  const [dokumenBeasiswa, setDokumenBeasiswa] = useState(''); // dipisah koma

  // --- HELPER ---
  const formatToWIB = (dateString: string) => {
    if (!dateString) return null;
    return `${dateString}:00+07:00`;
  };

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

  // Status beasiswa dihitung on-the-fly dari tanggal, bukan disimpan manual
  const hitungStatusBeasiswa = (b: any): 'buka' | 'segera_buka' | 'tutup' => {
    const now = new Date();
    const start = new Date(`${b.application_start}T00:00:00+07:00`);
    const deadline = new Date(`${b.application_deadline}T${b.application_deadline_time || '23:59:59'}+07:00`);
    if (now < start) return 'segera_buka';
    if (now > deadline) return 'tutup';
    return 'buka';
  };

  const labelStatusBeasiswa = (status: 'buka' | 'segera_buka' | 'tutup') => {
    if (status === 'buka') return { text: '🟢 DIBUKA', className: 'bg-green-100 text-green-700' };
    if (status === 'segera_buka') return { text: '🟡 SEGERA', className: 'bg-amber-100 text-amber-700' };
    return { text: '🔴 TUTUP', className: 'bg-red-100 text-red-600' };
  };

  // --- CEK SESI LOGIN SAAT HALAMAN DIBUKA ---
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCheckingAuth(false);
        return;
      }
      await loadAdminProfile(session.user.id);
    };
    initAuth();
  }, []);

  const loadAdminProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, nama, role, kelas_id, kelas:kelas_id(nama)')
      .eq('id', userId)
      .maybeSingle();

    const allowedRoles = ['admin', 'owner', 'pending_admin', 'rejected_admin'];
    if (error || !profile || !allowedRoles.includes(profile.role)) {
      alert('Akun ini bukan akun admin.');
      await supabase.auth.signOut();
      setAdminProfile(null);
      setCheckingAuth(false);
      return;
    }

    setAdminProfile({
      id: profile.id,
      nama: profile.nama || 'Admin',
      kelas_id: profile.kelas_id,
      kelas_nama: (profile as any).kelas?.nama || '-',
      role: profile.role,
    });

    if (profile.role === 'owner') {
      await fetchOwnerData();
    }
    setCheckingAuth(false);
  };

  // --- OWNER: kelola pengajuan admin ---
  const fetchOwnerData = async () => {
    setOwnerLoading(true);
    const { data: pending } = await supabase
      .from('profiles')
      .select('id, nama, role, kelas_id, requested_at, kelas:kelas_id(nama)')
      .eq('role', 'pending_admin')
      .order('requested_at', { ascending: true });
    const { data: aktif } = await supabase
      .from('profiles')
      .select('id, nama, role, kelas_id, kelas:kelas_id(nama)')
      .eq('role', 'admin');
    setPendingList(pending || []);
    setAdminList(aktif || []);
    setOwnerLoading(false);
  };

  const handleApproveAdmin = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin', approved_at: new Date().toISOString(), approved_by: adminProfile?.id })
      .eq('id', id);
    if (error) { alert('Gagal approve: ' + error.message); return; }
    await fetchOwnerData();
  };

  const handleRejectAdmin = async (id: string) => {
    if (!confirm('Yakin mau tolak pengajuan admin ini?')) return;
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'rejected_admin' })
      .eq('id', id);
    if (error) { alert('Gagal menolak: ' + error.message); return; }
    await fetchOwnerData();
  };

  const handleRevokeAdmin = async (id: string) => {
    if (!confirm('Cabut hak admin akun ini?')) return;
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'rejected_admin' })
      .eq('id', id);
    if (error) { alert('Gagal mencabut: ' + error.message); return; }
    await fetchOwnerData();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error || !data.user) {
      alert('Gagal login: ' + (error?.message || 'Email atau password salah.'));
      setLoginLoading(false);
      return;
    }

    await loadAdminProfile(data.user.id);
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminProfile(null);
  };

  const fetchData = async () => {
    if (!adminProfile) return;
    const sekarang = new Date();

    if (view === 'WEB') {
      // RLS otomatis nyaring data cuma milik kelas admin yang login,
      // jadi query di bawah ini nggak perlu .eq('kelas_id', ...) manual.
      const { data: dIzin } = await supabase.from('perizinan').select('*').order('created_at', { ascending: false });
      const { data: dPrak } = await supabase.from('tugas_praktikum').select('*').order('deadline', { ascending: true });
      const { data: dKuliah } = await supabase.from('tugas_perkuliahan').select('*').order('deadline', { ascending: true });

      const { data: dProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (dProfiles) setProfiles(dProfiles);

      const { data: dZoomRaw } = await supabase.from('zoom_meetings').select('*').order('waktu_mulai', { ascending: true });
      if (dZoomRaw) setZoomMeetings(dZoomRaw);

      const { data: dPengumuman } = await supabase
        .from('pengumuman')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (dPengumuman) setPengumuman(dPengumuman);

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

    if (view === 'ABSEN') {
      const { data: dAbsen } = await supabase.from('absensi').select('*').order('waktu_absen', { ascending: false });
      const { data: sAbsen } = await supabase.from('status_sistem').select('*').eq('kelas_id', adminProfile.kelas_id).maybeSingle();
      if (dAbsen) setAbsensi(dAbsen);
      if (sAbsen) {
        setAbsensiEnabled(sAbsen.is_active);
        setKodeAbsen(sAbsen.kode_akses || '');
      }
    }

    if (view === 'JADWAL') {
      const { data: dTemplate } = await supabase
        .from('jadwal_template')
        .select('*')
        .order('hari', { ascending: true });
      if (dTemplate) setJadwalTemplate(dTemplate);

      const { data: dPengecualian } = await supabase
        .from('jadwal_kuliah')
        .select('*')
        .order('day', { ascending: true });
      if (dPengecualian) setJadwalPengecualian(dPengecualian);
    }

    if (view === 'BEASISWA') {
      // Beasiswa bersifat lintas-kelas (bukan di-scope kelas_id), admin & owner
      // sama-sama bisa lihat semua lewat is_admin() di RLS.
      const { data: dBeasiswa } = await supabase
        .from('scholarships')
        .select('*')
        .eq('is_active', !beasiswaShowArchived)
        .order('application_deadline', { ascending: true });
      if (dBeasiswa) setBeasiswaList(dBeasiswa);
    }
  };

  useEffect(() => {
    if (adminProfile && ['admin', 'owner'].includes(adminProfile.role)) fetchData();
  }, [adminProfile, view, beasiswaShowArchived]);

  // --- HANDLER VERIFIKASI MAHASISWA ---
  const handleApproveStudent = async (id: string, nama: string, statusSaatIni: boolean) => {
    const targetStatus = !statusSaatIni;
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: targetStatus })
      .eq('id', id);

    if (!error) {
      alert(`Status verifikasi ${nama} berhasil diubah menjadi ${targetStatus ? 'TERVERIFIKASI' : 'BELUM ACC'}!`);
      if (adminProfile) {
        sendTelegramNotification(
          adminProfile.kelas_id,
          `👤 <b>VERIFIKASI MAHASISWA</b>\n` +
          `Nama: <b>${nama}</b>\n` +
          `Status: <b>${targetStatus ? 'TERVERIFIKASI ✅' : 'DIBATALKAN ❌'}</b>`
        );
      }
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

  // --- HANDLER ZOOM ---
  const handleAddZoom = async () => {
    if (!adminProfile) return;
    if (!zoomJudul || !zoomLink || !zoomWaktu || !zoomWaktuSelesai) {
      return alert("Isi Judul, Link, Waktu Mulai & Selesai!");
    }

    const { error } = await supabase.from('zoom_meetings').insert([{
      judul: zoomJudul.trim(),
      link: zoomLink.trim(),
      waktu_mulai: formatToWIB(zoomWaktu),
      waktu_selesai: formatToWIB(zoomWaktuSelesai),
      is_active: true,
      kelas_id: adminProfile.kelas_id,
    }]);

    if (!error) {
      alert("Jadwal Zoom Berhasil Ditambahkan!");
      sendTelegramNotification(
        adminProfile.kelas_id,
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
    if (!adminProfile) return;
    if (!judulKuliah || !deadlineKuliah) return alert("Isi Judul & Deadline!");
    const { error } = await supabase.from('tugas_perkuliahan').insert([{
      judul_tugas: judulKuliah.trim(),
      mk_nama: mkKuliah.trim(),
      deadline: formatToWIB(deadlineKuliah),
      deskripsi: deskripsiKuliah.trim(),
      link_pengumpulan: linkKuliah.trim(),
      kelas_id: adminProfile.kelas_id,
    }]);

    if (!error) {
      alert("Tugas Kuliah Terbit!");
      sendTelegramNotification(
        adminProfile.kelas_id,
        `📚 <b>TUGAS PERKULIAHAN BARU</b>\n` +
        `Matkul: <b>${mkKuliah.trim() || "-"}</b>\n` +
        `Judul: ${judulKuliah.trim()}\n` +
        `Deadline: ${formatTanggalTampil(deadlineKuliah)}` +
        (linkKuliah.trim() ? `\nLink: ${linkKuliah.trim()}` : '')
      );
      setJudulKuliah(''); setMkKuliah(''); setDeadlineKuliah(''); setDeskripsiKuliah(''); setLinkKuliah('');
      fetchData();
    } else {
      alert("Gagal: " + error.message);
    }
  };

  const handlePostTugasPrak = async () => {
    if (!adminProfile) return;
    if (!judulPrak || !deadlinePrak || !mkPrak.trim() || !golongan.trim()) {
      return alert("Isi Matkul, Golongan, Judul & Deadline!");
    }
    const { error } = await supabase.from('tugas_praktikum').insert([{
      judul_tugas: judulPrak.trim(),
      mk_nama: mkPrak.trim().toUpperCase(),
      golongan: golongan.trim().toUpperCase(),
      deadline: formatToWIB(deadlinePrak),
      deskripsi: deskripsiPrak.trim(),
      link_pengumpulan: linkPrak.trim(),
      kelas_id: adminProfile.kelas_id,
    }]);

    if (!error) {
      alert("Tugas Praktikum Terbit!");
      sendTelegramNotification(
        adminProfile.kelas_id,
        `🧪 <b>TUGAS PRAKTIKUM BARU</b>\n` +
        `Matkul: <b>${mkPrak.trim().toUpperCase()}</b> (Gol. ${golongan.trim().toUpperCase()})\n` +
        `Judul: ${judulPrak.trim()}\n` +
        `Deadline: ${formatTanggalTampil(deadlinePrak)}` +
        (linkPrak.trim() ? `\nLink: ${linkPrak.trim()}` : '')
      );
      setJudulPrak(''); setMkPrak(''); setGolongan(''); setLinkPrak(''); setDeskripsiPrak(''); setDeadlinePrak('');
      fetchData();
    } else {
      alert("Gagal: " + error.message);
    }
  };

  // --- UPLOAD MATERI (pakai Supabase Storage bucket 'uploads', BUKAN Google Drive) ---
  const handleUploadMateri = async () => {
    if (!adminProfile) return;
    if (!file) return alert("Silakan pilih file terlebih dahulu!");
    if (!judulMateri.trim()) return alert("Judul materi tidak boleh kosong!");
    if (!mkMateri.trim()) return alert("Nama Mata Kuliah tidak boleh kosong!");
    if (!semesterMateri) return alert("Semester harus diisi!");
    if (file.type !== 'application/pdf') return alert("File materi harus berformat PDF!");

    try {
      // Nama file unik biar nggak numpuk/ketiban file lain di bucket
      const namaFileUnik = `${adminProfile.kelas_id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(namaFileUnik, file);

      if (uploadError) {
        console.error("Upload Error:", uploadError);
        return alert("Gagal Upload File ke Supabase: " + uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(namaFileUnik);

      const { error: dbError } = await supabase.from('materi').insert([{
        judul: judulMateri.trim(),
        file_url: publicUrlData.publicUrl,
        mk_nama: mkMateri.trim(),
        semester: parseInt(semesterMateri),
        kelas_id: adminProfile.kelas_id,
      }]);

      if (dbError) {
        console.error("Database Error:", dbError);
        return alert("File terupload, tapi GAGAL simpan ke Database: " + dbError.message);
      }

      alert("Materi Berhasil Diunggah dan Disimpan!");
      sendTelegramNotification(
        adminProfile.kelas_id,
        `📄 <b>MATERI BARU DIUNGGAH</b>\n` +
        `Matkul: <b>${mkMateri.trim()}</b>\n` +
        `Judul: ${judulMateri.trim()}\n` +
        `Semester: ${semesterMateri}`
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
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) alert("Gagal menghapus: " + error.message);
      fetchData();
    }
  };

  // --- HANDLER PENGUMUMAN ---
  const handlePostPengumuman = async () => {
    if (!adminProfile) return;
    if (!judulPengumuman.trim() || !isiPengumuman.trim()) {
      return alert("Judul dan isi pengumuman wajib diisi!");
    }
    const { error } = await supabase.from('pengumuman').insert([{
      judul: judulPengumuman.trim(),
      isi: isiPengumuman.trim(),
      link: linkPengumuman.trim() || null,
      is_pinned: pinPengumuman,
      kelas_id: adminProfile.kelas_id,
    }]);
    if (error) return alert("Gagal posting pengumuman: " + error.message);

    sendTelegramNotification(
      adminProfile.kelas_id,
      `📢 <b>PENGUMUMAN BARU</b>\n` +
      `${judulPengumuman.trim()}\n\n` +
      `${isiPengumuman.trim()}` +
      (linkPengumuman.trim() ? `\n\nLink: ${linkPengumuman.trim()}` : '')
    );

    setJudulPengumuman('');
    setIsiPengumuman('');
    setLinkPengumuman('');
    setPinPengumuman(false);
    fetchData();
  };

  // --- HANDLER JADWAL AKADEMIK (BARU) ---
  const handleTambahTemplate = async () => {
    if (!adminProfile) return;
    if (!subjectTemplate.trim() || !timeTemplate.trim()) {
      return alert("Isi Mata Kuliah & Jam!");
    }
    const { error } = await supabase.from('jadwal_template').insert([{
      kelas_id: adminProfile.kelas_id,
      hari: parseInt(hariTemplate),
      subject: subjectTemplate.trim(),
      time: timeTemplate.trim(),
      room: roomTemplate.trim(),
      is_active: true,
    }]);
    if (error) return alert("Gagal menambah jadwal: " + error.message);
    setSubjectTemplate(''); setTimeTemplate(''); setRoomTemplate('');
    fetchData();
  };

  const handleHapusTemplate = async (id: number) => {
    if (!confirm("Hapus matkul ini dari jadwal mingguan?")) return;
    const { error } = await supabase.from('jadwal_template').delete().eq('id', id);
    if (error) return alert("Gagal menghapus: " + error.message);
    fetchData();
  };

  const handleToggleTemplate = async (id: number, status: boolean) => {
    const { error } = await supabase.from('jadwal_template').update({ is_active: status }).eq('id', id);
    if (error) return alert("Gagal mengubah status: " + error.message);
    fetchData();
  };

  const handleTambahPengecualian = async () => {
    if (!adminProfile) return;
    if (!tglPengecualian) return alert("Pilih tanggal terlebih dahulu!");
    if (tipePengecualian !== 'libur' && (!subjectPengecualian.trim() || !timePengecualian.trim())) {
      return alert("Isi Mata Kuliah & Jam (kecuali tipe Libur)!");
    }
    const { error } = await supabase.from('jadwal_kuliah').insert([{
      kelas_id: adminProfile.kelas_id,
      day: tglPengecualian,
      subject: tipePengecualian === 'libur' ? null : subjectPengecualian.trim(),
      time: tipePengecualian === 'libur' ? null : timePengecualian.trim(),
      room: tipePengecualian === 'libur' ? null : roomPengecualian.trim(),
      tipe: tipePengecualian,
      keterangan: keteranganPengecualian.trim() || null,
      is_published: true,
    }]);
    if (error) return alert("Gagal menambah pengecualian: " + error.message);
    setTglPengecualian(''); setSubjectPengecualian(''); setTimePengecualian(''); setRoomPengecualian('');
    setKeteranganPengecualian(''); setTipePengecualian('ganti');
    fetchData();
  };

  const handleHapusPengecualian = async (id: number) => {
    if (!confirm("Hapus pengecualian ini?")) return;
    const { error } = await supabase.from('jadwal_kuliah').delete().eq('id', id);
    if (error) return alert("Gagal menghapus: " + error.message);
    fetchData();
  };

  // --- HANDLER BEASISWA ---
  const toggleJenjangBeasiswa = (level: string) => {
    setJenjangBeasiswa((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const resetFormBeasiswa = () => {
    setNamaBeasiswa(''); setPenyelenggaraBeasiswa(''); setLogoBeasiswa(''); setDeskripsiBeasiswa('');
    setKategoriBeasiswa('lainnya'); setJenjangBeasiswa([]); setTglBukaBeasiswa(''); setTglTutupBeasiswa('');
    setJamTutupBeasiswa(''); setNominalBeasiswa(''); setWilayahBeasiswa(''); setSumberResmiBeasiswa('');
    setLinkDaftarBeasiswa(''); setStatusVerifikasiBeasiswa('unverified'); setIpkMinBeasiswa('');
    setSemesterMinBeasiswa(''); setSemesterMaxBeasiswa(''); setFakultasBeasiswa(''); setProdiBeasiswa('');
    setDokumenBeasiswa('');
  };

  const handlePostBeasiswa = async () => {
    if (!adminProfile) return;
    if (!namaBeasiswa.trim() || !penyelenggaraBeasiswa.trim()) {
      return alert("Isi Nama Beasiswa & Penyelenggara!");
    }
    if (!tglBukaBeasiswa || !tglTutupBeasiswa) {
      return alert("Isi Tanggal Buka & Deadline!");
    }
    if (tglTutupBeasiswa < tglBukaBeasiswa) {
      return alert("Deadline tidak boleh sebelum Tanggal Buka!");
    }
    if (!sumberResmiBeasiswa.trim() && !linkDaftarBeasiswa.trim()) {
      return alert("Isi minimal salah satu: URL Sumber Resmi atau Link Pendaftaran!");
    }

    const { data: inserted, error } = await supabase.from('scholarships').insert([{
      name: namaBeasiswa.trim(),
      provider_name: penyelenggaraBeasiswa.trim(),
      provider_logo_url: logoBeasiswa.trim() || null,
      description: deskripsiBeasiswa.trim() || null,
      category: kategoriBeasiswa,
      education_level: jenjangBeasiswa,
      application_start: tglBukaBeasiswa,
      application_deadline: tglTutupBeasiswa,
      application_deadline_time: jamTutupBeasiswa || null,
      amount: nominalBeasiswa ? Number(nominalBeasiswa) : null,
      region: wilayahBeasiswa.trim() || null,
      official_source_url: sumberResmiBeasiswa.trim() || null,
      registration_url: linkDaftarBeasiswa.trim() || null,
      verification_status: statusVerifikasiBeasiswa,
      min_ipk: ipkMinBeasiswa ? Number(ipkMinBeasiswa) : null,
      min_semester: semesterMinBeasiswa ? Number(semesterMinBeasiswa) : null,
      max_semester: semesterMaxBeasiswa ? Number(semesterMaxBeasiswa) : null,
      eligible_faculties: fakultasBeasiswa.trim()
        ? fakultasBeasiswa.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      eligible_programs: prodiBeasiswa.trim()
        ? prodiBeasiswa.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      created_by: adminProfile.id,
      ...(statusVerifikasiBeasiswa !== 'unverified'
        ? { last_verified_at: new Date().toISOString(), verified_by: adminProfile.id }
        : {}),
    }]).select('id').single();

    if (error || !inserted) {
      return alert("Gagal menambah beasiswa: " + error?.message);
    }

    // Simpan checklist dokumen kalau diisi (dipisah koma)
    if (dokumenBeasiswa.trim()) {
      const daftarDokumen = dokumenBeasiswa.split(',').map((s) => s.trim()).filter(Boolean);
      const rows = daftarDokumen.map((label, i) => ({
        scholarship_id: inserted.id,
        document_label: label,
        sort_order: i,
      }));
      await supabase.from('scholarship_documents').insert(rows);
    }

    alert("Beasiswa Berhasil Ditambahkan!");
    resetFormBeasiswa();
    fetchData();
  };

  const toggleArsipBeasiswa = async (id: string, statusAktifSaatIni: boolean) => {
    const { error } = await supabase
      .from('scholarships')
      .update({ is_active: !statusAktifSaatIni })
      .eq('id', id);
    if (error) return alert("Gagal mengubah status arsip: " + error.message);
    fetchData();
  };

  const handleDeleteBeasiswa = async (id: string, nama: string) => {
    if (!confirm(`Hapus PERMANEN beasiswa "${nama}"? Kalau cuma mau sembunyikan, pakai tombol Arsipkan aja.`)) return;
    const { error } = await supabase.from('scholarships').delete().eq('id', id);
    if (error) return alert("Gagal menghapus: " + error.message);
    fetchData();
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
    if (!adminProfile) return;
    const { data, error } = await supabase
      .from('status_sistem')
      .upsert(
        { kelas_id: adminProfile.kelas_id, is_active: status },
        { onConflict: 'kelas_id' }
      )
      .select();

    if (error) {
      alert("Gagal update status absensi: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("Update tidak menyentuh baris manapun. Kemungkinan RLS memblokir atau kelas_id tidak cocok.");
      return;
    }

    setAbsensiEnabled(status);
    sendTelegramNotification(
      adminProfile.kelas_id,
      `🚪 <b>STATUS ABSENSI DIUBAH</b>\n` +
      `Status: <b>${status ? 'DIBUKA ✅' : 'DITUTUP ❌'}</b>`
    );
    fetchData();
};

  const updateKodeAbsen = async () => {
    if (!adminProfile) return;
    const { error } = await supabase.from('status_sistem').update({ kode_akses: kodeAbsen.toUpperCase() }).eq('kelas_id', adminProfile.kelas_id);
    if (!error) {
      alert("Kode Absen Berhasil Diperbarui!");
      sendTelegramNotification(
        adminProfile.kelas_id,
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

  // --- BLOK UI BEASISWA (dipakai di panel Admin & panel Owner) ---
  const renderBeasiswaSection = () => (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-teal-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-teal-700 uppercase text-xs flex items-center gap-2">
            <span>🎓</span> Tambah Beasiswa
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <input type="text" placeholder="Nama Beasiswa" className="w-full border p-3 rounded-xl text-xs text-black" value={namaBeasiswa} onChange={e => setNamaBeasiswa(e.target.value)} />
          <input type="text" placeholder="Penyelenggara" className="w-full border p-3 rounded-xl text-xs text-black" value={penyelenggaraBeasiswa} onChange={e => setPenyelenggaraBeasiswa(e.target.value)} />
        </div>

        <input type="text" placeholder="URL Logo Penyelenggara (opsional)" className="w-full border p-3 mb-3 rounded-xl text-xs text-black" value={logoBeasiswa} onChange={e => setLogoBeasiswa(e.target.value)} />

        <textarea placeholder="Deskripsi beasiswa..." className="w-full border p-3 mb-3 rounded-xl text-xs min-h-[80px] text-black" value={deskripsiBeasiswa} onChange={e => setDeskripsiBeasiswa(e.target.value)} />

        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Kategori</p>
            <select className="w-full border p-3 rounded-xl text-xs font-bold text-black" value={kategoriBeasiswa} onChange={e => setKategoriBeasiswa(e.target.value)}>
              {kategoriOptions.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Jenjang</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {jenjangOptions.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleJenjangBeasiswa(level)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-black ${jenjangBeasiswa.includes(level) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Tanggal Buka</p>
            <input type="date" className="w-full border p-3 rounded-xl text-xs text-black" value={tglBukaBeasiswa} onChange={e => setTglBukaBeasiswa(e.target.value)} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Deadline</p>
            <input type="date" className="w-full border p-3 rounded-xl text-xs text-black" value={tglTutupBeasiswa} onChange={e => setTglTutupBeasiswa(e.target.value)} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Jam Deadline (opsional)</p>
            <input type="time" className="w-full border p-3 rounded-xl text-xs text-black" value={jamTutupBeasiswa} onChange={e => setJamTutupBeasiswa(e.target.value)} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <input type="number" placeholder="Nominal Bantuan (Rp, opsional)" className="w-full border p-3 rounded-xl text-xs text-black" value={nominalBeasiswa} onChange={e => setNominalBeasiswa(e.target.value)} />
          <input type="text" placeholder="Wilayah (mis. Jawa Timur)" className="w-full border p-3 rounded-xl text-xs text-black" value={wilayahBeasiswa} onChange={e => setWilayahBeasiswa(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <input type="number" step="0.01" placeholder="IPK Minimum" className="w-full border p-3 rounded-xl text-xs text-black" value={ipkMinBeasiswa} onChange={e => setIpkMinBeasiswa(e.target.value)} />
          <input type="number" placeholder="Min. Semester" className="w-full border p-3 rounded-xl text-xs text-black" value={semesterMinBeasiswa} onChange={e => setSemesterMinBeasiswa(e.target.value)} />
          <input type="number" placeholder="Maks. Semester" className="w-full border p-3 rounded-xl text-xs text-black" value={semesterMaxBeasiswa} onChange={e => setSemesterMaxBeasiswa(e.target.value)} />
        </div>

        <input type="text" placeholder="Fakultas Eligible, pisah koma (kosongkan = semua)" className="w-full border p-3 mb-3 rounded-xl text-xs text-black" value={fakultasBeasiswa} onChange={e => setFakultasBeasiswa(e.target.value)} />
        <input type="text" placeholder="Program Studi Eligible, pisah koma (kosongkan = semua)" className="w-full border p-3 mb-3 rounded-xl text-xs text-black" value={prodiBeasiswa} onChange={e => setProdiBeasiswa(e.target.value)} />
        <input type="text" placeholder="Checklist Dokumen, pisah koma (mis. KTP, KTM, Transkrip Nilai)" className="w-full border p-3 mb-3 rounded-xl text-xs bg-teal-50 text-black" value={dokumenBeasiswa} onChange={e => setDokumenBeasiswa(e.target.value)} />

        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <input type="text" placeholder="URL Sumber Resmi" className="w-full border p-3 rounded-xl text-xs bg-blue-50 text-black" value={sumberResmiBeasiswa} onChange={e => setSumberResmiBeasiswa(e.target.value)} />
          <input type="text" placeholder="Link Pendaftaran" className="w-full border p-3 rounded-xl text-xs bg-blue-50 text-black" value={linkDaftarBeasiswa} onChange={e => setLinkDaftarBeasiswa(e.target.value)} />
        </div>

        <div className="mb-4">
          <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Status Verifikasi</p>
          <select className="w-full border p-3 rounded-xl text-xs font-bold text-black" value={statusVerifikasiBeasiswa} onChange={e => setStatusVerifikasiBeasiswa(e.target.value)}>
            {verifikasiOptions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <p className="text-[9px] text-slate-400 mt-1">Pilih selain Unverified akan otomatis set &quot;Terakhir diverifikasi&quot; ke hari ini.</p>
        </div>

        <button onClick={handlePostBeasiswa} className="w-full bg-teal-600 text-white py-3 rounded-xl font-black text-xs shadow-md">TAMBAHKAN BEASISWA</button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-xs uppercase text-slate-400">Daftar Beasiswa</h3>
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setBeasiswaShowArchived(false)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${!beasiswaShowArchived ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
            >
              Aktif
            </button>
            <button
              onClick={() => setBeasiswaShowArchived(true)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${beasiswaShowArchived ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
            >
              Diarsipkan
            </button>
          </div>
        </div>

        {beasiswaList.length === 0 ? (
          <p className="text-[10px] font-bold text-slate-400 italic">
            {beasiswaShowArchived ? 'Belum ada beasiswa diarsipkan.' : 'Belum ada beasiswa aktif.'}
          </p>
        ) : (
          <div className="space-y-2">
            {beasiswaList.map((b) => {
              const status = hitungStatusBeasiswa(b);
              const statusLabel = labelStatusBeasiswa(status);
              return (
                <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase text-slate-800 truncate">{b.name}</p>
                      <p className="text-[9px] font-bold text-slate-500">{b.provider_name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${statusLabel.className}`}>{statusLabel.text}</span>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{b.verification_status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => toggleArsipBeasiswa(b.id, b.is_active)}
                        className="px-3 py-2 rounded-lg text-[8px] font-black uppercase bg-amber-100 text-amber-700"
                      >
                        {b.is_active ? 'Arsipkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => handleDeleteBeasiswa(b.id, b.name)}
                        className="px-3 py-2 rounded-lg text-[8px] font-black uppercase bg-red-500 text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">
                    Deadline: {formatTanggalTampil(`${b.application_deadline}T${(b.application_deadline_time || '23:59')}`)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // --- LOADING SESI ---
  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // --- BELUM LOGIN ---
  if (!adminProfile) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-3xl border-t-8 border-indigo-600 w-full max-w-sm text-center space-y-3">
        <h2 className="text-xl font-black text-indigo-700 mb-2 uppercase">Login Admin</h2>
        <input
          type="email"
          placeholder="Email admin"
          className="w-full p-4 border-2 rounded-2xl text-center font-bold text-black"
          value={loginEmail}
          onChange={e => setLoginEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 border-2 rounded-2xl text-center font-bold text-black"
          value={loginPassword}
          onChange={e => setLoginPassword(e.target.value)}
          required
        />
        <button
          disabled={loginLoading}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase disabled:opacity-50"
        >
          {loginLoading ? "Memproses..." : "Masuk"}
        </button>
        <Link href="/api/admin/daftar" className="block text-xs text-slate-400 hover:text-indigo-600 pt-2">
          Belum punya akun admin? Daftar di sini
        </Link>
      </form>
    </div>
  );

  // --- MENUNGGU PERSETUJUAN OWNER ---
  if (adminProfile.role === 'pending_admin') return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
      <div className="p-8 bg-white shadow-xl rounded-3xl border-t-8 border-amber-500 w-full max-w-sm text-center space-y-3">
        <p className="text-3xl">⏳</p>
        <h2 className="text-lg font-black text-amber-600 uppercase">Menunggu Persetujuan</h2>
        <p className="text-sm text-slate-500">
          Halo {adminProfile.nama}, pengajuan admin kamu untuk kelas <b>{adminProfile.kelas_nama}</b> masih menunggu persetujuan owner. Coba login lagi nanti.
        </p>
        <button onClick={handleLogout} className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold uppercase text-xs">Keluar</button>
      </div>
    </div>
  );

  // --- PENGAJUAN DITOLAK ---
  if (adminProfile.role === 'rejected_admin') return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
      <div className="p-8 bg-white shadow-xl rounded-3xl border-t-8 border-rose-500 w-full max-w-sm text-center space-y-3">
        <p className="text-3xl">🚫</p>
        <h2 className="text-lg font-black text-rose-600 uppercase">Pengajuan Ditolak</h2>
        <p className="text-sm text-slate-500">
          Halo {adminProfile.nama}, pengajuan admin kamu tidak disetujui oleh owner. Hubungi owner kalau ini keliru.
        </p>
        <button onClick={handleLogout} className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold uppercase text-xs">Keluar</button>
      </div>
    </div>
  );

  // --- OWNER: PANEL PERSETUJUAN ADMIN ---
  if (adminProfile.role === 'owner') return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-black text-indigo-700 uppercase">Panel Owner</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOwnerShowBeasiswa((v) => !v)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${ownerShowBeasiswa ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700'}`}
          >
            🎓 {ownerShowBeasiswa ? 'Tutup Beasiswa' : 'Kelola Beasiswa'}
          </button>
          <button onClick={handleLogout} className="text-xs font-bold text-rose-500 uppercase">Keluar</button>
        </div>
      </div>

      {ownerShowBeasiswa ? (
        <>
          {view !== 'BEASISWA' && (() => { setView('BEASISWA'); return null; })()}
          {renderBeasiswaSection()}
        </>
      ) : (
        <>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-black uppercase text-sm text-slate-600">Pengajuan Admin ({pendingList.length})</h2>
            {ownerLoading && <p className="text-xs text-slate-400">Memuat...</p>}
            {!ownerLoading && pendingList.length === 0 && <p className="text-xs text-slate-400">Tidak ada pengajuan menunggu.</p>}
            {pendingList.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-sm">{p.nama}</p>
                  <p className="text-xs text-slate-400">Kelas: {p.kelas?.nama || '-'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveAdmin(p.id)} className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase">Setujui</button>
                  <button onClick={() => handleRejectAdmin(p.id)} className="px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-black uppercase">Tolak</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-black uppercase text-sm text-slate-600">Admin Aktif ({adminList.length})</h2>
            {adminList.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-sm">{a.nama}</p>
                  <p className="text-xs text-slate-400">Kelas: {a.kelas?.nama || '-'}</p>
                </div>
                <button onClick={() => handleRevokeAdmin(a.id)} className="px-3 py-2 rounded-xl bg-slate-200 text-slate-600 text-xs font-black uppercase">Cabut Akses</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // --- SUDAH LOGIN SEBAGAI ADMIN ---
  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg md:text-xl font-black text-indigo-700 uppercase">
            {view === 'WEB' ? 'Admin Manajemen Konten' : view === 'ABSEN' ? 'Admin Absensi' : view === 'JADWAL' ? 'Admin Jadwal Akademik' : 'Admin Beasiswa'}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
            {adminProfile.nama} • Kelas {adminProfile.kelas_nama}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('WEB')}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase ${view === 'WEB' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              Konten
            </button>
            <button
              onClick={() => setView('JADWAL')}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase ${view === 'JADWAL' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              Jadwal
            </button>
            <button
              onClick={() => setView('ABSEN')}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase ${view === 'ABSEN' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              Absensi
            </button>
            <button
              onClick={() => setView('BEASISWA')}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase ${view === 'BEASISWA' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
            >
              🎓 Beasiswa
            </button>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-xs">LOGOUT</button>
        </div>
      </div>

      {view === 'WEB' ? (
        <div className="space-y-10">

          {/* MANAJEMEN ZOOM */}
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
              <h2 className="font-black mb-4 text-indigo-700 uppercase text-xs">2. Post Praktikum</h2>
              <input
                type="text"
                placeholder="Mata Kuliah (contoh: FISTAN)"
                className="w-full border p-3 mb-2 rounded-xl text-xs font-bold text-black"
                value={mkPrak}
                onChange={e => setMkPrak(e.target.value)}
              />
              <input
                type="text"
                placeholder="Golongan (contoh: C1)"
                className="w-full border p-3 mb-2 rounded-xl text-xs font-bold text-black"
                value={golongan}
                onChange={e => setGolongan(e.target.value)}
              />
              <input type="text" placeholder="Judul" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={judulPrak} onChange={e => setJudulPrak(e.target.value)} />
              <input type="datetime-local" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={deadlinePrak} onChange={e => setDeadlinePrak(e.target.value)} />
              <input type="text" placeholder="Link Pengumpulan" className="w-full border p-3 mb-2 rounded-xl text-xs bg-yellow-50 text-black" value={linkPrak} onChange={e => setLinkPrak(e.target.value)} />
              <textarea placeholder="Deskripsi Praktikum..." className="w-full border p-3 mb-4 rounded-xl text-xs min-h-[80px] text-black" value={deskripsiPrak} onChange={e => setDeskripsiPrak(e.target.value)} />
              <button onClick={handlePostTugasPrak} className="w-full bg-[#D4AF37] text-white py-3 rounded-xl font-black text-xs shadow-md">PUBLISH</button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-indigo-600">
              <h2 className="font-black mb-4 text-slate-700 uppercase text-xs">3. Upload Materi</h2>
              <input type="text" placeholder="Matkul" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={mkMateri} onChange={e => setMkMateri(e.target.value)} />
              <input type="text" placeholder="Judul Materi" className="w-full border p-3 mb-2 rounded-xl text-xs text-black" value={judulMateri} onChange={e => setJudulMateri(e.target.value)} />
              <input type="number" placeholder="Semester (Contoh: 3)" className="w-full border p-3 mb-2 rounded-xl text-xs text-black font-bold focus:border-indigo-500 outline-none" value={semesterMateri} onChange={e => setSemesterMateri(e.target.value)} min="1" />
              <input type="file" className="w-full mb-4 text-[10px] text-black" onChange={e => setFile(e.target.files?.[0] || null)} />
              <button onClick={handleUploadMateri} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-xs shadow-md">UPLOAD</button>
            </div>
          </div>

          {/* MANAJEMEN PENGUMUMAN */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-indigo-600">
            <h2 className="font-black mb-4 text-indigo-700 uppercase text-xs">📢 Post Pengumuman</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <input
                  type="text"
                  placeholder="Judul Pengumuman"
                  className="w-full border p-3 mb-2 rounded-xl text-xs text-black"
                  value={judulPengumuman}
                  onChange={e => setJudulPengumuman(e.target.value)}
                />
                <textarea
                  placeholder="Isi pengumuman..."
                  className="w-full border p-3 mb-2 rounded-xl text-xs min-h-[100px] text-black"
                  value={isiPengumuman}
                  onChange={e => setIsiPengumuman(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Link (opsional) — https://..."
                  className="w-full border p-3 mb-2 rounded-xl text-xs bg-indigo-50 text-black"
                  value={linkPengumuman}
                  onChange={e => setLinkPengumuman(e.target.value)}
                />
                <label className="flex items-center gap-2 mb-4 text-[10px] font-black text-slate-500 uppercase cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinPengumuman}
                    onChange={e => setPinPengumuman(e.target.checked)}
                  />
                  📌 Sematkan di atas (pin)
                </label>
                <button onClick={handlePostPengumuman} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-xs shadow-md">
                  PUBLISH PENGUMUMAN
                </button>
              </div>

              <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2">
                {pengumuman.length > 0 ? pengumuman.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                          {p.is_pinned && <span>📌</span>} {p.judul}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                          {new Date(p.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button onClick={() => deleteData(p.id, 'pengumuman')} className="text-red-500 text-[9px] font-black hover:underline shrink-0">
                        HAPUS
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">{p.isi}</p>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-indigo-600 hover:underline mt-1 inline-block truncate max-w-full">
                        🔗 {p.link}
                      </a>
                    )}
                  </div>
                )) : (
                  <p className="text-[10px] font-bold text-slate-400 italic">Belum ada pengumuman.</p>
                )}
              </div>
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
                          <button onClick={() => downloadPDF(i)} className="text-indigo-700 text-[10px] font-black hover:underline">PDF</button>
                          <button onClick={() => deleteData(i.id, 'perizinan')} className="text-red-500 text-[10px] font-black hover:underline">X</button>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-600 font-medium pt-1 border-t border-dashed border-slate-200">
                        <p><span className="font-bold text-indigo-700">MK:</span> {i.mk_nama || "-"}</p>
                        <p><span className="font-bold text-indigo-700">Alasan:</span> {i.alasan || "-"}</p>
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
                        <span className="bg-indigo-700 text-white px-2 py-0.5 rounded-full text-[8px] font-black">{total}</span>
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
      ) : view === 'ABSEN' ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-3xl shadow-sm text-center border-l-8 border-blue-600">
                <h2 className="font-black text-slate-800 uppercase text-xs mb-4">Pintu Absensi</h2>
                <button onClick={() => toggleAbsensi(!absensiEnabled)} className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${absensiEnabled ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {absensiEnabled ? 'SISTEM: OPEN' : 'SISTEM: CLOSED'}
                </button>
             </div>
             <div className="bg-white p-8 rounded-3xl shadow-sm text-center border-l-8 border-indigo-600">
                <h2 className="font-black text-slate-800 uppercase text-xs mb-4">Kode Akses Hari Ini</h2>
                <div className="flex gap-2">
                  <input type="text" placeholder="SET KODE" className="flex-1 border-2 p-3 rounded-xl font-black text-center uppercase text-sm focus:border-indigo-500 outline-none text-black" value={kodeAbsen} onChange={e => setKodeAbsen(e.target.value)} />
                  <button onClick={updateKodeAbsen} className="bg-indigo-600 text-white px-6 rounded-xl font-black text-[10px] uppercase shadow-md">Simpan</button>
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
      ) : view === 'JADWAL' ? (
        <div className="space-y-8">

          {/* JADWAL MINGGUAN (POLA TETAP) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-indigo-600">
            <h2 className="font-black mb-1 text-indigo-700 uppercase text-xs">📅 Jadwal Mingguan (Pola Tetap)</h2>
            <p className="text-[10px] text-slate-400 font-medium mb-4">
              Isi sekali, otomatis berlaku setiap minggu terus-menerus. Cukup ubah kalau memang ada perubahan permanen di jadwal kelas.
            </p>

            <div className="grid md:grid-cols-5 gap-3 items-end mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Hari</p>
                <select
                  className="w-full border p-3 rounded-xl text-xs font-bold text-black"
                  value={hariTemplate}
                  onChange={e => setHariTemplate(e.target.value)}
                >
                  {namaHari.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Mata Kuliah</p>
                <input type="text" placeholder="Nama Matkul" className="w-full border p-3 rounded-xl text-xs text-black" value={subjectTemplate} onChange={e => setSubjectTemplate(e.target.value)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Jam</p>
                <input type="text" placeholder="08.00 - 10.00" className="w-full border p-3 rounded-xl text-xs text-black" value={timeTemplate} onChange={e => setTimeTemplate(e.target.value)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Ruangan</p>
                <input type="text" placeholder="Ruang / Lab" className="w-full border p-3 rounded-xl text-xs text-black" value={roomTemplate} onChange={e => setRoomTemplate(e.target.value)} />
              </div>
              <button onClick={handleTambahTemplate} className="bg-indigo-600 text-white py-3 rounded-xl font-black text-xs shadow-md">TAMBAH</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {namaHari.map((namaH, idxHari) => {
                const listPerHari = jadwalTemplate.filter(t => t.hari === idxHari);
                return (
                  <div key={idxHari} className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                    <p className="text-[10px] font-black uppercase text-indigo-700 mb-2">{namaH}</p>
                    {listPerHari.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Tidak ada jadwal</p>
                    ) : listPerHari.map(t => (
                      <div key={t.id} className="flex justify-between items-center bg-white p-2.5 mb-2 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold text-slate-800 uppercase">{t.subject}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{t.time} • {t.room || '-'}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleToggleTemplate(t.id, !t.is_active)}
                            className={`px-2 py-1 rounded-lg text-[8px] font-black ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
                          >
                            {t.is_active ? 'AKTIF' : 'OFF'}
                          </button>
                          <button onClick={() => handleHapusTemplate(t.id)} className="text-red-500 text-[9px] font-black hover:underline">HAPUS</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PENGECUALIAN / PERUBAHAN MENDADAK */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border-t-8 border-amber-500">
            <h2 className="font-black mb-1 text-amber-600 uppercase text-xs">⚡ Pengecualian / Perubahan Mendadak</h2>
            <p className="text-[10px] text-slate-400 font-medium mb-4">
              Cuma buat kasus dadakan di 1 tanggal spesifik — dosen ganti jadwal, libur, dll. Jadwal mingguan di atas gak kesentuh sama sekali.
            </p>

            <div className="grid md:grid-cols-6 gap-3 items-end mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <div>
                <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Tanggal</p>
                <input type="date" className="w-full border p-3 rounded-xl text-xs text-black" value={tglPengecualian} onChange={e => setTglPengecualian(e.target.value)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Tipe</p>
                <select className="w-full border p-3 rounded-xl text-xs font-bold text-black" value={tipePengecualian} onChange={e => setTipePengecualian(e.target.value)}>
                  <option value="ganti">Ganti Jadwal</option>
                  <option value="tambahan">Tambahan</option>
                  <option value="libur">Libur</option>
                </select>
              </div>

              {tipePengecualian !== 'libur' && (
                <>
                  <div>
                    <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Mata Kuliah</p>
                    <input type="text" placeholder="Nama Matkul" className="w-full border p-3 rounded-xl text-xs text-black" value={subjectPengecualian} onChange={e => setSubjectPengecualian(e.target.value)} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Jam</p>
                    <input type="text" placeholder="14.00 - 16.00" className="w-full border p-3 rounded-xl text-xs text-black" value={timePengecualian} onChange={e => setTimePengecualian(e.target.value)} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Ruangan</p>
                    <input type="text" placeholder="Ruang / Lab" className="w-full border p-3 rounded-xl text-xs text-black" value={roomPengecualian} onChange={e => setRoomPengecualian(e.target.value)} />
                  </div>
                </>
              )}

              <div className={tipePengecualian === 'libur' ? 'md:col-span-3' : ''}>
                <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Keterangan (opsional)</p>
                <input type="text" placeholder="Alasan perubahan..." className="w-full border p-3 rounded-xl text-xs text-black" value={keteranganPengecualian} onChange={e => setKeteranganPengecualian(e.target.value)} />
              </div>

              <button onClick={handleTambahPengecualian} className="bg-amber-500 text-white py-3 rounded-xl font-black text-xs shadow-md">TAMBAH</button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {jadwalPengecualian.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Belum ada pengecualian.</p>
              ) : jadwalPengecualian.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-slate-700">{p.day}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        p.tipe === 'libur' ? 'bg-red-100 text-red-600' :
                        p.tipe === 'tambahan' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-700'
                      }`}>{p.tipe}</span>
                    </div>
                    {p.tipe === 'libur' ? (
                      <p className="text-[10px] text-slate-500 italic">{p.keterangan || 'Tidak ada perkuliahan'}</p>
                    ) : (
                      <p className="text-[10px] font-bold text-slate-800 uppercase">{p.subject} — {p.time} • {p.room || '-'}</p>
                    )}
                  </div>
                  <button onClick={() => handleHapusPengecualian(p.id)} className="text-red-500 text-[9px] font-black hover:underline shrink-0">HAPUS</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        renderBeasiswaSection()
      )}
    </div>
  );
}