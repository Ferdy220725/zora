"use client";

import { forwardRef } from "react";
import { JadwalWallpaperData } from "@/lib/wallpaper/types";

interface Props {
  data: JadwalWallpaperData;
}

const HARI_URUT = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// Gradasi aksen berbeda tiap hari, biar tiap kartu punya "mood" warna sendiri
const DAY_GRADIENTS: Record<string, string> = {
  Senin: "from-fuchsia-500 to-purple-600",
  Selasa: "from-violet-500 to-indigo-600",
  Rabu: "from-blue-500 to-cyan-500",
  Kamis: "from-emerald-500 to-teal-600",
  Jumat: "from-amber-500 to-orange-600",
  Sabtu: "from-rose-500 to-pink-600",
  Minggu: "from-sky-500 to-blue-600",
};

const GradientVibrantTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const grouped = HARI_URUT.map((hari) => ({
    hari,
    items: data.items.filter((i) => i.hari === hari),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 2340 }}
      className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-fuchsia-600 to-orange-500"
    >
      {/* lapisan glow tambahan biar gradasinya lebih hidup */}
      <div className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full bg-pink-400/30 blur-3xl" />
      <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-orange-300/10 blur-3xl" />

      <div className="relative z-10 px-14 pt-20 pb-14 h-full flex flex-col">
        {/* header */}
        <div className="mb-12">
          <p className="text-2xl font-semibold text-white/70 tracking-widest uppercase mb-2">
            Jadwal Kuliah
          </p>
          <h1 className="text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
            {data.namaKelas}
          </h1>
          {data.semester && (
            <p className="text-2xl text-white/80 mt-2">{data.semester}</p>
          )}
        </div>

        {/* daftar hari */}
        <div className="flex-1 flex flex-col gap-7 overflow-hidden">
          {grouped.map((group) => {
            const gradient = DAY_GRADIENTS[group.hari] ?? "from-slate-500 to-slate-700";

            return (
              <div
                key={group.hari}
                className="rounded-[2.5rem] p-[2px] bg-gradient-to-r from-white/40 to-white/10"
              >
                <div className="rounded-[2.4rem] bg-white/15 backdrop-blur-xl p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-white text-lg font-bold shadow-md`}
                    >
                      {group.hari}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white/90 rounded-2xl px-6 py-4 shadow-sm"
                      >
                        <div className="flex-1 pr-4">
                          <p className="text-xl font-semibold text-gray-800">
                            {item.mataKuliah}
                          </p>
                          <p className="text-base text-gray-500 mt-0.5">
                            {item.gedung} · {item.lantai}
                            {item.dosen ? ` · ${item.dosen}` : ""}
                          </p>
                        </div>
                        <div
                          className={`text-right shrink-0 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
                        >
                          <p className="text-lg font-bold">{item.jamMulai}</p>
                          <p className="text-sm opacity-70">{item.jamSelesai}</p>
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
        <p className="text-center text-white/70 text-base mt-10">
          Dibuat dengan Zora 
        </p>
      </div>
    </div>
  );
});

GradientVibrantTemplate.displayName = "GradientVibrantTemplate";
export default GradientVibrantTemplate;