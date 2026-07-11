"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  FileText,
  UserCog,
  CalendarDays,
  MonitorPlay,
  Info,
  Shuffle,
  ClipboardCheck,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const mainItems = [
  { id: "m1", name: "Home", href: "/", icon: LayoutDashboard },
  { id: "m_absensi", name: "Absensi", href: "/absensi", icon: ClipboardCheck },
  { id: "m2", name: "Materi", href: "/materi", icon: BookOpen },
  { id: "m3", name: "Praktikum", href: "/praktikum", icon: FlaskConical },
];

const otherItems = [
  { id: "m_jadwal", name: "Jadwal", href: "/jadwal-sistem/list", icon: CalendarDays },
  { id: "m_presentasi", name: "Presentasi", href: "/presentasi", icon: MonitorPlay },
  { id: "m4", name: "Izin", href: "/perizinan", icon: FileText },
  { id: "m_acak", name: "Acak Kelompok", href: "/acak-kelompok", icon: Shuffle },
  { id: "m_tentang", name: "Tentang", href: "/tentang", icon: Info },
  { id: "m5", name: "Admin", href: "/admin", icon: UserCog },
];

const HIDE_DELAY = 3000; // ms tanpa sentuhan sebelum navbar ngumpet

export default function Navbar() {
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [barVisible, setBarVisible] = useState(true);

  const barRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setShouldShow(true), []);
  useEffect(() => setSheetOpen(false), [pathname]);

  // reset & mulai ulang timer auto-hide
  const wakeUp = () => {
    setBarVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!sheetOpen) setBarVisible(false);
    }, HIDE_DELAY);
  };

  // nyalain timer pas mount & tiap pindah halaman
  useEffect(() => {
    wakeUp();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  // kalau sheet lagi kebuka, jangan biarkan bar ngumpet
  useEffect(() => {
    if (sheetOpen) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setBarVisible(true);
    } else {
      wakeUp();
    }
  }, [sheetOpen]);

  const isOtherActive = otherItems.some((i) => i.href === pathname);
  const activeIndex = isOtherActive
    ? mainItems.length
    : mainItems.findIndex((i) => i.href === pathname);

  const measurePill = () => {
    const bar = barRef.current;
    const btn = btnRefs.current[activeIndex];
    if (!bar || !btn) return;
    const barRect = bar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPillStyle({ left: btnRect.left - barRect.left, width: btnRect.width });
  };

  useEffect(() => {
    const raf = requestAnimationFrame(measurePill);
    window.addEventListener("resize", measurePill);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measurePill);
    };
  }, [pathname, sheetOpen]);

  if (!shouldShow) return null;

  return (
    <>
      {/* Backdrop panel "Lainnya" */}
      <div
        onClick={() => setSheetOpen(false)}
        className={`fixed inset-0 z-[9997] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          sheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel "Lainnya" */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[9999] transition-transform duration-400 ease-out ${
          sheetOpen ? "translate-y-0" : "translate-y-[120%]"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
      >
        <div
          className="mx-auto max-w-md rounded-t-[28px] backdrop-blur-xl border-t border-white/25 px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.3)]"
          style={{ backgroundColor: "rgba(128,0,32,0.95)" }}
        >
          <div className="w-10 h-1.5 rounded-full bg-white/30 mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-white/90">Menu lainnya</span>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 active:scale-90 transition-transform"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 pb-2">
            {otherItems.map((item, idx) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all active:scale-95 ${
                    active ? "bg-white" : "bg-white/10"
                  } ${sheetOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                  style={{
                    transitionProperty: "opacity, transform",
                    transitionDuration: "350ms",
                    transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
                    transitionDelay: sheetOpen ? `${idx * 45 + 100}ms` : "0ms",
                  }}
                >
                  <Icon size={20} color={active ? "#800020" : "#ffffff"} />
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide text-center leading-tight"
                    style={{ color: active ? "#800020" : "rgba(255,255,255,0.85)" }}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zona sentuh tipis di paling bawah layar - buat manggil balik navbar pas lagi ngumpet */}
      <div
        onPointerDown={wakeUp}
        onTouchStart={wakeUp}
        className="fixed inset-x-0 bottom-0 z-[9996] h-6"
        style={{ pointerEvents: !barVisible && !sheetOpen ? "auto" : "none" }}
      />

      {/* Bar utama */}
      <div
        onPointerDown={wakeUp}
        onTouchStart={wakeUp}
        className="fixed bottom-4 left-0 right-0 z-[9998] flex justify-center px-4 transition-all duration-400 ease-out"
        style={{
          opacity: sheetOpen ? 0 : barVisible ? 1 : 0,
          transform:
            sheetOpen || !barVisible
              ? "translateY(48px) scale(0.94)"
              : "translateY(0) scale(1)",
          pointerEvents: sheetOpen || !barVisible ? "none" : "auto",
        }}
      >
        <div
          ref={barRef}
          className="relative flex items-center gap-1 px-2 py-2 rounded-[24px] backdrop-blur-xl border border-white/25 shadow-2xl"
          style={{ backgroundColor: "rgba(128,0,32,0.8)" }}
        >
          <div
            className="absolute top-2 h-[42px] rounded-[16px] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition-all duration-350 ease-out"
            style={{
              left: pillStyle.left,
              width: pillStyle.width,
              transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />

          {mainItems.map((item, i) => {
            const Icon = item.icon;
            const active = activeIndex === i;
            return (
              <Link
                key={item.id}
                href={item.href}
                ref={(el) => {
                  btnRefs.current[i] = el;
                }}
                className="relative z-10 w-[42px] h-[42px] flex items-center justify-center rounded-2xl active:scale-90 transition-transform"
              >
                <Icon size={19} color={active ? "#800020" : "rgba(255,255,255,0.85)"} strokeWidth={2} />
              </Link>
            );
          })}

          <button
            ref={(el) => {
              btnRefs.current[mainItems.length] = el;
            }}
            onClick={() => setSheetOpen(true)}
            className="relative z-10 w-[42px] h-[42px] flex items-center justify-center rounded-2xl active:scale-90 transition-transform"
          >
            <MoreHorizontal
              size={19}
              color={activeIndex === mainItems.length ? "#800020" : "rgba(255,255,255,0.85)"}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>
    </>
  );
}