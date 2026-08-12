"use client";

import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { createClient } from "@/utils/supabase/client"; // Pastikan path ini sesuai dengan project Next.js kamu

// ── Helper format tanggal ke Bahasa Indonesia ──────────────────────────────
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const formatTanggalIndo = (date: Date) => {
  return `${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
};

// data.tanggal dari <input type="date"> formatnya "YYYY-MM-DD"
const formatTanggalInput = (iso: string) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "-";
  return formatTanggalIndo(new Date(y, m - 1, d));
};

// Normalisasi nomor WA ke format internasional (62xxx), terima input
// "08xxx", "+62xxx", atau "62xxx" — semua diseragamkan.
const normalizeNomorWa = (nomor: string) => {
  let n = nomor.replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (!n.startsWith("62")) n = "62" + n;
  return n;
};

const SuratIzinMahasiswa = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // State buat tahap "setelah submit"
  const [suratPdfUrl, setSuratPdfUrl] = useState<string | null>(null);
  const [suratPdfBlob, setSuratPdfBlob] = useState<Blob | null>(null); // dipakai buat Web Share (file asli)
  const [showKirimPanel, setShowKirimPanel] = useState(false);
  const [namaFilePdf, setNamaFilePdf] = useState("");

  // Nomor WA dosen tujuan (diisi mahasiswa di panel setelah submit)
  const [nomorWaDosen, setNomorWaDosen] = useState("");
  // Progres pengiriman 2 langkah: pengantar dulu, baru PDF
  const [waStep, setWaStep] = useState<"pengantar" | "pdf" | "selesai">("pengantar");

  // Snapshot data yang dipakai buat nyusun pesan pengantar WA
  // (dipisah dari formData karena formData akan direset setelah submit)
  const [dataTerkirim, setDataTerkirim] = useState({
    namaLengkap: "",
    npm: "",
    namaMatkul: "",
    namaDosen: "",
    tanggal: "",
    alasan: "",
  });

  const [formData, setFormData] = useState({
    namaMatkul: "",
    namaLengkap: "",
    npm: "",
    prodi: "",
    fakultas: "",
    tanggal: "",
    alasan: "",
    namaWali: "",
    namaDosen: "", // opsional — kalau kosong, fallback ke sapaan generik di PDF
    kota: "Surabaya", // buat kop tanggal surat, bisa diedit mahasiswa
    kategoriAlasan: "Sakit", // "Sakit" | "Acara Keluarga" | "Lainnya"
    buktiMenyusul: false, // khusus kategori "Sakit", misal surat dokter belum ada saat submit
  });

  // Refs untuk Signature Pad
  const sigPadMhs = useRef<SignatureCanvas>(null);
  const sigPadOrtu = useRef<SignatureCanvas>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const clearSignature = (type: "mhs" | "ortu") => {
    if (type === "mhs") sigPadMhs.current?.clear();
    else sigPadOrtu.current?.clear();
  };

  // ── FIX #1: Simpan & pulihkan tanda tangan setiap kali ukuran viewport
  // berubah (termasuk saat keyboard HP muncul/hilang), supaya coretan yang
  // sudah digambar tidak hilang.
  useEffect(() => {
    const preserveSignatures = () => {
      [sigPadMhs, sigPadOrtu].forEach((ref) => {
        const pad = ref.current;
        if (!pad || pad.isEmpty()) return;
        const data = pad.toData();
        requestAnimationFrame(() => {
          pad.clear();
          pad.fromData(data);
        });
      });
    };

    const vv = window.visualViewport;
    vv?.addEventListener("resize", preserveSignatures);
    window.addEventListener("resize", preserveSignatures);

    return () => {
      vv?.removeEventListener("resize", preserveSignatures);
      window.removeEventListener("resize", preserveSignatures);
    };
  }, []);

  // ── FIX #2: Tutup keyboard otomatis begitu user mulai menyentuh area
  // tanda tangan.
  const blurActiveInput = () => {
    const el = document.activeElement as HTMLElement | null;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
      el.blur();
    }
  };

  // ── Generate PDF surat izin ──────────────────────────────────────────────
  // Cursor Y dinamis + auto page-break (ensureSpace) supaya layout otomatis
  // pindah halaman kalau konten kepanjangan.
  const buildSuratPdf = (
    data: typeof formData,
    ttdMhsBase64: string,
    ttdOrtuBase64: string,
    lampiranUrl: string
  ): jsPDF => {
    const doc = new jsPDF();
    const marginX = 20;
    const marginBottom = 25;
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    const ensureSpace = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - marginBottom) {
        doc.addPage();
        y = 20;
      }
    };

    const adaLampiranFile = !!lampiranUrl;
    const lampiranMenyusul = !adaLampiranFile && data.buktiMenyusul;

    // Kop: kota & tanggal surat (kanan atas)
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const tanggalSurat = `${data.kota || "Surabaya"}, ${formatTanggalIndo(new Date())}`;
    doc.text(tanggalSurat, 190, y, { align: "right" });
    y += 14;

    // Judul
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("SURAT PERMOHONAN IZIN KULIAH", 105, y, { align: "center" });
    y += 12;

    // Perihal & Lampiran (kondisional)
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Perihal", marginX, y);
    doc.text(": Permohonan Izin Tidak Mengikuti Perkuliahan", marginX + 26, y);
    y += 6;

    if (adaLampiranFile) {
      doc.text("Lampiran", marginX, y);
      doc.text(": 1 (satu) berkas", marginX + 26, y);
      y += 6;
    } else if (lampiranMenyusul) {
      doc.text("Lampiran", marginX, y);
      doc.text(": Menyusul", marginX + 26, y);
      y += 6;
    }
    y += 6;

    // Alamat tujuan
    ensureSpace(24);
    doc.text("Kepada Yth.", marginX, y);
    y += 6;
    doc.setFont("times", "bold");
    if (data.namaDosen?.trim()) {
      const namaDosenLines = doc.splitTextToSize(data.namaDosen.trim(), 170);
      doc.text(namaDosenLines, marginX, y);
      y += namaDosenLines.length * 6;
      doc.setFont("times", "normal");
      doc.text(`Dosen Pengampu Mata Kuliah ${data.namaMatkul || "-"}`, marginX, y);
    } else {
      doc.text("Bapak/Ibu Dosen Pengampu Mata Kuliah", marginX, y);
      y += 6;
      doc.setFont("times", "normal");
      doc.text(data.namaMatkul || "-", marginX, y);
    }
    y += 6;
    doc.text("di Tempat", marginX, y);
    y += 12;

    // Salam pembuka
    ensureSpace(16);
    doc.text("Dengan hormat,", marginX, y);
    y += 8;
    doc.text("Yang bertanda tangan di bawah ini, saya:", marginX, y);
    y += 8;

    // Identitas
    ensureSpace(4 * 7 + 4);
    const dX = marginX + 8;
    const labelWidth = 38;
    const identitas: [string, string][] = [
      ["Nama", data.namaLengkap || "-"],
      ["NPM", data.npm || "-"],
      ["Program Studi", data.prodi || "-"],
      ["Fakultas", data.fakultas || "-"],
    ];
    identitas.forEach(([label, value]) => {
      doc.text(label, dX, y);
      doc.text(`: ${value}`, dX + labelWidth, y);
      y += 7;
    });
    y += 4;

    // Isi permohonan
    let isi = `Dengan ini mengajukan permohonan izin untuk tidak mengikuti perkuliahan mata kuliah ${
      data.namaMatkul || "-"
    } yang dijadwalkan pada tanggal ${formatTanggalInput(data.tanggal)}, dikarenakan ${
      data.alasan || "-"
    }.`;
    if (lampiranMenyusul) {
      isi += " Sebagai bukti pendukung, saya akan menyusulkan surat keterangan terkait setelah diterbitkan.";
    } else if (adaLampiranFile) {
      isi += " Sebagai bukti pendukung, saya lampirkan dokumen terkait pada surat ini.";
    }
    const isiLines = doc.splitTextToSize(isi, 170);
    ensureSpace(isiLines.length * 6 + 6);
    doc.text(isiLines, marginX, y);
    y += isiLines.length * 6 + 6;

    // Penutup
    const penutup =
      "Demikian surat permohonan ini saya sampaikan. Saya mohon maaf atas ketidakhadiran saya dan sangat berterima kasih atas pengertian serta izin yang Bapak/Ibu berikan. Atas perhatian dan kebijaksanaannya, saya ucapkan terima kasih.";
    const penutupLines = doc.splitTextToSize(penutup, 170);
    ensureSpace(penutupLines.length * 6 + 14);
    doc.text(penutupLines, marginX, y);
    y += penutupLines.length * 6 + 14;

    // Tanda tangan
    ensureSpace(45);
    const ttdY = y;
    doc.setFont("times", "normal");
    doc.text("Mengetahui,", 50, ttdY, { align: "center" });
    doc.text("Orang Tua/Wali,", 50, ttdY + 6, { align: "center" });
    doc.text("Hormat saya,", 150, ttdY, { align: "center" });
    doc.text("Pemohon,", 150, ttdY + 6, { align: "center" });
    try {
      doc.addImage(ttdOrtuBase64, "PNG", 30, ttdY + 10, 40, 15);
    } catch (e) {}
    try {
      doc.addImage(ttdMhsBase64, "PNG", 130, ttdY + 10, 40, 15);
    } catch (e) {}
    doc.setFont("times", "bold");
    doc.text(`( ${data.namaWali || "________________"} )`, 50, ttdY + 35, { align: "center" });
    doc.text(`( ${data.namaLengkap} )`, 150, ttdY + 35, { align: "center" });

    if (lampiranUrl) {
      doc.addPage();
      doc.text("LAMPIRAN BUKTI", 105, 20, { align: "center" });
      try {
        doc.addImage(lampiranUrl, "JPEG", 15, 30, 180, 240);
      } catch (e) {}
    }

    return doc;
  };

  // ── Template pesan pengantar WA (dikirim sebagai bubble teks terpisah,
  // SEBELUM PDF-nya dikirim di langkah kedua) ────────────────────────────
  const buildPesanPengantar = () => {
    const sapaan = dataTerkirim.namaDosen?.trim()
      ? `Yth. ${dataTerkirim.namaDosen}`
      : "Yth. Bapak/Ibu Dosen";
    return (
      `${sapaan},\n\n` +
      `Mohon izin, perkenalkan saya *${dataTerkirim.namaLengkap}* (NPM: ${dataTerkirim.npm}), mahasiswa pada mata kuliah ${dataTerkirim.namaMatkul || "-"}.\n\n` +
      `Melalui pesan ini, saya bermaksud mengajukan permohonan izin untuk tidak mengikuti perkuliahan pada tanggal ${formatTanggalInput(
        dataTerkirim.tanggal
      )}, dikarenakan ${dataTerkirim.alasan || "-"}.\n\n` +
      `Atas perhatian dan izin yang Bapak/Ibu berikan, saya ucapkan terima kasih.\n\n` +
      `Hormat saya,\n${dataTerkirim.namaLengkap}`
    );
  };

  // ── Langkah 1: buka WA ke nomor dosen, teks pengantar sudah terisi ──────
  // PENTING: pakai api.whatsapp.com/send (bukan wa.me) supaya karakter
  // emoji/UTF-8 tidak rusak saat redirect.
  const kirimPengantar = () => {
    if (!nomorWaDosen.trim()) {
      return alert("Mohon isi nomor WhatsApp dosen terlebih dahulu.");
    }
    const nomor = normalizeNomorWa(nomorWaDosen);
    const pesan = encodeURIComponent(buildPesanPengantar());
    window.open(`https://api.whatsapp.com/send?phone=${nomor}&text=${pesan}`, "_blank");
    setWaStep("pdf");
  };

  // ── Langkah 2: share PDF asli (bukan link) lewat Web Share API ─────────
  // Nomor tujuan tidak bisa di-set otomatis di sini (limitasi WA), jadi
  // mahasiswa tinggal pilih kontak dosennya sendiri dari share sheet HP —
  // biasanya sudah ada di paling atas karena baru saja dibuka di langkah 1.
  const kirimSuratPdf = async () => {
    if (!suratPdfBlob) return;
    const fileToShare = new File([suratPdfBlob], namaFilePdf || "Surat_Izin.pdf", {
      type: "application/pdf",
    });

    const bisaShareFile =
      typeof navigator !== "undefined" &&
      !!navigator.share &&
      !!navigator.canShare &&
      navigator.canShare({ files: [fileToShare] });

    if (bisaShareFile) {
      try {
        await navigator.share({ files: [fileToShare], title: "Surat Izin Kuliah" });
        setWaStep("selesai");
      } catch (err) {
        // User membatalkan share — biarkan saja, jangan dianggap error
      }
    } else {
      // Fallback (biasanya desktop): unduh manual lalu instruksikan attach sendiri
      const url = URL.createObjectURL(fileToShare);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileToShare.name;
      a.click();
      URL.revokeObjectURL(url);
      alert(
        "Perangkat/browser kamu belum mendukung fitur share otomatis. File PDF sudah diunduh — silakan lampirkan manual ke chat WhatsApp dosen."
      );
      setWaStep("selesai");
    }
  };

  const handleSubmit = async () => {
    if (!formData.namaLengkap || !formData.npm || !formData.namaMatkul) {
      return alert("Mohon lengkapi Nama, NPM, dan Mata Kuliah!");
    }
    if (sigPadMhs.current?.isEmpty() || sigPadOrtu.current?.isEmpty()) {
      return alert("Tanda tangan Mahasiswa dan Wali wajib diisi!");
    }

    setLoading(true);

    try {
      const ttdMhsBase64 = sigPadMhs.current!.getTrimmedCanvas().toDataURL("image/png");
      const ttdOrtuBase64 = sigPadOrtu.current!.getTrimmedCanvas().toDataURL("image/png");

      let lampiranUrl = "";

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_bukti.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
        lampiranUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("perizinan").insert([
        {
          nama_lengkap: formData.namaLengkap,
          npm: formData.npm,
          mk_nama: formData.namaMatkul,
          alasan: formData.alasan,
          nama_wali: formData.namaWali,
          nama_dosen: formData.namaDosen,
          kota: formData.kota,
          kategori_alasan: formData.kategoriAlasan,
          bukti_menyusul: formData.buktiMenyusul,
          prodi: formData.prodi,
          fakultas: formData.fakultas,
          tgl_izin: formData.tanggal,
          tanda_tangan_url: ttdMhsBase64,
          surat_dokter_url: ttdOrtuBase64,
          file_pdf_url: lampiranUrl,
        },
      ]);

      if (error) throw error;

      const doc = buildSuratPdf(formData, ttdMhsBase64, ttdOrtuBase64, lampiranUrl);
      const pdfBlob = doc.output("blob");

      const namaBersih = formData.namaLengkap.trim().replace(/[^a-zA-Z0-9 _-]/g, "");
      const kodeUnik = Date.now().toString(36).toUpperCase();
      const fileName = `${formData.npm || "mahasiswa"}_${namaBersih || "mahasiswa"}_${kodeUnik}.pdf`;

      const { error: uploadPdfError } = await supabase.storage
        .from("uploads")
        .upload(`surat/${fileName}`, pdfBlob, { contentType: "application/pdf", upsert: true });

      if (uploadPdfError) throw uploadPdfError;

      const { data: pdfUrlData } = supabase.storage.from("uploads").getPublicUrl(`surat/${fileName}`);

      // Simpan snapshot data buat template pesan pengantar (sebelum formData direset)
      setDataTerkirim({
        namaLengkap: formData.namaLengkap,
        npm: formData.npm,
        namaMatkul: formData.namaMatkul,
        namaDosen: formData.namaDosen,
        tanggal: formData.tanggal,
        alasan: formData.alasan,
      });

      setSuratPdfUrl(pdfUrlData.publicUrl);
      setSuratPdfBlob(pdfBlob);
      setNamaFilePdf(fileName);
      setNomorWaDosen("");
      setWaStep("pengantar");
      setShowKirimPanel(true);

      setFormData({
        ...formData,
        namaMatkul: "",
        alasan: "",
        tanggal: "",
        namaDosen: "",
        buktiMenyusul: false,
      });
      setFile(null);
      sigPadMhs.current?.clear();
      sigPadOrtu.current?.clear();
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengirim data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 bg-[#f7f7fb] dark:bg-[#0a0a0a] min-h-screen text-slate-900 dark:text-white font-sans">
      {/* ── MODAL: muncul begitu perizinan sukses terkirim ── */}
      {showKirimPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-[#141414] max-w-md w-full rounded-[30px] p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-white/10 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-black">
              ✓
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-white uppercase">Data Berhasil Terkirim!</p>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase mt-1">
                Kirim ke Dosen Sekarang
              </p>
            </div>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Isi nomor WhatsApp dosen tujuan, lalu kirim <b>pesan pengantar</b> dan <b>surat PDF</b> secara
              berurutan. Perizinan baru dianggap masuk kalau kedua langkah ini sudah dikirim ke dosen.
            </p>

            <div className="text-left space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Nomor WhatsApp Dosen</label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                value={nomorWaDosen}
                onChange={(e) => setNomorWaDosen(e.target.value)}
                disabled={waStep !== "pengantar"}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={kirimPengantar}
                disabled={waStep !== "pengantar"}
                className={`w-full px-5 py-4 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 ${
                  waStep === "pengantar"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {waStep === "pengantar" ? "1. Kirim Pesan Pengantar" : "✓ Pesan Pengantar Terkirim"}
              </button>

              <button
                onClick={kirimSuratPdf}
                disabled={waStep === "pengantar"}
                className={`w-full px-5 py-4 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 ${
                  waStep === "pdf"
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : waStep === "selesai"
                    ? "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                }`}
              >
                {waStep === "selesai" ? "✓ Surat PDF Terkirim" : "2. Kirim Surat PDF"}
              </button>
            </div>

            <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Langkah 1 membuka WhatsApp ke nomor dosen dengan pesan pengantar yang sudah terisi — tinggal
              pencet kirim. Langkah 2 membuka menu share HP kamu — pilih WhatsApp, lalu pilih nama dosennya
              (biasanya sudah muncul paling atas), file PDF asli akan terkirim sebagai bubble terpisah.
            </p>

            {suratPdfUrl && (
              <a
                href={suratPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-slate-400 hover:underline block"
              >
                Pratinjau/unduh PDF secara manual
              </a>
            )}

            {waStep === "selesai" && (
              <button
                onClick={() => setShowKirimPanel(false)}
                className="text-[10px] font-bold text-slate-400 hover:underline pt-1"
              >
                Tutup ✓
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-white dark:bg-[#141414] p-6 md:p-10 rounded-[30px] shadow-sm border border-slate-100 dark:border-white/10">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[22px] p-6 mb-8 text-center text-white">
          <h1 className="text-2xl font-black uppercase tracking-tight relative z-10">Form Perizinan Kuliah</h1>
          <p className="text-xs font-bold text-indigo-100 mt-1 relative z-10">
            Lengkapi data untuk dikirim langsung ke dosen
          </p>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Nama Mahasiswa</label>
              <input
                name="namaLengkap"
                placeholder="Contoh: Budi Santoso"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.namaLengkap}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">NPM</label>
              <input
                name="npm"
                placeholder="Masukkan NPM"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.npm}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Program Studi</label>
              <input
                name="prodi"
                placeholder="Contoh: Agroteknologi"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.prodi}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Fakultas</label>
              <input
                name="fakultas"
                placeholder="Contoh: Pertanian"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.fakultas}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Mata Kuliah</label>
              <input
                name="namaMatkul"
                placeholder="Nama MK"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.namaMatkul}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Nama Orang Tua/Wali</label>
              <input
                name="namaWali"
                placeholder="Nama Pendamping"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.namaWali}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">
                Nama Dosen <span className="normal-case font-normal text-slate-400">(opsional, dengan gelar)</span>
              </label>
              <input
                name="namaDosen"
                placeholder="Contoh: Prof. Dr. Budi Santoso, S.P., M.P."
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.namaDosen}
              />
              <p className="text-[9px] text-slate-400 ml-1">
                Kosongkan kalau tidak tahu — surat akan pakai sapaan "Bapak/Ibu Dosen Pengampu".
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Kota (Kop Surat)</label>
              <input
                name="kota"
                placeholder="Surabaya"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.kota}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Tanggal Izin</label>
              <input
                name="tanggal"
                type="date"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                onChange={handleInputChange}
                value={formData.tanggal}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Kategori Alasan</label>
              <select
                name="kategoriAlasan"
                className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                onChange={handleInputChange}
                value={formData.kategoriAlasan}
              >
                <option value="Sakit">Sakit</option>
                <option value="Acara Keluarga">Acara Keluarga</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase ml-1 text-slate-400">
              Lampiran Bukti (Foto) <span className="normal-case font-normal text-slate-400">(opsional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white p-2 rounded-2xl text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-bold"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {formData.kategoriAlasan === "Sakit" && !file && (
              <label className="flex items-center gap-2 mt-2 ml-1 cursor-pointer">
                <input
                  type="checkbox"
                  name="buktiMenyusul"
                  checked={formData.buktiMenyusul}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Surat keterangan dokter belum ada, akan menyusul
                </span>
              </label>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Alasan Tidak Mengikuti Kuliah</label>
            <textarea
              name="alasan"
              rows={3}
              placeholder="Contoh: Sakit demam/Acara keluarga..."
              className="w-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-3 rounded-2xl focus:border-indigo-500 outline-none transition-all"
              onChange={handleInputChange}
              value={formData.alasan}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex justify-between">
                Tanda Tangan Wali{" "}
                <button onClick={() => clearSignature("ortu")} className="text-red-500 lowercase font-normal italic">
                  [hapus]
                </button>
              </label>
              <div
                className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-white/5 overflow-hidden touch-none"
                onTouchStart={blurActiveInput}
                onPointerDown={blurActiveInput}
              >
                <SignatureCanvas ref={sigPadOrtu} penColor="black" canvasProps={{ className: "w-full h-32" }} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex justify-between">
                Tanda Tangan Mahasiswa{" "}
                <button onClick={() => clearSignature("mhs")} className="text-red-500 lowercase font-normal italic">
                  [hapus]
                </button>
              </label>
              <div
                className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-white/5 overflow-hidden touch-none"
                onTouchStart={blurActiveInput}
                onPointerDown={blurActiveInput}
              >
                <SignatureCanvas ref={sigPadMhs} penColor="black" canvasProps={{ className: "w-full h-32" }} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full mt-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
            loading
              ? "bg-slate-300 dark:bg-white/10 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
          }`}
        >
          {loading ? "Sedang Mengirim..." : "Kirim Perizinan"}
        </button>

        <p className="text-center text-[9px] text-slate-400 mt-6 font-bold uppercase">
          Setelah dikirim, kamu akan diarahkan mengirim surat langsung ke dosen via WhatsApp.
        </p>
      </div>
    </div>
  );
};

export default SuratIzinMahasiswa;