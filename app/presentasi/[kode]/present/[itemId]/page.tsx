"use client";

import React, { useState, useEffect, useRef, use, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { loadPdf, renderPageToCanvas } from "@/lib/pdfRender";
import { channelName, EVENT_NAME, PresentasiEvent } from "@/lib/presentasiChannel";
import { ChevronLeft, ChevronRight, X, Maximize, Minimize } from "lucide-react";

export default function ModePresentasi({
  params,
}: {
  params: Promise<{ kode: string; itemId: string }>;
}) {
  const { kode, itemId } = use(params);
  const supabase = createClient();
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [slide, setSlide] = useState(1);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQrBig, setShowQrBig] = useState(false);
  const [namaSesi, setNamaSesi] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToSlide = useCallback(
    async (n: number, broadcast = true) => {
      if (!pdfRef.current) return;
      const clamped = Math.min(Math.max(n, 1), totalPages);
      setSlide(clamped);
      if (canvasRef.current) {
        await renderPageToCanvas(pdfRef.current, clamped, canvasRef.current, 2);
      }
      await supabase
        .from("sesi_presentasi")
        .update({ current_slide: clamped })
        .eq("kode", kode.toUpperCase());

      if (broadcast) {
        channelRef.current?.send({
          type: "broadcast",
          event: EVENT_NAME,
          payload: { type: "slide_change", slide: clamped },
        });
      }
    },
    [totalPages, kode]
  );

  const channelRef = useRef<any>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Tampilkan kontrol sementara, lalu auto-hide lagi kalau sedang fullscreen dan idle
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) {
        showControlsTemporarily();
      } else {
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [showControlsTemporarily]);

  // Deteksi gerakan mouse / sentuhan untuk memunculkan kontrol lagi saat fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleActivity = () => showControlsTemporarily();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isFullscreen, showControlsTemporarily]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: sesi } = await supabase
        .from("sesi_presentasi")
        .select("nama_sesi")
        .eq("kode", kode.toUpperCase())
        .maybeSingle();
      if (sesi && mounted) {
        setNamaSesi(sesi.nama_sesi);
      }

      const { data: item } = await supabase
        .from("presentasi_items")
        .select("file_url")
        .eq("id", itemId)
        .maybeSingle();
      if (!item || !mounted) return;

      const pdf = await loadPdf(item.file_url);
      pdfRef.current = pdf;
      setTotalPages(pdf.numPages);
      if (canvasRef.current) {
        await renderPageToCanvas(pdf, 1, canvasRef.current, 2);
      }

      const url = `${window.location.origin}/presentasi/remote/${kode}/${itemId}`;
      setQrDataUrl(await QRCode.toDataURL(url, { margin: 1, width: 220 }));
    })();

    const channel = supabase.channel(channelName(kode));
    channelRef.current = channel;

    channel
      .on("broadcast", { event: EVENT_NAME }, ({ payload }) => {
        const ev = payload as PresentasiEvent;
        if (ev.type === "join") {
          channel.send({
            type: "broadcast",
            event: EVENT_NAME,
            payload: { type: "state_sync", slide, totalPages },
          });
        } else if (ev.type === "nav") {
          goToSlide(slide + ev.direction);
        } else if (ev.type === "pointer_move") {
          setPointer({ x: ev.x, y: ev.y });
        } else if (ev.type === "pointer_hide") {
          setPointer(null);
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kode, itemId]);

  const handleSelesai = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.().catch(() => {});
    }
    await supabase
      .from("sesi_presentasi")
      .update({ active_item_id: null })
      .eq("kode", kode.toUpperCase());
    channelRef.current?.send({
      type: "broadcast",
      event: EVENT_NAME,
      payload: { type: "presentation_end" },
    });
    router.push(`/presentasi/${kode}`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToSlide(slide + 1);
      if (e.key === "ArrowLeft") goToSlide(slide - 1);
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "Escape" && !document.fullscreenElement) handleSelesai();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, totalPages]);

  const hideUi = isFullscreen && !controlsVisible;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Bar atas: nama sesi + tombol fullscreen */}
      <div
        className={`bg-[#2b2b2b] text-white px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 transition-all duration-300 ${
          hideUi ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"
        }`}
      >
        <span className="font-semibold text-sm sm:text-base truncate">
          {namaSesi || "Sesi Presentasi"}
        </span>
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white shrink-0 ml-3"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          <span className="hidden sm:inline">
            {isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          </span>
        </button>
      </div>

      {/* Area slide */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="max-h-full max-w-full shadow-2xl" />
        {pointer && (
          <div
            className="absolute w-5 h-5 rounded-full bg-red-500/70 border-2 border-red-600 pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pointer.x * 100}%`, top: `${pointer.y * 100}%` }}
          />
        )}

        {/* Kontrol bawah */}
        <div
          className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-white/90 rounded-full px-3 sm:px-5 py-2 sm:py-3 shadow-xl max-w-[95vw] transition-all duration-300 ${
            hideUi ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
          }`}
        >
          <button
            onClick={() => goToSlide(slide - 1)}
            disabled={slide <= 1}
            className="p-2 text-slate-800 disabled:text-slate-300"
          >
            <ChevronLeft />
          </button>
          <span className="text-xs sm:text-sm font-bold min-w-[50px] sm:min-w-[60px] text-center text-slate-800">
            {slide} / {totalPages}
          </span>
          <button
            onClick={() => goToSlide(slide + 1)}
            disabled={slide >= totalPages}
            className="p-2 text-slate-800 disabled:text-slate-300"
          >
            <ChevronRight />
          </button>
          <button
            onClick={handleSelesai}
            className="flex items-center gap-1 text-red-600 font-bold text-xs sm:text-sm ml-1 sm:ml-2 whitespace-nowrap"
          >
            <X size={16} /> <span className="hidden sm:inline">Selesai</span>
          </button>
        </div>

        {/* QR code pojok kanan atas area slide */}
        {qrDataUrl && (
          <button
            onClick={() => setShowQrBig((v) => !v)}
            className={`absolute top-4 sm:top-6 right-4 sm:right-6 bg-white rounded-2xl p-2 shadow-xl z-10 transition-all duration-300 ${
              hideUi ? "opacity-0 -translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"
            }`}
          >
            <img
              src={qrDataUrl}
              alt="Scan untuk remote"
              className={showQrBig ? "w-40 h-40 sm:w-64 sm:h-64" : "w-14 h-14 sm:w-20 sm:h-20"}
            />
            <p className="text-[9px] sm:text-[10px] text-center text-slate-500 mt-1">
              Scan buat remote
            </p>
          </button>
        )}
      </div>
    </div>
  );
}