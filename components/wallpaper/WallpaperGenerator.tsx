"use client";

import { useRef } from "react";
import { exportWallpaper } from "@/lib/wallpaper/exportImage";
import { JadwalWallpaperData } from "@/lib/wallpaper/types";
import { TEMPLATES } from "@/lib/wallpaper/templates";

interface Props {
  data: JadwalWallpaperData;
  templateId: string;
}

export default function WallpaperGenerator({ data, templateId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const TemplateComponent = template.component;

  const handleExport = async () => {
    if (!ref.current) return;
    await exportWallpaper(ref.current, `jadwal-${data.namaKelas}.png`);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        style={{ width: 1080 * 0.35, height: 2340 * 0.35 }}
        className="overflow-hidden rounded-2xl shadow-lg border"
      >
        <div style={{ transform: "scale(0.35)", transformOrigin: "top left" }}>
          <TemplateComponent ref={ref} data={data} />
        </div>
      </div>

      <button
        onClick={handleExport}
        className="px-6 py-3 rounded-full bg-[#004d40] text-white font-semibold hover:opacity-90 transition"
      >
        Unduh Wallpaper
      </button>
    </div>
  );
}