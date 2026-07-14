"use client";

import { forwardRef } from "react";
import { JadwalWallpaperData } from "@/lib/wallpaper/types";

interface Props {
  data: JadwalWallpaperData;
}

const HARI_URUT = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// Aksen neon berbeda tiap hari di atas background gelap
const DAY_ACCENTS: Record<string, string> = {
  Senin: "from-pink-400 to-fuchsia-500",
  Selasa: "from-violet-400 to-purple-500",
  Rabu: "from-cyan-400 to-blue-500",
  Kamis: "from-emerald-400 to-teal-500",
  Jumat: "from-amber-400 to-orange-500",
  Sabtu: "from-rose-400 to-pink-500",
  Minggu: "from-sky-400 to-indigo-500",
};

const AuroraDarkTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const grouped = HARI_URUT.map((hari) => ({
    hari,
    items: data.items.filter((i) => i.hari === hari),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 2340 }}
      className="relative overflow-hidden bg-gradient-to-b from-[#0a0a0f] via-[#12121c] to-[#0a0a0f]"
    >
      {/* efek aurora blur warna-warni */}
      <div className="absolute -top-24 -left-20 w-[500px] h-[500px] rounded-full bg-fuchsia-600/30 blur-[100px]" />
      <div className="absolute top-1/4 -right-24 w-[460px] h-[460px] rounded-full bg-cyan-500/25 blur-[100px]" />
      <div className="absolute bottom-10 left-1/4 w-[420px] h-[420px] rounded-full bg-emerald-500/20 blur-[100px]" />
      <div className="absolute bottom-1/3 -right-10 w-[380px] h-[380px] rounded-full bg-violet-600/25 blur-[100px]" />

      <div className="relative z-10 px-14 pt-20 pb-14 h-full flex flex-col">
        {/* header */}
        <div className="mb-12">
          <p className="text-2xl font-medium text-white/40 tracking-widest uppercase mb-2">
            Jadwal Kuliah
          </p>
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
            {data.namaKelas}
          </h1>
          {data.semester && (
            <p className="text-2xl text-white/50 mt-2">{data.semester}</p>
          )}
        </div>

        {/* daftar hari */}
        <div className="flex-1 flex flex-col gap-7 overflow-hidden">
          {grouped.map((group) => {
            const accent = DAY_ACCENTS[group.hari] ?? "from-slate-400 to-slate-500";

            return (
              <div
                key={group.hari}
                className="rounded-[2.5rem] p-[1.5px] bg-gradient-to-r from-white/20 via-white/5 to-transparent"
              >
                <div className="rounded-[2.4rem] bg-white/[0.04] backdrop-blur-xl p-7 border border-white/5">
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${accent}`}
                    />
                    <h2
                      className={`text-3xl font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}
                    >
                      {group.hari}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-2xl px-6 py-4"
                      >
                        <div className="flex-1 pr-4">
                          <p className="text-xl font-semibold text-white">
                            {item.mataKuliah}
                          </p>
                          <p className="text-base text-white/40 mt-0.5">
                            {item.gedung} · {item.lantai}
                            {item.dosen ? ` · ${item.dosen}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-lg font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}
                          >
                            {item.jamMulai}
                          </p>
                          <p className="text-sm text-white/30">{item.jamSelesai}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* footer kecil */}
        <p className="text-center text-white/30 text-base mt-10">
          Dibuat dengan Zora 
        </p>
      </div>
    </div>
  );
});

AuroraDarkTemplate.displayName = "AuroraDarkTemplate";
export default AuroraDarkTemplate;