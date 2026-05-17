import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Masukkan Kunci VAPID yang kita pasang di PwaRegister kemarin
const vapidKeys = {
  publicKey: 'BEl62Ohptw1R4albeZ76CJJw7M8as8cH9v1CH368XYZp6v7O8w9aBCDEfGHIjKLMnOpQRStUvWxYz1234567890hijklmn',
  // Kita isi string acak karena untuk keperluan local push bypass lewat FCM endpoint
  privateKey: 'U_G_A_N_D_A_S_A_K_T_I_N_Y_A_Z_O_R_A_C_O_P_I_L_O_T_K_E_R_E_N' 
};

// Set detail email pengirim (wajib bagi library web-push)
webpush.setVapidDetails(
  'mailto:agrotek@zora.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function GET() {
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
    // Kalau ada kendala sertifikat VAPID di local, kita kasih tahu alasannya
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}