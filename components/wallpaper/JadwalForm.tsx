"use client";

import { useState } from "react";
import { JadwalItem } from "@/lib/wallpaper/types";

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

interface Props {
  items: JadwalItem[];
  onChange: (items: JadwalItem[]) => void;
}

const emptyForm = {
  hari: "Senin" as JadwalItem["hari"],
  mataKuliah: "",
  dosen: "",
  jamMulai: "",
  jamSelesai: "",
  gedung: "",
  lantai: "",
};

export default function JadwalForm({ items, onChange }: Props) {
  const [form, setForm] = useState(emptyForm);

  const handleAdd = () => {
    if (!form.mataKuliah || !form.jamMulai || !form.jamSelesai || !form.gedung || !form.lantai) {
      alert("Lengkapi dulu mata kuliah, jam, gedung, dan lantai ya.");
      return;
    }
    const newItem: JadwalItem = { id: crypto.randomUUID(), ...form };
    onChange([...items, newItem]);
    setForm({ ...emptyForm, hari: form.hari });
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            value={form.hari}
            onChange={(e) => setForm({ ...form, hari: e.target.value as JadwalItem["hari"] })}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm col-span-2"
          >
            {HARI_OPTIONS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <input
            placeholder="Mata kuliah"
            value={form.mataKuliah}
            onChange={(e) => setForm({ ...form, mataKuliah: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm col-span-2"
          />

          <input
            placeholder="Dosen (opsional)"
            value={form.dosen}
            onChange={(e) => setForm({ ...form, dosen: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm col-span-2"
          />

          <input
            type="time"
            value={form.jamMulai}
            onChange={(e) => setForm({ ...form, jamMulai: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="time"
            value={form.jamSelesai}
            onChange={(e) => setForm({ ...form, jamSelesai: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
          />

          <input
            placeholder="Gedung"
            value={form.gedung}
            onChange={(e) => setForm({ ...form, gedung: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
          />
          <input
            placeholder="Lantai / Ruang"
            value={form.lantai}
            onChange={(e) => setForm({ ...form, lantai: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleAdd}
          className="w-full bg-[#004d40] text-white rounded-xl py-2.5 text-sm font-bold uppercase active:scale-95 transition-all"
        >
          + Tambah ke jadwal
        </button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
            >
              <div>
                <p className="font-bold text-gray-800">{item.hari} · {item.mataKuliah}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {item.jamMulai}–{item.jamSelesai} · {item.gedung}, {item.lantai}
                </p>
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className="text-red-500 text-xs font-bold uppercase"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}