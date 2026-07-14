"use client";

import { useState } from "react";
import JadwalForm from "@/components/wallpaper/JadwalForm";
import TemplatePicker from "@/components/wallpaper/TemplatePicker";
import WallpaperGenerator from "@/components/wallpaper/WallpaperGenerator";
import { JadwalItem } from "@/lib/wallpaper/types";

export default function DesainJadwalPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [items, setItems] = useState<JadwalItem[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [namaKelas, setNamaKelas] = useState("Agroteknologi C");

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-10 px-4">
      <h1 className="text-2xl font-black uppercase italic text-center mb-2 text-slate-800">
        Desain Jadwal
      </h1>
      <p className="text-center text-sm text-gray-400 mb-8">
        Langkah {step} dari 3
      </p>

      {step === 1 && (
        <div className="flex flex-col gap-6">
          <input
            value={namaKelas}
            onChange={(e) => setNamaKelas(e.target.value)}
            placeholder="Nama kelas"
            className="max-w-xl mx-auto w-full border border-gray-300 rounded-xl px-4 py-2.5 text-center font-bold"
          />
          <JadwalForm items={items} onChange={setItems} />
          <button
            disabled={items.length === 0}
            onClick={() => setStep(2)}
            className="max-w-xl mx-auto w-full bg-[#004d40] text-white rounded-xl py-3 font-bold uppercase disabled:opacity-30"
          >
            Lanjut pilih template →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <TemplatePicker selectedId={templateId} onSelect={setTemplateId} />
          <div className="max-w-xl mx-auto w-full flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 rounded-xl py-3 font-bold uppercase text-gray-500"
            >
              ← Kembali
            </button>
            <button
              disabled={!templateId}
              onClick={() => setStep(3)}
              className="flex-1 bg-[#004d40] text-white rounded-xl py-3 font-bold uppercase disabled:opacity-30"
            >
              Buat jadwal →
            </button>
          </div>
        </div>
      )}

      {step === 3 && templateId && (
        <div className="flex flex-col gap-6">
          <WallpaperGenerator
            data={{ namaKelas, items }}
            templateId={templateId}
          />
          <button
            onClick={() => setStep(2)}
            className="max-w-xl mx-auto w-full border border-gray-300 rounded-xl py-3 font-bold uppercase text-gray-500"
          >
            ← Ganti template
          </button>
        </div>
      )}
    </div>
  );
}