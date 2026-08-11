"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AsistenZoraSwitch from "@/components/AsistenZoraSwitch";
import AsistenZoraTabButton from "@/components/AsistenZoraTabButton";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  BookOpen,
  FlaskConical,
  Users,
  MonitorPlay,
  CalendarDays,
  Sparkles,
  Megaphone,
  ClipboardList,
  Settings,
  HelpCircle,
  GraduationCap,
  Landmark,
  School,
  Menu,
  X,
  User,
  QrCode,
} from "lucide-react";

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  badge?: string;
  external?: boolean;
}

const mainNavItems: NavItem[] = [
  { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "absensi", name: "Absensi", href: "/absensi", icon: <ClipboardCheck size={20} /> },
  { id: "perizinan", name: "Perizinan", href: "/perizinan", icon: <FileText size={20} /> },
  { id: "materi", name: "Materi", href: "/materi", icon: <BookOpen size={20} /> },
  { id: "praktikum", name: "Tugas Praktikum", href: "/praktikum", icon: <FlaskConical size={20} /> },
  { id: "kelompok", name: "Bagi Kelompok", href: "/acak-kelompok", icon: <Users size={20} /> },
  { id: "presentasi", name: "Presentasi", href: "/presentasi", icon: <MonitorPlay size={20} />, badge: "QR" },
  { id: "kalender", name: "Kalender Akademik", href: "/jadwal-sistem/list", icon: <CalendarDays size={20} /> },
  { id: "zora-ai", name: "Zora AI", href: "/zora-ai", icon: <Sparkles size={20} />, comingSoon: true },
  { id: "pengumuman", name: "Pengumuman", href: "/pengumuman", icon: <Megaphone size={20} /> },
  { id: "laporan", name: "Laporan", href: "/laporan", icon: <ClipboardList size={20} /> },
  { id: "profil", name: "Profil", href: "/akun-saya", icon: <User size={22} /> },
  {
    id: "khs",
    name: "KHS",
    href: "https://registrasi.upnjatim.ac.id/lp3m/html/lp3m/loginKHS.asp",
    icon: <GraduationCap size={20} />,
    external: true,
  },
  {
    id: "skpm",
    name: "SKPM Online",
    href: "https://skpm.upnjatim.ac.id/dashboard",
    icon: <Landmark size={20} />,
    external: true,
  },
];

const footerNavItems: NavItem[] = [
  { id: "settings", name: "Admin", href: "/admin", icon: <Settings size={20} /> },
  { id: "bantuan", name: "Bantuan & Tentang", href: "/tentang", icon: <HelpCircle size={20} /> },
  {
    id: "eksternal",
    name: "SIAMIK",
    href: "https://siamik.upnjatim.ac.id/html/siamik/index.asp",
    icon: <School size={20} />,
    external: true,
  },
];

// 5 item utama buat bottom tab bar mobile (Pengumuman selalu di tengah)
const mobileTabItems: NavItem[] = [
  { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={22} /> },
  { id: "kalender", name: "Kalender", href: "/jadwal-sistem/list", icon: <CalendarDays size={22} /> },
  { id: "pengumuman", name: "Pengumuman", href: "/pengumuman", icon: <Megaphone size={24} /> },
  { id: "asisten-zora", name: "Asisten", href: "", icon: <Sparkles size={22} /> },
  { id: "profil", name: "Profil", href: "/akun-saya", icon: <User size={22} /> },
];

// Halaman-halaman yang butuh tampilan full-screen sendiri (mode presentasi & remote audiens),
// jadi navbar (header atas + bottom tab bar) harus disembunyikan total di sini,
// bukan cuma saat browser Fullscreen API aktif.
const FULLSCREEN_ROUTE_PREFIXES = [
  "/presentasi/remote/", // halaman remote/laser-pointer buat audiens
];

function isFullscreenRoute(pathname: string) {
  // Route /presentasi/[kode]/present/[itemId] juga harus full-screen (mode presenter),
  // tapi /presentasi/[kode] (lobby) dan /presentasi (home) TIDAK termasuk.
  if (/^\/presentasi\/[^/]+\/present\//.test(pathname)) return true;
  return FULLSCREEN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function Navbar() {
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setShouldShow(true);
  }, [pathname]);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Sembunyikan navbar SEPENUHNYA saat browser dalam mode fullscreen
  // (misalnya saat mode presentasi layar penuh sedang aktif)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsElement =
        document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(!!fsElement);
      if (fsElement) setIsDrawerOpen(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Sembunyikan juga (tanpa perlu browser Fullscreen API) di halaman-halaman
  // yang memang didesain full-screen sendiri, misal remote presentasi di HP
  if (!shouldShow || isFullscreen || isFullscreenRoute(pathname)) return null;

  const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.comingSoon) {
      e.preventDefault();
      toast.info(`${item.name} segera hadir 🚧`, {
        description: "Fitur ini masih dalam pengembangan.",
      });
    }
  };

  const isActive = (href: string) => pathname === href;

  const renderNavLink = (item: NavItem, variant: "sidebar" | "drawer") => (
    <Link
      key={item.id}
      href={item.href}
      onClick={(e) => handleItemClick(item, e)}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      className={`group flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isActive(item.href)
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
          : "text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-white/5 hover:text-indigo-700 dark:hover:text-white"
      } ${item.comingSoon ? "opacity-60" : ""}`}
    >
      <span className="flex items-center gap-3">
        <span className={isActive(item.href) ? "text-white" : "text-indigo-500 dark:text-indigo-400"}>
          {item.icon}
        </span>
        {item.name}
      </span>
      {item.badge && (
        <span
          className={`flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
            isActive(item.href) ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
          }`}
        >
          <QrCode size={11} /> {item.badge}
        </span>
      )}
      {item.comingSoon && (
        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400">
          Segera
        </span>
      )}
    </Link>
  );

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:z-50 bg-white dark:bg-[#0d0d0d] border-r border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2 px-5 h-20 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img src="/logo-zora.png" alt="Zora" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            ZORA
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {mainNavItems.map((item) => renderNavLink(item, "sidebar"))}
        </nav>

        <div className="px-3 pb-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 text-white mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <p className="text-xs font-black uppercase tracking-wide">Asisten Zora</p>
              </div>
              <AsistenZoraSwitch />
            </div>
            <p className="text-[11px] text-indigo-100 leading-relaxed">
              Sapaan otomatis + jadwal, tugas, dan agenda kamu tiap buka Zora.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-white/10">
            {footerNavItems.map((item) => renderNavLink(item, "sidebar"))}
          </div>
        </div>
      </aside>

      {/* ================= MOBILE TOP HEADER ================= */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-16 bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200"
            aria-label="Buka menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img src="/logo-zora.png" alt="Zora" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">ZORA</span>
          </div>
        </div>
      </header>

      {/* ================= MOBILE DRAWER (full menu) ================= */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-[78%] max-w-xs h-full bg-white dark:bg-[#0d0d0d] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img src="/logo-zora.png" alt="Zora" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-lg text-slate-900 dark:text-white">ZORA</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {mainNavItems.map((item) => renderNavLink(item, "drawer"))}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/10 space-y-1">
                {footerNavItems.map((item) => renderNavLink(item, "drawer"))}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* ================= MOBILE BOTTOM TAB BAR ================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-[68px] bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 flex items-center justify-around px-2">
        {mobileTabItems.map((item) =>
          item.id === "pengumuman" ? (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleItemClick(item, e)}
              className="-mt-7 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/40 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              {item.icon}
            </Link>
          ) : item.id === "asisten-zora" ? (
            <AsistenZoraTabButton key={item.id} />
          ) : (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleItemClick(item, e)}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-bold ${
                isActive(item.href) ? "text-indigo-600" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          )
        )}
      </nav>
    </>
  );
}