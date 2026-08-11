"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAsistenZora } from "@/lib/asisten-zora-context";
import { getModeWaktu } from "@/lib/waktu";
import AsistenZora, {
  AsistenJadwalItem,
  AsistenTugasItem,
  AsistenAgendaItem,
} from "@/components/AsistenZora";

const EXCLUDED_ROUTES = ["/login", "/register", "/forgot-password"];

export default function AsistenZoraOverlay() {
  const pathname = usePathname();
  const { aktif, loaded } = useAsistenZora();
  const supabase = createClient();

  const [visible, setVisible] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [namaUser, setNamaUser] = useState("Teman ZORA😉");
  const [isDayWindow, setIsDayWindow] = useState(true);
  const [jadwal, setJadwal] = useState<AsistenJadwalItem[]>([]);
  const [tugas, setTugas] = useState<AsistenTugasItem[]>([]);
  const [agenda, setAgenda] = useState<AsistenAgendaItem[]>([]);

  const hasAttemptedRef = useRef(false);

  const fetchJadwalUntukTanggal = async (
    kelasIdParam: string,
    tanggalStr: string,
    hariIndex: number
  ) => {
    const { data: dTemplate } = await supabase
      .from("jadwal_template")
      .select("*")
      .eq("kelas_id", kelasIdParam)
      .eq("is_active", true)
      .eq("hari", hariIndex);

    const { data: dPengecualian } = await supabase
      .from("jadwal_kuliah")
      .select("*")
      .eq("kelas_id", kelasIdParam)
      .eq("day", tanggalStr);

    const liburEntry = dPengecualian?.find((p: any) => p.tipe === "libur");
    if (liburEntry) return [];

    const gantiEntries = dPengecualian?.filter((p: any) => p.tipe === "ganti") || [];
    const tambahanEntries = dPengecualian?.filter((p: any) => p.tipe === "tambahan") || [];

    const basis =
      gantiEntries.length > 0
        ? gantiEntries.map((p: any) => ({
            id: p.id,
            subject: p.subject || "-",
            time: p.time || "-",
            room: p.room || "-",
          }))
        : (dTemplate || []).map((t: any) => ({
            id: t.id,
            subject: t.subject,
            time: t.time,
            room: t.room || "-",
          }));

    const tambahan = tambahanEntries.map((p: any) => ({
      id: p.id,
      subject: p.subject || "-",
      time: p.time || "-",
      room: p.room || "-",
    }));

    return [...basis, ...tambahan].sort((a, b) => a.time.localeCompare(b.time));
  };

  useEffect(() => {
    if (hasAttemptedRef.current) return;
    if (!loaded) return;
    if (!aktif) return;
    if (EXCLUDED_ROUTES.includes(pathname)) return;

    const todayKey = `asisten-zora-seen-${new Date().toISOString().slice(0, 10)}`;
    if (typeof window === "undefined" || sessionStorage.getItem(todayKey)) return;

    hasAttemptedRef.current = true;

    const jalankan = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const savedName = localStorage.getItem("nama_user_solaria") || "Teman ZORA😉";
      setNamaUser(savedName.trim().split(" ")[0]);

      const { data: profile } = await supabase
        .from("profiles")
        .select("kelas_id")
        .eq("id", user.id)
        .maybeSingle();

      const kelasId = profile?.kelas_id ?? null;

      const [{ data: teoriData }, { data: praktikumData }, { data: buktiData }] = await Promise.all([
        supabase.from("tugas_perkuliahan").select("*").order("deadline", { ascending: true }),
        supabase.from("tugas_praktikum").select("*").order("deadline", { ascending: true }),
        supabase.from("bukti_tugas").select("tugas_id").eq("user_id", user.id),
      ]);

      const selesaiIds = (buktiData || []).map((b: any) => b.tugas_id);

      const { isDayWindow: dayWindow, targetDateStr, targetDayIndex } = getModeWaktu();
      setIsDayWindow(dayWindow);

      if (kelasId) {
        const jadwalTarget = await fetchJadwalUntukTanggal(kelasId, targetDateStr, targetDayIndex);
        setJadwal(
          jadwalTarget.map((j: any) => ({ id: j.id, subject: j.subject, time: j.time, room: j.room }))
        );
      }

      const now = Date.now();
      const semuaTugasAktif = [
        ...(teoriData || []).map((t: any) => ({ id: t.id, judul_tugas: t.judul_tugas, deadline: t.deadline })),
        ...(praktikumData || []).map((t: any) => ({ id: t.id, judul_tugas: t.judul_tugas, deadline: t.deadline })),
      ]
        .filter((t) => !selesaiIds.includes(t.id))
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 4);

      setTugas(
        semuaTugasAktif.map((t) => {
          const diffMs = new Date(t.deadline).getTime() - now;
          const urgent = diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
          const d = new Date(t.deadline);
          const label = `${d.getDate()}/${d.getMonth() + 1} ${d
            .getHours()
            .toString()
            .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
          return { id: t.id, judul_tugas: t.judul_tugas, mk_nama: "", deadline: label, urgent };
        })
      );

      const { data: zoomTarget } = await supabase
        .from("zoom_meetings")
        .select("*")
        .eq("is_active", true)
        .gte("waktu_mulai", `${targetDateStr}T00:00:00`)
        .lte("waktu_mulai", `${targetDateStr}T23:59:59`)
        .order("waktu_mulai", { ascending: true });

      setAgenda(
        (zoomTarget || []).map((z: any) => {
          const d = new Date(z.waktu_mulai);
          return {
            id: `zoom-${z.id}`,
            label: z.judul,
            waktu: `${d.getHours().toString().padStart(2, "0")}:${d
              .getMinutes()
              .toString()
              .padStart(2, "0")}`,
            tipe: "zoom" as const,
          };
        })
      );

      setDataReady(true);
      setVisible(true);
      sessionStorage.setItem(todayKey, "1");
    };

    jalankan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, aktif, pathname]);

  const handleClose = () => setVisible(false);

  if (!visible || !dataReady) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-white/40 dark:bg-black/40 backdrop-blur-xl px-4 py-10 animate-fade-in">
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-10 w-9 h-9 rounded-full bg-white/70 dark:bg-white/15 hover:bg-white/90 dark:hover:bg-white/25 flex items-center justify-center text-slate-700 dark:text-white shadow-md transition-colors"
        aria-label="Tutup"
      >
        <X size={18} />
      </button>

      <div className="w-full max-w-[440px] my-auto">
        <div className="rounded-[28px] shadow-2xl shadow-black/20 ring-1 ring-black/5 dark:ring-white/10">
          <AsistenZora
            namaUser={namaUser}
            isDayWindow={isDayWindow}
            jadwal={jadwal}
            tugas={tugas}
            agenda={agenda}
          />
        </div>
        <button
          onClick={handleClose}
          className="mt-4 w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black uppercase tracking-wide shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          Tutup
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}