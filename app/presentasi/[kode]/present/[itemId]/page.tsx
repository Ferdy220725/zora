"use client";

import React, { useState, useEffect, useRef, use, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { loadPdf, renderPageToCanvas } from "@/lib/pdfRender";
import { channelName, EVENT_NAME, PresentasiEvent } from "@/lib/presentasiChannel";
import { ChevronLeft, ChevronRight, X, Maximize, Minimize, QrCode } from "lucide-react";

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
  const [showQrOverlay, setShowQrOverlay] = useState(false);
  const [namaSesi, setNamaSesi] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [blank, setBlank] = useState(false);
  const [zoom, setZoom] = useState(1); // skala zoom slide, dikontrol dari remote
  const [panX, setPanX] = useState(0); // geser horizontal (fraksi -1..1), dikontrol dari remote
  const [panY, setPanY] = useState(0); // geser vertikal (fraksi -1..1), dikontrol dari remote

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<any>(null);

  // Refs supaya handler broadcast selalu baca nilai TERBARU, bukan nilai "beku" dari mount pertama
  const slideRef = useRef(slide);
  const totalPagesRef = useRef(totalPages);
  const blankRef = useRef(blank);
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);

  useEffect(() => {
    slideRef.current = slide;
  }, [slide]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);

  useEffect(() => {
    blankRef.current = blank;
  }, [blank]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panXRef.current = panX;
  }, [panX]);

  useEffect(() => {
    panYRef.current = panY;
  }, [panY]);

  const goToSlide = useCallback(
    async (n: number, broadcast = true) => {
      if (!pdfRef.current) return;
      const clamped = Math.min(Math.max(n, 1), totalPagesRef.current);
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

      // Reset zoom & pan tiap pindah slide, biar ga kebawa zoom ke slide berikutnya
      setZoom(1);
      setPanX(0);
      setPanY(0);
    },
    [kode]
  );

  const goToSlideRef = useRef(goToSlide);
  useEffect(() => {
    goToSlideRef.current = goToSlide;
  }, [goToSlide]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

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
        // Langsung sembunyikan navbar begitu masuk fullscreen, tanpa nongol dulu.
        // Baru muncul lagi kalau ada gerakan/klik (lihat handleActivity di bawah).
        setControlsVisible(false);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      } else {
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [showControlsTemporarily]);

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
      totalPagesRef.current = pdf.numPages; // langsung update ref juga, tidak nunggu re-render
      if (canvasRef.current) {
        await renderPageToCanvas(pdf, 1, canvasRef.current, 2);
      }

      const url = `${window.location.origin}/presentasi/remote/${kode}/${itemId}`;
      setQrDataUrl(await QRCode.toDataURL(url, { margin: 1, width: 400 }));
    })();

    const channel = supabase.channel(channelName(kode));
    channelRef.current = channel;

    channel
      .on("broadcast", { event: EVENT_NAME }, ({ payload }) => {
        const ev = payload as PresentasiEvent;
        if (ev.type === "join") {
          // Selalu pakai nilai TERBARU dari ref, bukan closure lama
          channel.send({
            type: "broadcast",
            event: EVENT_NAME,
            payload: {
              type: "state_sync",
              slide: slideRef.current,
              totalPages: totalPagesRef.current,
              blank: blankRef.current,
              zoom: zoomRef.current,
              panX: panXRef.current,
              panY: panYRef.current,
            },
          });
        } else if (ev.type === "nav") {
          goToSlideRef.current(slideRef.current + ev.direction);
        } else if (ev.type === "goto") {
          goToSlideRef.current(ev.slide);
        } else if (ev.type === "pointer_move") {
          setPointer({ x: ev.x, y: ev.y });
        } else if (ev.type === "pointer_hide") {
          setPointer(null);
        } else if (ev.type === "blank") {
          setBlank(ev.on);
        } else if (ev.type === "zoom") {
          setZoom(ev.scale);
          if (typeof ev.panX === "number") setPanX(ev.panX);
          if (typeof ev.panY === "number") setPanY(ev.panY);
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
      if (e.key === "Escape") {
        if (showQrOverlay) {
          setShowQrOverlay(false);
        } else if (!document.fullscreenElement) {
          handleSelesai();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, totalPages, showQrOverlay]);

  const hideUi = isFullscreen && !controlsVisible;

  return (
    <div className="fixed inset-0 bg-black">
      {/* Overlay Blank Screen — nutup total tampilan slide, mirip mode "B" di PowerPoint */}
      {blank && <div className="fixed inset-0 bg-black z-40" />}

      {/* Area slide — SELALU full height & width, tidak dipengaruhi bar atas */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full shadow-2xl"
          style={{
            transform: `scale(${zoom}) translate(${panX * 100}%, ${panY * 100}%)`,
            transformOrigin: "center center",
            transition: "transform 0.1s ease-out",
          }}
        />

        {pointer && (
          <div
            className="absolute w-5 h-5 rounded-full bg-red-500/70 border-2 border-red-600 pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pointer.x * 100}%`, top: `${pointer.y * 100}%` }}
          />
        )}

        {/* Bar atas: nama sesi + tombol QR + tombol fullscreen, melayang di atas slide */}
        <div
          className={`absolute top-0 left-0 right-0 bg-[#2b2b2b]/95 backdrop-blur text-white px-4 sm:px-6 py-3 flex items-center justify-between z-20 transition-all duration-300 ${
            hideUi ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"
          }`}
        >
          <span className="font-semibold text-sm sm:text-base truncate">
            {namaSesi || "Sesi Presentasi"}
          </span>

          <div className="flex items-center gap-4 sm:gap-5 shrink-0 ml-3">
            {qrDataUrl && (
              <button
                onClick={() => setShowQrOverlay(true)}
                className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white"
              >
                <QrCode size={16} />
                <span className="hidden sm:inline">Tampilkan QR</span>
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              <span className="hidden sm:inline">
                {isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
              </span>
            </button>
          </div>
        </div>

        {/* Kontrol bawah */}
        <div
          className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-white/90 rounded-full px-3 sm:px-5 py-2 sm:py-3 shadow-xl max-w-[95vw] z-20 transition-all duration-300 ${
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
      </div>

      {/* Overlay QR besar — muncul saat tombol "Tampilkan QR" diklik */}
      {showQrOverlay && qrDataUrl && (
        <div
          className="fixed inset-0 z-30 bg-black/85 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowQrOverlay(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-4 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={qrDataUrl}
              alt="Scan untuk remote"
              className="w-64 h-64 sm:w-96 sm:h-96 object-contain"
            />
            <p className="text-sm sm:text-base text-slate-600 font-medium text-center">
              Scan QR ini untuk jadi remote presentasi
            </p>
            <button
              onClick={() => setShowQrOverlay(false)}
              className="flex items-center gap-2 bg-[#800020] text-white font-bold text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition"
            >
              <X size={16} /> Tutup QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}