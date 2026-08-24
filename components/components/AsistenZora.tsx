"use client";

import { Video, FlaskConical } from "lucide-react";

export interface AsistenJadwalItem {
  id: string | number;
  subject: string;
  time: string;
  room: string;
}

export interface AsistenTugasItem {
  id: string;
  judul_tugas: string;
  mk_nama: string;
  deadline: string;
  urgent: boolean; // deadline < 24 jam dari sekarang
}

export interface AsistenAgendaItem {
  id: string | number;
  label: string;
  waktu: string;
  tipe: "zoom" | "praktikum";
}

interface Props {
  namaUser: string;
  isDayWindow: boolean;
  jadwal: AsistenJadwalItem[];
  tugas: AsistenTugasItem[];
  agenda: AsistenAgendaItem[];
}

function greetWord(): string {
  const jam = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10
  );
  if (jam >= 4 && jam < 11) return "Selamat pagi";
  if (jam >= 11 && jam < 15) return "Selamat siang";
  if (jam >= 15 && jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function AsistenZora({ namaUser, isDayWindow, jadwal, tugas, agenda }: Props) {
  const semuaKosong = jadwal.length === 0 && tugas.length === 0 && agenda.length === 0;

  return (
    <div className="bg-white dark:bg-[#141414] rounded-[28px] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-white/10 max-w-[440px] mx-auto text-center">
      <p className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
        {greetWord()}, {namaUser}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 mb-5">
        {isDayWindow ? "Ini agenda kamu hari ini." : "Kelas hari ini sudah lewat, ini jadwal besok."}
      </p>

      {semuaKosong ? (
        <p className="text-sm text-slate-500 dark:text-slate-300 py-6">
          {isDayWindow ? "Tidak ada jadwal atau tugas hari ini 🎉" : "Belum ada jadwal untuk besok."}
        </p>
      ) : (
        <>
          {jadwal.length > 0 && (
            <div className="text-left">
              {jadwal.map((j, i) => (
                <div
                  key={j.id}
                  className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-slate-100 dark:border-white/10" : ""}`}
                >
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[48px]">{j.time}</span>
                  <p className="flex-1 text-sm font-medium text-slate-900 dark:text-white">{j.subject}</p>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">{j.room}</span>
                </div>
              ))}
            </div>
          )}

          {tugas.length > 0 && (
            <div className="text-left mt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300 mb-2">Tugas belum selesai</p>
              {tugas.map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      t.urgent ? "bg-red-500" : "bg-slate-400 dark:bg-white/30"
                    }`}
                  />
                  <p className="flex-1 text-sm font-medium text-slate-900 dark:text-white truncate">{t.judul_tugas}</p>
                  <span className={`text-xs flex-shrink-0 font-semibold ${t.urgent ? "text-red-500" : "text-slate-500 dark:text-slate-300"}`}>
                    {t.deadline}
                  </span>
                </div>
              ))}
            </div>
          )}

          {agenda.length > 0 && (
            <div className="text-left mt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300 mb-2">Agenda lainnya</p>
              {agenda.map((a) => (
                <div key={a.id} className="flex items-center gap-2 py-1.5">
                  {a.tipe === "zoom" ? (
                    <Video size={14} className="text-slate-500 dark:text-slate-300 flex-shrink-0" />
                  ) : (
                    <FlaskConical size={14} className="text-slate-500 dark:text-slate-300 flex-shrink-0" />
                  )}
                  <p className="flex-1 text-sm font-medium text-slate-900 dark:text-white truncate">{a.label}</p>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 flex-shrink-0">{a.waktu}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}