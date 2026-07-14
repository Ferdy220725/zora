export const PASTEL_PALETTE: Record<string, { bg: string; text: string; accent: string }> = {
  Senin:  { bg: "bg-orange-100",  text: "text-orange-900",  accent: "bg-orange-300" },
  Selasa: { bg: "bg-pink-100",    text: "text-pink-900",    accent: "bg-pink-300" },
  Rabu:   { bg: "bg-purple-100",  text: "text-purple-900",  accent: "bg-purple-300" },
  Kamis:  { bg: "bg-blue-100",    text: "text-blue-900",    accent: "bg-blue-300" },
  Jumat:  { bg: "bg-emerald-100", text: "text-emerald-900", accent: "bg-emerald-300" },
  Sabtu:  { bg: "bg-amber-100",   text: "text-amber-900",   accent: "bg-amber-300" },
  Minggu: { bg: "bg-rose-100",    text: "text-rose-900",    accent: "bg-rose-300" },
};

export const CARD_ROTATIONS = ["-rotate-1", "rotate-1", "-rotate-[0.5deg]", "rotate-[0.5deg]", "rotate-0"];