import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// 1. Konfigurasi Web Push pakai Kunci VAPID murni kemarin
const vapidKeys = {
  publicKey: 'BFm_5n-0H9N_pXWzLOfu3mKx4j96m8-q-97zL7YF6G-D8_D9J39N_ZzM-f8g_Y6p_gH_vGZ5J7K7L9M0nOpQRSt',
  privateKey: 'U_G_A_N_D_A_S_A_K_T_I_N_Y_A_Z_O_R_A_C_O_P_I_L_O_T_K_E_R_E_N' // String bypass lokal
};

webpush.setVapidDetails('mailto:agrotek@zora.com', vapidKeys.publicKey, vapidKeys.privateKey);

// 2. Koneksi Supabase internal
const supabase = createClient(
  'https://etdcqxdjmdyexbvgjaza.supabase.co',
  'sb_publishable_69qNJfkxRc2lPnSUMYXCeQ_lsypv2Ba'
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Membaca data tugas yang baru saja kamu input di web
    // (Asumsi nama kolom di tabel tugasmu adalah 'nama_tugas' dan 'deadline')
    const { nama_tugas, deadline } = body.record; 

    // Ambil semua token mahasiswa dari tabel zora_notifications
    const { data: users } = await supabase.from('zora_notifications').select('subscription_json');

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Tidak ada token target' });
    }

    // Format isi pesan pengingat tugas
    const payload = JSON.stringify({
      title: 'Zora: Tugas Baru Terdeteksi! 📝',
      body: `Tugas "${nama_tugas}" harus dikumpul pada ${new Date(deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Jangan telat!`
    });

    // Kirim notifikasi ke semua perangkat yang terdaftar
    const pushPromises = users.map(user => 
      webpush.sendNotification(user.subscription_json, payload).catch(err => console.error('Token expired:', err))
    );

    await Promise.all(pushPromises);

    return NextResponse.json({ success: true, message: 'Notifikasi tugas otomatis terkirim!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}