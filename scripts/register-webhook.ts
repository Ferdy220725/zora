// scripts/register-webhook.ts
// Jalankan sekali saja untuk daftarkan webhook ke Telegram:
//   npx ts-node scripts/register-webhook.ts
// atau (jika pakai tsx):
//   npx tsx scripts/register-webhook.ts
import { config } from "dotenv";
config({ path: ".env.local" });
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "GANTI_DENGAN_TOKEN_KAMU";

// Ganti dengan URL deployment kamu (Vercel / domain sendiri)
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`
  : "https://DOMAIN_KAMU.vercel.app/api/telegram/webhook";

async function registerWebhook() {
  console.log("🔗 Mendaftarkan webhook ke:", WEBHOOK_URL);

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ["message"], // hanya terima event pesan
      }),
    }
  );

  const data = await res.json();

  if (data.ok) {
    console.log("✅ Webhook berhasil didaftarkan!");
    console.log("   URL:", WEBHOOK_URL);
  } else {
    console.error("❌ Gagal mendaftarkan webhook:", data.description);
  }
}

async function checkWebhook() {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
  );
  const data = await res.json();
  console.log("\n📋 Info Webhook Saat Ini:");
  console.log(JSON.stringify(data.result, null, 2));
}

async function deleteWebhook() {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`
  );
  const data = await res.json();
  console.log(data.ok ? "🗑️ Webhook dihapus." : "❌ Gagal hapus webhook.");
}

// ── Jalankan ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args[0] === "delete") {
  deleteWebhook();
} else if (args[0] === "check") {
  checkWebhook();
} else {
  registerWebhook().then(checkWebhook);
}