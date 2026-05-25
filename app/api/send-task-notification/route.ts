import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails('mailto:agrotek@zora.com', publicKey, privateKey);
  } catch (error) {
    console.error('Gagal inisialisasi VAPID:', error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dataBaru = body.record; // Menangkap baris data baru
    const namaTabel = body.table;  // Menangkap nama tabel asal dari Webhook Supabase

    if (!dataBaru || !namaTabel) {
      return NextResponse.json({ message: 'Payload Webhook tidak valid atau kosong.' }, { status: 400 });
    }

    // 1. KONDISI PINTAR: Sesuaikan teks notifikasi berdasarkan tabel yang bertambah data
    let judulNotif = "Informasi Baru dari Zora 📢";
    let isiNotif = "Ada pembaruan data di aplikasi, cek sekarang!";

    if (namaTabel === 'jadwal_kuliah') {
      judulNotif = `📅 Jadwal Kuliah Baru: ${dataBaru.subject}`;
      isiNotif = `Hari: ${dataBaru.day} | Jam: ${dataBaru.time}\nRuangan: ${dataBaru.room}`;
    } 
    else if (namaTabel === 'tugas_praktikum') {
      judulNotif = `📝 Tugas Baru: ${dataBaru.judul_tugas}`;
      isiNotif = `Matkul: ${dataBaru.mk_nama} (Golongan ${dataBaru.golongan})\nDeadline: ${dataBaru.deadline ? new Date(dataBaru.deadline).toLocaleString('id-ID') : 'Cek di aplikasi'}`;
    } 
    else if (namaTabel === 'zoom_meetings') {
      judulNotif = `🎥 Link Zoom Baru: ${dataBaru.judul}`;
      isiNotif = `Matkul: ${dataBaru.mk_nama || 'Umum'}\nKlik untuk bersiap-siap masuk kelas virtual!`;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // 2. PROSES BACKGROUND: Kirim tanpa bikin database nunggu (Anti-Timeout)
    (async () => {
      try {
        const { data: listUser } = await supabase
          .from('zora_notifications')
          .select('subscription_json');

        if (!listUser || listUser.length === 0) return;

        const payload = JSON.stringify({
          title: judulNotif,
          body: isiNotif,
          icon: '/favicon.ico', // Memakai favicon yang ada di folder public kamu
          vibrate: [200, 100, 200]
        });

        const kirimNotif = listUser.map(user => {
          if (!user.subscription_json) return Promise.resolve();
          const subJson = typeof user.subscription_json === 'string' 
            ? JSON.parse(user.subscription_json) 
            : user.subscription_json;

          return webpush.sendNotification(subJson, payload)
            .catch(err => console.error('Token expired/unsubscribed:', err.statusCode));
        });

        await Promise.all(kirimNotif);
        console.log(`✅ Sukses broadcast notifikasi dari tabel: ${namaTabel}`);
      } catch (err) {
        console.error('Gagal memproses background broadcast:', err);
      }
    })();

    // Respon kilat untuk Supabase (kurang dari 50ms)
    return NextResponse.json({ success: true, message: `Webhook untuk ${namaTabel} berhasil diterima.` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}