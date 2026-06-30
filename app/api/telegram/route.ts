import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ambil data pesan dari Telegram
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // DAFTAR PERINTAH BOT (Silakan tambah sesukamu di bawah ini)
    if (text === "/halo") {
      await balasChat(chatId, "Halo juga Class C! Saya Asisten Zora, otak saya baru saja dinyalakan dari VS Code. 🤖");
    } 
    else if (text === "/menu") {
      await balasChat(chatId, "📌 *Menu Perintah Zora:*\n\n/halo - Sapa bot\n/menu - Daftar perintah");
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error Webhook:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Fungsi internal khusus untuk membalas balik ke Telegram
async function balasChat(chatId: number, teks: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: teks, parse_mode: "Markdown" }),
  });
}