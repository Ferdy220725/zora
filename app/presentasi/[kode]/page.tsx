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
      alert("Gagal upload: " + err.message);
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
      <div className="p-8 max-w-3xl mx-auto min-h-screen bg-[#f8f9fa]">
        <p className="text-slate-500">Sesi dengan kode "{kode}" tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-[#f8f9fa] pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-[#800020]">
            {sesi.nama_sesi}
          </h1>
          <p className="text-slate-500">
            Kode sesi: <span className="font-bold tracking-widest">{sesi.kode}</span>
          </p>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-xl"
        >
          <Copy size={16} /> Salin link
        </button>
      </div>

      <form
        onSubmit={handleUpload}
        className="bg-white p-6 rounded-[30px] shadow-xl border border-slate-200 mb-10 flex flex-col md:flex-row gap-4 items-stretch md:items-end"
      >
        <div className="flex-1">
          <label className="text-sm text-slate-500">Nama kelompok</label>
          <input
            type="text"
            value={namaKelompok}
            onChange={(e) => setNamaKelompok(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3"
            placeholder="Kelompok 1"
            required
          />
        </div>
        <div className="flex-1">
          <label className="text-sm text-slate-500">File PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="flex items-center justify-center gap-2 bg-[#800020] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"
        >
          <Upload size={18} /> {uploading ? "Mengupload..." : "Upload"}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-slate-400 text-center py-16">
          Belum ada kelompok yang upload. Jadi yang pertama!
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden cursor-move"
            >
              <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.nama_kelompok}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-300 text-sm">Tanpa preview</span>
                )}
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical size={16} className="text-slate-300 shrink-0" />
                  <span className="font-bold truncate">{item.nama_kelompok}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => bukaCatatan(item)}
                    className="flex items-center gap-1 bg-slate-100 text-slate-700 text-sm font-bold px-3 py-2 rounded-xl"
                  >
                    <NotebookPen size={14} /> Catatan
                  </button>
                  <button
                    onClick={() => handleMulai(item)}
                    className="flex items-center gap-1 bg-[#800020] text-white text-sm font-bold px-3 py-2 rounded-xl"
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
            className="bg-white rounded-[24px] max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-black text-lg mb-1">{modalCatatan.nama_kelompok}</h2>
            <p className="text-slate-400 text-sm mb-4">Catatan kritik dari audiens</p>

            {loadingCatatan ? (
              <p className="text-slate-400 text-sm">Memuat...</p>
            ) : daftarCatatan.length === 0 ? (
              <p className="text-slate-400 text-sm">Belum ada catatan.</p>
            ) : (
              <div className="space-y-3">
                {daftarCatatan.map((c) => (
                  <div key={c.id} className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#800020]">
                        Slide {c.slide}
                      </span>
                      <button
                        onClick={() => hapusCatatan(c.id)}
                        className="text-xs text-slate-400 hover:text-red-600"
                      >
                        Hapus
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.isi}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={tutupCatatan}
              className="mt-5 w-full py-3 rounded-xl bg-slate-100 font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}