"use client";

import { TEMPLATES } from "@/lib/wallpaper/templates";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function TemplatePicker({ selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
      {TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          type="button" // PENTING: Agar tidak dianggap submit form
          onClick={() => onSelect(tpl.id)}
          className={`rounded-2xl overflow-hidden border-2 text-left transition-all ${
            selectedId === tpl.id ? "border-[#004d40] scale-[1.02]" : "border-gray-200"
          }`}
        >
          <div style={{ background: tpl.previewBg, height: 120 }} />
          <div className="p-3 bg-white">
            <p className="font-bold text-sm text-gray-800">{tpl.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}