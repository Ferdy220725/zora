import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cariDosen, dataDosen } from "@/lib/dosenData";

// ── Supabase client ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Helper: kirim balik pesan ke Telegram ─────────────────────────────────
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

// ── Helper: kirim pesan panjang (split biar nggak kena limit 4096 char) ───
async function replyTelegramLong(chatId: number | string, text: string) {
  const CHUNK = 3800;
  for (let i = 0; i < text.length; i += CHUNK) {
    await replyTelegram(chatId, text.slice(i, i + CHUNK));
  }
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
  } catch { return dateString; }
}

// ── Helper: cek & tambah kuota AI harian (default limit 100x/hari) ────────
async function checkAndIncrementQuota(limit = 100): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("ai_usage_log")
    .select("jumlah")
    .eq("tanggal", today)
    .maybeSingle();

  const current = data?.jumlah || 0;
  if (current >= limit) return false;

  await supabase
    .from("ai_usage_log")
    .upsert({ tanggal: today, jumlah: current + 1 });

  return true;
}

// ── Helper: panggil Gemini Flash (GRATIS) ─────────────────────────────────
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = "gemini-2.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    console.error("[Gemini Error]", err);
    return "";
  }
}

// ── Helper: panggil Gemini dengan retry ───────────────────────────────────
async function callGeminiWithRetry(systemPrompt: string, userPrompt: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    const result = await callGemini(systemPrompt, userPrompt);
    if (result) return result;
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  return "⚠️ AI sedang sibuk, coba lagi beberapa saat lagi ya.";
}

// ── Logic: Cron Job Harian Gabungan ───────────────────────────────────────
async function handleCronHarian() {
  try {
    console.log("[Cron] Memulai eksekusi tugas harian gabungan...");
    const TARGET_CHAT_ID = process.env.TELEGRAM_CLASS_CHAT_ID || "";
    if (!TARGET_CHAT_ID) {
      console.log("[Cron] Error: TELEGRAM_CLASS_CHAT_ID belum dikonfigurasi.");
      return;
    }

    const now = new Date();

    // ── BAGIAN 1: PENGINGAT TUGAS OTOMATIS ──
    const { data: tugasKuliah } = await supabase
      .from("tugas_perkuliahan")
      .select("*")
      .gte("deadline", now.toISOString())
      .order("deadline", { ascending: true })
      .limit(5);

    if (tugasKuliah && tugasKuliah.length > 0) {
      let teksReminder = `⏰ <b>PENGINGAT TUGAS KULIAH HARI INI</b> ⏰\n\n`;
      tugasKuliah.forEach((t, i) => {
        teksReminder += `${i + 1}. [${t.mk_nama || "-"}] <b>${t.judul_tugas}</b>\n ⏰ Deadline: ${formatWIB(t.deadline)}\n\n`;
      });
      await replyTelegram(TARGET_CHAT_ID, teksReminder);
    }

    // ── BAGIAN 2: CEK INFO SIAMIK ──
    const { data: infoSiamik, error: siamikErr } = await supabase
      .from("siamik_news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!siamikErr && infoSiamik && !infoSiamik.sudah_dikirim) {
      const pesanSiamik =
        `🔔 <b>INFO TERBARU SIAMIK HARI INI</b> 🔔\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📌 <b>Judul:</b> ${infoSiamik.judul}\n` +
        `📅 <b>Tanggal:</b> ${formatWIB(infoSiamik.created_at)}\n\n` +
        `📝 <b>Isi Pengumuman:</b>\n${infoSiamik.isi_pengumuman || "-"}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👉 <i>Silakan cek akun Siamik masing-masing untuk info lebih lanjut!</i>`;

      await replyTelegram(TARGET_CHAT_ID, pesanSiamik);

      await supabase
        .from("siamik_news")
        .update({ sudah_dikirim: true })
        .eq("id", infoSiamik.id);
    }

    console.log("[Cron] Semua tugas harian selesai diproses.");
  } catch (err) {
    console.error("[Cron Error] Gagal menjalankan tugas harian:", err);
  }
}

// ── Command Handlers ──────────────────────────────────────────────────────

async function handleHelp(chatId: number | string) {
  const text =
    `🤖 <b>Bot Akademik — Daftar Command</b>\n\n` +
    `/jadwal — Jadwal Zoom aktif\n` +
    `/materi — 10 materi terbaru\n` +
    `/materi [kata kunci] — Cari materi (mk/judul)\n` +
    `/ringkas [kata kunci] — Ringkasan materi (AI)\n` +
    `/soal [kata kunci] — Soal latihan dari materi (AI)\n` +
    `/tugas — Semua tugas aktif (kuliah + praktikum)\n` +
    `/tugaskuliah — Tugas perkuliahan saja\n` +
    `/tugasprak — Tugas praktikum saja\n` +
    `/absen — Status sistem absensi\n` +
    `/dosen [nama] — Cari kontak dosen Faperta\n` +
    `/listdosen — Daftar semua dosen Faperta\n` +
    `/help — Tampilkan pesan ini`;
  await replyTelegram(chatId, text);
}

async function handleJadwal(chatId: number | string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("zoom_meetings")
    .select("*")
    .eq("is_active", true)
    .gte("waktu_selesai", now)
    .order("waktu_mulai", { ascending: true });

  if (error || !data || data.length === 0) {
    await replyTelegram(chatId, "📭 Tidak ada jadwal Zoom aktif saat ini.");
    return;
  }

  let text = `🎥 <b>JADWAL ZOOM AKTIF</b>\n\n`;
  data.forEach((z, i) => {
    text += `${i + 1}. <b>${z.judul}</b>\n 🕐 Mulai  : ${formatWIB(z.waktu_mulai)}\n 🕔 Selesai: ${formatWIB(z.waktu_selesai)}\n 🔗 <a href="${z.link}">Klik untuk Join</a>\n\n`;
  });
  await replyTelegram(chatId, text);
}

async function handleTugasKuliah(chatId: number | string) {
  const { data, error } = await supabase
    .from("tugas_perkuliahan")
    .select("*")
    .order("deadline", { ascending: true });

  if (error || !data || data.length === 0) {
    await replyTelegram(chatId, "📭 Tidak ada tugas perkuliahan aktif.");
    return;
  }

  let text = `📚 <b>TUGAS PERKULIAHAN</b>\n\n`;
  data.forEach((t, i) => {
    text += `${i + 1}. [${t.mk_nama || "-"}] <b>${t.judul_tugas}</b>\n ⏰ Deadline: ${formatWIB(t.deadline)}\n`;
    if (t.deskripsi) text += ` 📝 ${t.deskripsi}\n`;
    if (t.link_pengumpulan) text += ` 🔗 <a href="${t.link_pengumpulan}">Link Pengumpulan</a>\n\n`;
  });
  await replyTelegram(chatId, text);
}

async function handleTugasPrak(chatId: number | string) {
  const { data, error } = await supabase
    .from("tugas_praktikum")
    .select("*")
    .order("deadline", { ascending: true });

  if (error || !data) {
    await replyTelegram(chatId, "❌ Gagal mengambil data.");
    return;
  }

  const now = new Date();
  const aktif = data.filter((t) => {
    const batasHapus = new Date(t.deadline);
    batasHapus.setDate(batasHapus.getDate() + 3);
    return now <= batasHapus;
  });

  if (aktif.length === 0) {
    await replyTelegram(chatId, "📭 Tidak ada tugas praktikum aktif.");
    return;
  }

  let text = `🧪 <b>TUGAS PRAKTIKUM</b>\n\n`;
  aktif.forEach((t, i) => {
    text += `${i + 1}. [${t.mk_nama} - Gol ${t.golongan}] <b>${t.judul_tugas}</b>\n ⏰ Deadline: ${formatWIB(t.deadline)}\n`;
    if (t.deskripsi) text += ` 📝 ${t.deskripsi}\n`;
    if (t.link_pengumpulan) text += ` 🔗 <a href="${t.link_pengumpulan}">Link Pengumpulan</a>\n\n`;
  });
  await replyTelegram(chatId, text);
}

async function handleTugas(chatId: number | string) {
  await handleTugasKuliah(chatId);
  await handleTugasPrak(chatId);
}

async function handleAbsen(chatId: number | string) {
  const { data, error } = await supabase
    .from("status_sistem")
    .select("*")
    .eq("id", "absensi")
    .maybeSingle();

  if (error || !data) {
    await replyTelegram(chatId, "❌ Gagal mengambil status.");
    return;
  }

  const status = data.is_active ? "🟢 DIBUKA" : "🔴 DITUTUP";
  const kode = data.is_active
    ? `\n🔑 Kode Akses: <code>${data.kode_akses || "-"}</code>`
    : "";
  await replyTelegram(chatId, `🚪 <b>STATUS ABSENSI</b>\n\nStatus: <b>${status}</b>${kode}`);
}

async function handleMateri(chatId: number | string, keyword: string) {
  let query = supabase.from("materi").select("*").order("created_at", { ascending: false });
  if (keyword) {
    query = query.or(`judul.ilike.%${keyword}%,mk_nama.ilike.%${keyword}%`);
  } else {
    query = query.limit(10);
  }

  const { data, error } = await query;
  if (error) { await replyTelegram(chatId, "❌ Gagal mengambil materi."); return; }
  if (!data || data.length === 0) {
    await replyTelegram(chatId, keyword ? `📭 Materi "<b>${keyword}</b>" tidak ditemukan.` : "📭 Belum ada materi.");
    return;
  }

  let text = keyword ? `📂 <b>HASIL PENCARIAN: "${keyword}"</b>\n\n` : `📂 <b>MATERI TERBARU</b>\n\n`;
  data.forEach((m, i) => {
    text += `${i + 1}. [${m.mk_nama}] <b>${m.judul}</b>\n 🔗 <a href="${m.file_url}">Buka Materi</a>\n\n`;
  });
  await replyTelegram(chatId, text);
}

async function handleRingkas(chatId: number | string, keyword: string) {
  if (!keyword) {
    await replyTelegram(chatId, "💡 Format: /ringkas [kata kunci materi]\nContoh: /ringkas kalkulus1");
    return;
  }

  const { data: materi } = await supabase
    .from("materi")
    .select("*")
    .or(`judul.ilike.%${keyword}%,mk_nama.ilike.%${keyword}%`)
    .limit(1)
    .maybeSingle();

  if (!materi) { await replyTelegram(chatId, `📭 Materi "<b>${keyword}</b>" tidak ditemukan.`); return; }
  if (!materi.konten_teks) { await replyTelegram(chatId, `⚠️ Materi ini belum punya teks untuk diringkas. Hubungi admin.`); return; }

  const allowed = await checkAndIncrementQuota(100);
  if (!allowed) { await replyTelegram(chatId, "🚫 Kuota AI harian bot sudah habis. Coba lagi besok."); return; }

  await replyTelegram(chatId, "⏳ Sedang meringkas materi, tunggu sebentar...");

  const summary = await callGeminiWithRetry(
    "Kamu adalah asisten akademik. Ringkas materi kuliah berikut secara detail dan terstruktur: poin-poin utama, definisi penting, dan contoh jika ada. Gunakan bahasa Indonesia yang jelas, format dengan heading dan bullet point.",
    `Judul: ${materi.judul}\nMata Kuliah: ${materi.mk_nama}\n\nIsi materi:\n${materi.konten_teks}`
  );

  await replyTelegramLong(chatId, `📘 <b>RINGKASAN: ${materi.judul}</b>\n\n${summary}`);
}

async function handleSoal(chatId: number | string, keyword: string) {
  if (!keyword) {
    await replyTelegram(chatId, "💡 Format: /soal [kata kunci materi]\nContoh: /soal kalkulus1");
    return;
  }

  const { data: materi } = await supabase
    .from("materi")
    .select("*")
    .or(`judul.ilike.%${keyword}%,mk_nama.ilike.%${keyword}%`)
    .limit(1)
    .maybeSingle();

  if (!materi) { await replyTelegram(chatId, `📭 Materi "<b>${keyword}</b>" tidak ditemukan.`); return; }
  if (!materi.konten_teks) { await replyTelegram(chatId, `⚠️ Materi ini belum punya teks untuk dibuatkan soal. Hubungi admin.`); return; }

  const allowed = await checkAndIncrementQuota(100);
  if (!allowed) { await replyTelegram(chatId, "🚫 Kuota AI harian bot sudah habis. Coba lagi besok."); return; }

  await replyTelegram(chatId, "⏳ Sedang membuat soal latihan, tunggu sebentar...");

  const soal = await callGeminiWithRetry(
    "Kamu adalah dosen yang membuat soal latihan. Buat 5 soal beragam dari materi berikut: campuran pilihan ganda (dengan 4 opsi dan jawaban benar ditandai) dan essay singkat. Sertakan kunci jawaban di akhir, terpisah dari soal.",
    `Judul: ${materi.judul}\nMata Kuliah: ${materi.mk_nama}\n\nIsi materi:\n${materi.konten_teks}`
  );

  await replyTelegramLong(chatId, `📝 <b>SOAL LATIHAN: ${materi.judul}</b>\n\n${soal}`);
}

// ── Command: /dosen [keyword] ─────────────────────────────────────────────
async function handleDosen(chatId: number | string, keyword: string) {
  if (!keyword) {
    await replyTelegram(
      chatId,
      `⚠️ Ketik nama dosen setelah perintah.\n\n` +
      `Contoh: <code>/dosen Wanti</code>\n` +
      `Contoh: <code>/dosen Tri Mujoko</code>\n` +
      `Contoh: <code>/dosen Dekan</code>\n` +
      `Contoh: <code>/dosen Agribisnis</code>`
    );
    return;
  }

  const hasil = cariDosen(keyword);

  if (hasil.length === 0) {
    await replyTelegram(
      chatId,
      `❌ Dosen "<b>${keyword}</b>" tidak ditemukan.\n\n` +
      `Coba cari dengan:\n` +
      `• Nama belakang: <code>/dosen Mindari</code>\n` +
      `• Jabatan: <code>/dosen Dekan</code>\n` +
      `• Prodi: <code>/dosen Agribisnis</code>\n\n` +
      `Atau ketik /listdosen untuk melihat semua nama dosen.`
    );
    return;
  }

  // Batasi 5 hasil agar pesan tidak terlalu panjang
  const tampil = hasil.slice(0, 5);
  const sisanya = hasil.length > 5 ? hasil.length - 5 : 0;

  let pesan = `🔍 <b>HASIL PENCARIAN: "${keyword}"</b>\n`;
  pesan += `Ditemukan <b>${hasil.length}</b> dosen\n`;
  pesan += `─────────────────────\n\n`;

  tampil.forEach((d, idx) => {
    pesan += `👤 <b>${d.nama}</b>\n`;
    pesan += `🏷 ${d.jabatanFungsional}\n`;
    pesan += `🏢 ${d.jabatanStruktural}\n`;
    pesan += `📚 Prodi: ${d.prodi}\n`;

    if (d.wa) {
      const noWa = d.wa.replace(/^0/, "62").replace(/\D/g, "");
      pesan += `📱 WA: <a href="https://wa.me/${noWa}">+${noWa}</a>\n`;
    } else {
      pesan += `📱 WA: <i>Belum tersedia</i>\n`;
    }

    if (idx < tampil.length - 1) pesan += `\n`;
  });

  if (sisanya > 0) {
    pesan += `\n─────────────────────\n`;
    pesan += `📌 <i>+${sisanya} hasil lainnya. Coba kata kunci lebih spesifik.</i>`;
  }

  await replyTelegram(chatId, pesan);
}

// ── Command: /listdosen ───────────────────────────────────────────────────
async function handleListDosen(chatId: number | string) {
  const list = dataDosen.map((d, i) => `${i + 1}. ${d.nama}`).join("\n");

  const header = `👥 <b>DAFTAR DOSEN FAPERTA UPN JATIM (${dataDosen.length} dosen)</b>\n\n`;
  const fullText = header + list;

  // Split otomatis kalau terlalu panjang
  await replyTelegramLong(chatId, fullText);
}

// ── Main POST Handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("cron") === "all_tasks") {
      await handleCronHarian();
      return NextResponse.json({ ok: true, message: "Cron Job harian sukses diproses via POST." });
    }

    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text: string = message.text || "";

    const parts = text.split(" ");
    const command = parts[0].split("@")[0].trim().toLowerCase();
    const args = parts.slice(1).join(" ").trim();

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
      case "/materi":
        await handleMateri(chatId, args);
        break;
      case "/ringkas":
        await handleRingkas(chatId, args);
        break;
      case "/soal":
        await handleSoal(chatId, args);
        break;
      case "/dosen":
        await handleDosen(chatId, args);
        break;
      case "/listdosen":
        await handleListDosen(chatId);
        break;
      case "/materi_cari":
        await replyTelegram(chatId, "💡 Tips: Ketik /materi [kata kunci] untuk mencari materi.");
        break;
      default:
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// ── Main GET Handler ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("cron") === "all_tasks") {
    await handleCronHarian();
    return NextResponse.json({ status: "Cron Job harian sukses diproses via GET ✅" });
  }

  return NextResponse.json({ status: "Webhook aktif ✅" });
}