"use client";

import Link from "next/link";
import Image from "next/image";
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
  User,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const menuItems = [
  { id: "m1", name: "Home", href: "/", icon: LayoutDashboard },
  { id: "m_absensi", name: "Absensi", href: "/absensi", icon: ClipboardCheck },
  { id: "m2", name: "Materi", href: "/materi", icon: BookOpen },
  { id: "m_zora_ai", name: "ZORA AI", href: "/zora-ai", icon: null },
  { id: "m3", name: "Praktikum", href: "/praktikum", icon: FlaskConical },
  { id: "m_jadwal", name: "Jadwal", href: "/jadwal-sistem/list", icon: CalendarDays },
  { id: "m_presentasi", name: "Presentasi", href: "/presentasi", icon: MonitorPlay },
  { id: "m4", name: "Izin", href: "/perizinan", icon: FileText },
  { id: "m_acak", name: "Acak Kelompok", href: "/acak-kelompok", icon: Shuffle },
  { id: "m_akun", name: "Akun Saya", href: "/akun", icon: User },
  { id: "m_tentang", name: "Tentang", href: "/tentang", icon: Info },
  { id: "m5", name: "Admin", href: "/admin", icon: UserCog },
];

// Halaman-halaman yang sudah punya bottom bar sendiri —
// floating menu ini disembunyikan di sini supaya tidak tabrakan
const HIDDEN_ON = ["/zora-ai"];

export default function Navbar() {
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setShouldShow(true), []);
  useEffect(() => setOpen(false), [pathname]);

  if (!shouldShow) return null;

  const isHidden = HIDDEN_ON.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  if (isHidden) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex justify-end pointer-events-none">
      <div
        className="pointer-events-auto inline-flex items-center rounded-full backdrop-blur-xl border border-white/25 shadow-2xl overflow-hidden"
        style={{ backgroundColor: "rgba(128,0,32,0.85)" }}
      >
        <div
          className="flex items-center gap-1 overflow-x-auto no-scrollbar snap-x snap-mandatory"
          style={{
            maxWidth: open ? "calc(100vw - 104px)" : "0px",
            paddingLeft: open ? 6 : 0,
            paddingRight: open ? 4 : 0,
            transition: "max-width 380ms cubic-bezier(0.32,0.72,0,1), padding 380ms ease",
            scrollbarWidth: "none",
          }}
        >
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative shrink-0 w-11 h-11 flex items-center justify-center rounded-full snap-center active:scale-90"
                style={{
                  backgroundColor: active ? "#ffffff" : "transparent",
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0) scale(1)" : "translateY(6px) scale(0.7)",
                  transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
                  transitionDelay: open ? `${idx * 35 + 80}ms` : "0ms",
                }}
              >
                {item.id === "m_zora_ai" ? (
                  <Image
                    src="/icons/zora-mark.png"
                    alt="ZORA AI"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                ) : (
                  Icon && (
                    <Icon
                      size={19}
                      color={active ? "#800020" : "rgba(255,255,255,0.9)"}
                      strokeWidth={2}
                    />
                  )
                )}
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <div className="relative w-6 h-6">
            <Menu
              size={24}
              color="#ffffff"
              strokeWidth={2}
              className="absolute inset-0 transition-all duration-300"
              style={{
                opacity: open ? 0 : 1,
                transform: open ? "rotate(90deg) scale(0.6)" : "rotate(0deg) scale(1)",
              }}
            />
            <X
              size={24}
              color="#ffffff"
              strokeWidth={2}
              className="absolute inset-0 transition-all duration-300"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.6)",
              }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
