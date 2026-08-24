"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { QRCodeSVG } from "qrcode.react";

type Link = {
  id: string;
  short_code: string;
  original_url: string;
  title: string | null;
  created_by: string | null;
  click_count: number;
  created_at: string;
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
};

function generateCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500";

export default function ShortenerClient({
  initialLinks,
  currentUserId,
}: {
  initialLinks: Link[];
  currentUserId: string | null;
}) {
  const supabase = createClient();
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null); // short_code yg lagi dibuka QR-nya
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  function showToast(message: string, type: Toast["type"] = "success") {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("URL wajib diisi");
      return;
    }

    // Validasi format URL dasar
    try {
      new URL(url);
    } catch {
      setError("Format URL tidak valid (harus diawali https:// atau http://)");
      return;
    }

    setLoading(true);

    const shortCode = customAlias.trim() || generateCode();

    const { data, error: insertError } = await supabase
      .from("links")
      .insert({
        short_code: shortCode,
        original_url: url.trim(),
        title: title.trim() || null,
        created_by: currentUserId,
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Alias sudah dipakai, coba yang lain");
      } else {
        setError("Gagal membuat link, coba lagi");
      }
      return;
    }

    setLinks([data, ...links]);
    setUrl("");
    setCustomAlias("");
    setTitle("");
    showToast("Short link berhasil dibuat");
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase.from("links").delete().eq("id", id);
    if (!deleteError) {
      setLinks(links.filter((l) => l.id !== id));
      showToast("Link berhasil dihapus");
    } else {
      showToast("Gagal menghapus link", "error");
    }
  }

  function copyToClipboard(shortCode: string) {
    navigator.clipboard
      .writeText(`${baseUrl}/s/${shortCode}`)
      .then(() => showToast("Link berhasil disalin"))
      .catch(() => showToast("Gagal menyalin link", "error"));
  }

  function toggleQr(shortCode: string) {
    setQrCode((prev) => (prev === shortCode ? null : shortCode));
  }

  function downloadQr(shortCode: string) {
    const svgEl = document.getElementById(`qr-${shortCode}`) as SVGSVGElement | null;
    if (!svgEl) {
      showToast("Gagal mengunduh QR", "error");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const padding = 16;
      const canvas = document.createElement("canvas");
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        showToast("Gagal mengunduh QR", "error");
        URL.revokeObjectURL(svgUrl);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);
      URL.revokeObjectURL(svgUrl);

      canvas.toBlob((blob) => {
        if (!blob) {
          showToast("Gagal mengunduh QR", "error");
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `qr-${shortCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        showToast("QR code berhasil diunduh");
      }, "image/png");
    };
    img.onerror = () => {
      showToast("Gagal mengunduh QR", "error");
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 relative">
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white animate-in fade-in slide-in-from-top-2 ${
              t.type === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <h1 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">
        URL Shortener
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 mb-8 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800"
      >
        <div>
          <label className="text-sm font-medium block mb-1">URL Panjang</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://contoh.com/link-panjang-banget"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Custom Alias (opsional)</label>
          <input
            type="text"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
            placeholder="promo-agustus"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Judul (opsional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Buat catatan biar gampang inget"
            className={inputClass}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Membuat..." : "Buat Short Link"}
        </button>
      </form>

      <div className="space-y-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between p-3">
              <div className="min-w-0 flex-1">
                {link.title && <p className="text-sm font-medium truncate">{link.title}</p>}
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-mono">
                  /s/{link.short_code}
                </p>
                <p className="text-xs text-neutral-500 truncate">{link.original_url}</p>
                <p className="text-xs text-neutral-400">{link.click_count} klik</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-2">
                <button
                  onClick={() => toggleQr(link.short_code)}
                  className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                >
                  QR
                </button>
                <button
                  onClick={() => copyToClipboard(link.short_code)}
                  className="text-xs px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300"
                >
                  Copy
                </button>
                {link.created_by === currentUserId && (
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {qrCode === link.short_code && (
              <div className="flex flex-col items-center gap-2 p-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG
                    id={`qr-${link.short_code}`}
                    value={`${baseUrl}/s/${link.short_code}`}
                    size={160}
                  />
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  {baseUrl}/s/{link.short_code}
                </p>
                <button
                  onClick={() => downloadQr(link.short_code)}
                  className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                >
                  Download QR
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}