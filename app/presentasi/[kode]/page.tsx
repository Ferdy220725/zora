"use client";

import React, { useState, useEffect, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { generateThumbnail } from "@/lib/pdfRender";
import { channelName, EVENT_NAME } from "@/lib/presentasiChannel";
import { Upload, Play, GripVertical, Copy, NotebookPen } from "lucide-react";

interface SesiPresentasi {
  id: string;
  kode: string;
  nama_sesi: string;
  kelas_id: string;
}

interface PresentasiItem {
  id: string;
  nama_kelompok: string;
  file_url: string;
  thumbnail_url: string | null;
  urutan: number;
}

interface CatatanItem {
  id: string;
  slide: number;
  isi: string;
  created_at: string;
}

export default function LobbySesi({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = use(params);
  const supabase = createClient();
  const router = useRouter();

  const [sesi, setSesi] = useState<SesiPresentasi | null>(null);
  const [items, setItems] = useState<PresentasiItem[]>([]);
  const [namaKelompok, setNamaKelompok] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // --- state untuk modal catatan ---
  const [modalCatatan, setModalCatatan] = useState<PresentasiItem | null>(null);
  const [daftarCatatan, setDaftarCatatan] = useState<CatatanItem[]>([]);
  const [loadingCatatan, setLoadingCatatan] = useState(false);

  useEffect(() => {
    fetchSesi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kode]);

  const fetchSesi = async () => {
    const { data: sesiData } = await supabase
      .from("sesi_presentasi")
      .select("*")
      .eq("kode", kode.toUpperCase())
      .maybeSingle();

    if (!sesiData) {
      setSesi(null);
      return;
    }
    setSesi(sesiData);

    const { data: itemData } = await supabase
      .from("presentasi_items")
      .select("*")
      .eq("sesi_id", sesiData.id)
      .order("urutan", { ascending: true });

    setItems(itemData || []);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !namaKelompok.trim() || !sesi) return;
    if (file.type !== "application/pdf") {
      alert("File harus PDF ya.");
      return;
    }
    setUploading(true);

    try {
      const path = `${sesi.kode}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("presentasi-pdf")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("presentasi-pdf")
        .getPublicUrl(path);

      const thumbnail = await generateThumbnail(file).catch(() => null);
      const maxUrutan = items.reduce((m, i) => Math.max(m, i.urutan), 0);

      const { error: insertError } = await supabase
        .from("presentasi_items")
        .insert({
          sesi_id: sesi.id,
          kelas_id: sesi.kelas_id, // wajib, kolom NOT NULL + terikat RLS ke kelas sesi ini
          nama_kelompok: namaKelompok.trim(),
          file_url: publicUrlData.publicUrl,
          thumbnail_url: thumbnail,
          urutan: maxUrutan + 1,
        });
      if (insertError) throw insertError;

      setNamaKelompok("");
      setFile(null);
      fetchSesi();
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Gagal upload: " + (err?.message ?? "Terjadi kesalahan tidak diketahui."));
    } finally {
      setUploading(false);
    }
  };

  const handleMulai = async (item: PresentasiItem) => {
    if (!sesi) return;
    await supabase
      .from("sesi_presentasi")
      .update({ active_item_id: item.id, current_slide: 1 })
      .eq("id", sesi.id);

    const channel = supabase.channel(channelName(sesi.kode));
    await channel.subscribe();
    channel.send({
      type: "broadcast",
      event: EVENT_NAME,
      payload: { type: "slide_change", slide: 1 },
    });

    router.push(`/presentasi/${sesi.kode}/present/${item.id}`);
  };

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setItems(reordered);
    setDragIndex(null);

    // Persist urutan baru ke DB
    await Promise.all(
      reordered.map((item, idx) =>
        supabase.from("presentasi_items").update({ urutan: idx }).eq("id", item.id)
      )
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link disalin!");
  };

  // --- fungsi untuk modal catatan ---
  const bukaCatatan = async (item: PresentasiItem) => {
    setModalCatatan(item);
    setLoadingCatatan(true);
    const { data } = await supabase
      .from("presentasi_catatan")
      .select("id, slide, isi, created_at")
      .eq("item_id", item.id)
      .order("slide", { ascending: true })
      .order("created_at", { ascending: true });
    setDaftarCatatan(data || []);
    setLoadingCatatan(false);
  };

  const tutupCatatan = () => {
    setModalCatatan(null);
    setDaftarCatatan([]);
  };

  const hapusCatatan = async (id: string) => {
    await supabase.from("presentasi_catatan").delete().eq("id", id);
    setDaftarCatatan((prev) => prev.filter((c) => c.id !== id));
  };

  if (!sesi) {
    return (
      <div className="w-full min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a]">
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          <p className="text-slate-400 font-medium text-sm">
            Sesi dengan kode "{kode}" tidak ditemukan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f7f7fb] dark:bg-[#0a0a0a]">
      <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32">
        <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {sesi.nama_sesi}
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-1">
              Kode sesi:{" "}
              <span className="font-black tracking-widest text-slate-600 dark:text-slate-300">
                {sesi.kode}
              </span>
            </p>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 shrink-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-100 text-xs font-black uppercase tracking-widest px-4 py-3 rounded-2xl shadow-sm active:scale-95 transition-all"
          >
            <Copy size={16} /> Salin link
          </button>
        </div>

        {/* Form upload */}
        <form
          onSubmit={handleUpload}
          className="bg-white dark:bg-[#141414] p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-white/10 mb-10 flex flex-col md:flex-row gap-4 items-stretch md:items-end"
        >
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-400 mb-1 block">
              Nama kelompok
            </label>
            <input
              type="text"
              value={namaKelompok}
              onChange={(e) => setNamaKelompok(e.target.value)}
              className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Kelompok 1"
              required
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-400 mb-1 block">
              File PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-500/10 dark:file:text-indigo-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest px-6 py-3.5 rounded-2xl shadow-md disabled:opacity-50 active:scale-95 transition-all"
          >
            <Upload size={16} /> {uploading ? "Mengupload..." : "Upload"}
          </button>
        </form>

        {items.length === 0 ? (
          <p className="text-slate-400 font-medium text-sm text-center py-16">
            Belum ada kelompok yang upload. Jadi yang pertama!
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className="bg-white dark:bg-[#141414] rounded-[24px] shadow-sm border border-slate-100 dark:border-white/10 overflow-hidden cursor-move"
              >
                <div className="aspect-video bg-slate-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.nama_kelompok}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-300 dark:text-white/20 text-sm">
                      Tanpa preview
                    </span>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical
                      size={16}
                      className="text-slate-300 dark:text-white/20 shrink-0"
                    />
                    <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {item.nama_kelompok}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => bukaCatatan(item)}
                      className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-100 text-xs font-black uppercase tracking-wide px-3 py-2 rounded-xl active:scale-95 transition-all"
                    >
                      <NotebookPen size={14} /> Catatan
                    </button>
                    <button
                      onClick={() => handleMulai(item)}
                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wide px-3 py-2 rounded-xl active:scale-95 transition-all"
                    >
                      <Play size={14} /> Mulai
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal catatan kritik per kelompok */}
        {modalCatatan && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={tutupCatatan}
          >
            <div
              className="bg-white dark:bg-[#141414] rounded-[24px] max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 border border-slate-100 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-black text-lg text-slate-900 dark:text-white mb-1">
                {modalCatatan.nama_kelompok}
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Catatan kritik dari audiens
              </p>

              {loadingCatatan ? (
                <p className="text-slate-400 text-sm">Memuat...</p>
              ) : daftarCatatan.length === 0 ? (
                <p className="text-slate-400 text-sm">Belum ada catatan.</p>
              ) : (
                <div className="space-y-3">
                  {daftarCatatan.map((c) => (
                    <div
                      key={c.id}
                      className="border border-slate-200 dark:border-white/10 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          Slide {c.slide}
                        </span>
                        <button
                          onClick={() => hapusCatatan(c.id)}
                          className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {c.isi}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={tutupCatatan}
                className="mt-5 w-full py-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}