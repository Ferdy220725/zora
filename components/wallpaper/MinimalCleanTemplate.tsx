"use client";

import { forwardRef } from "react";
import { JadwalWallpaperData } from "@/lib/wallpaper/types";

interface Props {
  data: JadwalWallpaperData;
}

const HARI_URUT = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const MinimalCleanTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const grouped = HARI_URUT.map((hari) => ({
    hari,
    items: data.items.filter((i) => i.hari === hari),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 2340 }}
      className="relative bg-white flex flex-col"
    >
      <div className="px-16 pt-24 pb-10 border-b-4 border-gray-900">
        <p className="text-xl font-semibold text-gray-400 tracking-[0.3em] uppercase mb-2">
          Jadwal Kuliah
        </p>
        <h1 className="text-7xl font-black text-gray-900 leading-none">
          {data.namaKelas}
        </h1>
        {data.semester && (
          <p className="text-2xl text-gray-500 mt-3">{data.semester}</p>
        )}
      </div>

      <div className="flex-1 px-16 py-10 flex flex-col gap-10 overflow-hidden">
        {grouped.map((group) => (
          <div key={group.hari}>
            <h2 className="text-3xl font-black text-gray-900 mb-4 border-l-8 border-gray-900 pl-4">
              {group.hari}
            </h2>
            <div className="flex flex-col divide-y divide-gray-200">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{item.mataKuliah}</p>
                    <p className="text-lg text-gray-500 mt-1">
                      {item.gedung} · {item.lantai}
                      {item.dosen ? ` · ${item.dosen}` : ""}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-gray-900 shrink-0">
                    {item.jamMulai}–{item.jamSelesai}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-400 text-lg pb-12">Dibuat dengan Zora</p>
    </div>
  );
});

MinimalCleanTemplate.displayName = "MinimalCleanTemplate";
export default MinimalCleanTemplate;