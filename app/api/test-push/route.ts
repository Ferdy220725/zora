import { NextResponse } from 'next/server';
import webpush from 'web-push';

// 1. Ambil Kunci VAPID dari Environment Variables yang sudah kita set di Vercel
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

// Pengaman: setVapidDetails hanya jalan saat build jika Key-nya valid di server
if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:agrotek@zora.com',
      publicKey,
      privateKey
    );
  } catch (error) {
    console.error('Gagal inisialisasi VAPID di test-push saat build:', error);
  }
}

export async function GET() {
  // Validasi darurat saat API ini ditembak (runtime)
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'Konfigurasi VAPID tidak ditemukan di server.' }, { status: 500 });
  }

  // Token browser kamu yang diambil langsung dari Supabase tadi
  const tokenBrowserKamu = {
    "keys": {
      "auth": "ZelluQRQYY74s5SvgyHR3A",
      "p256dh": "BOGx9W0zuvwdMHPtJgIBoY8Vl96tI0CN6xOBvL5wTJLKyh6JmuOPJbrumN-KOz-G7jHqwmUF4SgXzCVQu7_C5RI"
    },
    "endpoint": "https://fcm.googleapis.com/fcm/send/di4lKarhRt0:APA91bFyQW7dYcl5gllfuas0g7wzQGGHSSi3P70zng8WYPqKx-cRFwSgnPtltPHdLQ6WitXPaD5w94SVt_2EnJHAoohao92ef2pRhMwC_VoGxUmTArr9_gKFYylJSA5t_r4O0rjZPd5Y",
    "expirationTime": null
  };

  // Isi pesan notifikasi cantik untuk sobat Zora
  const payload = JSON.stringify({
    title: 'Zora Agroteknologi C',
    body: 'Woi Sobat Zora! Kuliah mulai 15 menit lagi di Ruang 3.2! 🔥🌱'
  });

  try {
    await webpush.sendNotification(tokenBrowserKamu, payload);
    return NextResponse.json({ success: true, message: '🚀 BOOM! Notifikasi berhasil ditembak!' });
  } catch (error: any) {
    console.error('Eror nembak push:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}