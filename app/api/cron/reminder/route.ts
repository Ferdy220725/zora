// app/api/cron/reminder/route.ts
// Letakkan file ini di: app/api/cron/reminder/route.ts
// Dipanggil otomatis oleh Vercel Cron (lihat vercel.json) jam 09:00 & 12:00 WIB

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendTelegram(text: string) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
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

// Cek apakah suatu tanggal jatuh pada "besok" (WIB)
function isDeadlineTomorrow(dateString: string) {
  if (!dateString) return false;

  const deadline = new Date(dateString);
  const now = new Date();

  // Konversi ke string tanggal WIB (YYYY-MM-DD) untuk perbandingan yang akurat
  const deadlineWIB = deadline.toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowWIB = tomorrow.toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  return deadlineWIB === tomorrowWIB;
}

export async function GET(req: NextRequest) {
  // Proteksi: hanya boleh dipanggil oleh Vercel Cron (pakai CRON_SECRET)
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: tugasKuliah } = await supabase
      .from("tugas_perkuliahan")
      .select("*")
      .order("deadline", { ascending: true });

    const { data: tugasPrak } = await supabase
      .from("tugas_praktikum")
      .select("*")
      .order("deadline", { ascending: true });

    const kuliahBesok = (tugasKuliah || []).filter((t) =>
      isDeadlineTomorrow(t.deadline)
    );
    const prakBesok = (tugasPrak || []).filter((t) =>
      isDeadlineTomorrow(t.deadline)
    );

    if (kuliahBesok.length === 0 && prakBesok.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "Tidak ada deadline besok, reminder tidak dikirim.",
      });
    }

    let text = `⏰ <b>PENGINGAT DEADLINE BESOK</b>\n\n`;

    if (kuliahBesok.length > 0) {
      text += `📚 <b>Tugas Perkuliahan</b>\n`;
      kuliahBesok.forEach((t, i) => {
        text +=
          `${i + 1}. [${t.mk_nama || "-"}] <b>${t.judul_tugas}</b>\n` +
          `   ⏰ Deadline: ${formatWIB(t.deadline)}\n`;
        if (t.link_pengumpulan)
          text += `   🔗 <a href="${t.link_pengumpulan}">Link Pengumpulan</a>\n`;
        text += "\n";
      });
    }

    if (prakBesok.length > 0) {
      text += `🧪 <b>Tugas Praktikum</b>\n`;
      prakBesok.forEach((t, i) => {
        text +=
          `${i + 1}. [${t.mk_nama || "-"} - Gol ${t.golongan || "-"}] <b>${t.judul_tugas}</b>\n` +
          `   ⏰ Deadline: ${formatWIB(t.deadline)}\n`;
        if (t.link_pengumpulan)
          text += `   🔗 <a href="${t.link_pengumpulan}">Link Pengumpulan</a>\n`;
        text += "\n";
      });
    }

    text += `🙏 Jangan sampai telat ya, segera dikerjakan!`;

    await sendTelegram(text);

    return NextResponse.json({
      ok: true,
      sent: { kuliah: kuliahBesok.length, praktikum: prakBesok.length },
    });
  } catch (err) {
    console.error("[Cron Reminder] Error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}