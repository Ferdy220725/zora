"use server";

/**
 * Mengirim pesan ke grup/channel Telegram menggunakan Bot API.
 * Wajib dipanggil dari server (server action / route handler),
 * karena menggunakan TELEGRAM_BOT_TOKEN yang bersifat rahasia.
 */
export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("[Telegram] TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diset di env.");
    return { ok: false, error: "Konfigurasi Telegram tidak lengkap" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("[Telegram] API error:", data);
      return { ok: false, error: data.description || "Gagal mengirim pesan" };
    }

    return { ok: true, data };
  } catch (err: any) {
    console.error("[Telegram] Fetch error:", err);
    return { ok: false, error: err.message };
  }
}