export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram token atau Chat ID belum dikonfigurasi di .env.local");
    return { success: false, error: "Missing configuration" };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown", // Biar bisa pakai format teks tebal/miring
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.description || "Gagal kirim");

    return { success: true, data };
  } catch (error: any) {
    console.error("Telegram Error:", error.message);
    return { success: false, error: error.message };
  }
}