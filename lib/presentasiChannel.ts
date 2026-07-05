// Satu channel realtime per kode sesi, dipakai layar utama & HP remote
export function channelName(kode: string) {
  return `sesi-presentasi:${kode}`;
}

export type PresentasiEvent =
  | { type: "join" } // dikirim HP saat baru scan QR, minta state terkini
  | { type: "state_sync"; slide: number; totalPages: number } // balasan dari layar utama
  | { type: "nav"; direction: 1 | -1 } // dikirim HP: next (1) atau prev (-1)
  | { type: "slide_change"; slide: number } // dikirim layar utama, sumber kebenaran nomor slide
  | { type: "pointer_move"; x: number; y: number } // koordinat 0..1 dari HP
  | { type: "pointer_hide" }
  | { type: "presentation_end" };

export const EVENT_NAME = "presentasi-event";
