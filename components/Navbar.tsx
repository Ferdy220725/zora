"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  FileText,
  UserCog,
  Menu,
  X,
  Sprout,
  CalendarDays,
  MonitorPlay,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    setShouldShow(true);
  }, [pathname]);

  if (!shouldShow) return null;

  const menuItems = [
    { id: "m1", name: "Home", href: "/", icon: <LayoutDashboard size={20} /> },
    { id: "m2", name: "Materi", href: "/materi", icon: <BookOpen size={20} /> },
    { id: "m3", name: "Praktikum", href: "/praktikum", icon: <FlaskConical size={20} /> },
    { id: "m_jadwal", name: "Jadwal", href: "/jadwal-sistem/list", icon: <CalendarDays size={20} /> },
    { id: "m_presentasi", name: "Presentasi", href: "/presentasi", icon: <MonitorPlay size={20} /> },
    {
      id: "m_ext",
      name: "Pertanian Perkotaan",
      href: "https://pertanian-perkotaan-c.vercel.app/",
      icon: <Sprout size={20} />,
      isExternal: true,
    },
    { id: "m4", name: "Izin", href: "/perizinan", icon: <FileText size={20} /> },
    { id: "m5", name: "Admin", href: "/admin", icon: <UserCog size={20} /> },
  ];

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      <div
        className={`flex flex-col gap-2 mb-2 transition-all duration-300 transform origin-bottom ${
          isOpen
            ? "scale-100 opacity-100 translate-y-0 pointer-events-auto"
            : "scale-0 opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setIsOpen(false)}
            target={item.isExternal ? "_blank" : undefined}
            rel={item.isExternal ? "noopener noreferrer" : undefined}
            className={`flex items-center justify-end gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border pointer-events-auto ${
              pathname === item.href
                ? "bg-[#800020] text-white border-[#800020]"
                : "bg-white/95 dark:bg-[#1a1a1a]/90 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-white/10"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
            <div className={`p-1 rounded-lg text-inherit ${item.isExternal ? "bg-emerald-50 text-emerald-600" : "bg-slate-50/50 dark:bg-white/5"}`}>
              {item.icon}
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 pointer-events-auto active:scale-90 ${
          isOpen ? "bg-slate-800 rotate-90" : "bg-[#800020] hover:scale-110"
        }`}
      >
        {isOpen ? <X color="white" size={26} /> : <Menu color="white" size={26} />}
      </button>
    </div>
  );
}