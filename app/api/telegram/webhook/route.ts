// app/api/telegram/webhook/route.ts
// Letakkan file ini di: app/api/telegram/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client (server-side, pakai service role key) ──────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Helper: kirim balik pesan ke Telegram ──────────────────────────────────
async function replyTelegram(chatId: number | string, text: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );
}

// ── Helper: format tanggal ke WIB ─────────────────────────────────────────
function formatWIB(dateString: string) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateString;
  }
}

// ── Command Handlers ───────────────────────────────────────────────────────

/** /start atau /help — daftar command */
async function handleHelp(chatId: number | string) {
  const text =
    `🤖 <b>Bot Akademik — Daftar Command</b>\n\n` +
    `/jadwal — Jadwal Zoom aktif hari ini\n` +
    `/tugas — Semua tugas aktif (kuliah + praktikum)\n` +
    `/tugaskuliah — Tugas perkuliahan saja\n` +
    `/tugasprak — Tugas praktikum saja\n` +
    `/absen — Status sistem absensi\n` +
    `/help — Tampilkan pesan ini`;
  await replyTelegram(chatId, text);
}

/** /jadwal — ambil zoom_meetings yang is_active = true */
async function handleJadwal(chatId: number | string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("zoom_meetings")
    .select("*")
    .eq("is_active", true)
    .gte("waktu_selesai", now) // belum selesai
    .order("waktu_mulai", { ascending: true });

  if (error) {
    await replyTelegram(chatId, "❌ Gagal mengambil data jadwal.");
    return;
  }

  if (!data || data.length === 0) {
    await replyTelegram(chatId, "📭 Tidak ada jadwal Zoom aktif saat ini.");
    return;
  }

  let text = `🎥 <b>JADWAL ZOOM AKTIF</b>\n\n`;
  data.forEach((z, i) => {
    text +=
      `${i + 1}. <b>${z.judul}</b>\n` +
      `   🕐 Mulai  : ${formatWIB(z.waktu_mulai)}\n` +
      `   🕔 Selesai: ${formatWIB(z.waktu_selesai)}\n` +
      `   🔗 <a href="${z.link}">Klik untuk Join</a>\n\n`;
  });

  await replyTelegram(chatId, text);
}

/** /tugaskuliah — tugas_perkuliahan */
async function handleTugasKuliah(chatId: number | string) {
  const { data, error } = await supabase
    .from("tugas_perkuliahan")
    .select("*")
    .order("deadline", { ascending: true });

  if (error || !data || data.length === 0) {
    await replyTelegram(chatId, "📭 Tidak ada tugas perkuliahan aktif saat ini.");
    return;
  }

  let text = `📚 <b>TUGAS PERKULIAHAN</b>\n\n`;
  data.forEach((t, i) => {
    text +=
      `${i + 1}. [${t.mk_nama || "-"}] <b>${t.judul_tugas}</b>\n` +
      `   ⏰ Deadline: ${formatWIB(t.deadline)}\n`;
    if (t.deskripsi) text += `   📝 ${t.deskripsi}\n`;
    if (t.link_pengumpulan) text += `   🔗 <a href="${t.link_pengumpulan}">Link Pengumpulan</a>\n`;
    text += "\n";
  });

  await replyTelegram(chatId, text);
}

/** /tugasprak — tugas_praktikum (filter: hapus 3 hari setelah deadline) */
async function handleTugasPrak(chatId: number | string) {
  const { data, error } = await supabase
    .from("tugas_praktikum")
    .select("*")
    .order("deadline", { ascending: true });

  if (error || !data) {
    await replyTelegram(chatId, "❌ Gagal mengambil data tugas praktikum.");
    return;
  }

  const now = new Date();
  const aktif = data.filter((t) => {
    const batasHapus = new Date(t.deadline);
    batasHapus.setDate(batasHapus.getDate() + 3);
    return now <= batasHapus;
  });

  if (aktif.length === 0) {
    await replyTelegram(chatId, "📭 Tidak ada tugas praktikum aktif saat ini.");
    return;
  }

  let text = `🧪 <b>TUGAS PRAKTIKUM</b>\n\n`;
  aktif.forEach((t, i) => {
    text +=
      `${i + 1}. [${t.mk_nama} - Gol ${t.golongan}] <b>${t.judul_tugas}</b>\n` +
      `   ⏰ Deadline: ${formatWIB(t.deadline)}\n`;
    if (t.deskripsi) text += `   📝 ${t.deskripsi}\n`;
    if (t.link_pengumpulan) text += `   🔗 <a href="${t.link_pengumpulan}">Link Pengumpulan</a>\n`;
    text += "\n";
  });

  await replyTelegram(chatId, text);
}

/** /tugas — gabungan kuliah + prak */
async function handleTugas(chatId: number | string) {
  await handleTugasKuliah(chatId);
  await handleTugasPrak(chatId);
}

/** /absen — status sistem absensi */
async function handleAbsen(chatId: number | string) {
  const { data, error } = await supabase
    .from("status_sistem")
    .select("*")
    .eq("id", "absensi")
    .maybeSingle();

  if (error || !data) {
    await replyTelegram(chatId, "❌ Gagal mengambil status absensi.");
    return;
  }

  const status = data.is_active ? "🟢 DIBUKA" : "🔴 DITUTUP";
  const kode = data.is_active
    ? `\n🔑 Kode Akses: <code>${data.kode_akses || "-"}</code>`
    : "";

  await replyTelegram(
    chatId,
    `🚪 <b>STATUS ABSENSI</b>\n\nStatus: <b>${status}</b>${kode}`
  );
}

// ── Main POST Handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Telegram mengirim update berupa object "message"
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text: string = message.text || "";

    // Ambil command (misal "/jadwal@NamaBotku" → "/jadwal")
    const command = text.split("@")[0].trim().toLowerCase();

    switch (command) {
      case "/start":
      case "/help":
        await handleHelp(chatId);
        break;
      case "/jadwal":
        await handleJadwal(chatId);
        break;
      case "/tugas":
        await handleTugas(chatId);
        break;
      case "/tugaskuliah":
        await handleTugasKuliah(chatId);
        break;
      case "/tugasprak":
        await handleTugasPrak(chatId);
        break;
      case "/absen":
        await handleAbsen(chatId);
        break;
      default:
        // Diam saja jika bukan command yang dikenal — supaya tidak spam grup
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Telegram hanya kirim POST, tolak method lain
export async function GET() {
  return NextResponse.json({ status: "Webhook aktif ✅" });
}