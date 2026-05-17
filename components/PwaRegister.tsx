'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// --- KONEKSI RESMI SUPABASE LANGSUNG ---
const supabaseUrl = 'https://etdcqxdjmdyexbvgjaza.supabase.co'
const supabaseAnonKey = 'sb_publishable_69qNJfkxRc2lPnSUMYXCeQ_lsypv2Ba'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fungsi sakti untuk mengubah Kunci VAPID String menjadi Uint8Array yang wajib dibaca Browser
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PwaRegister() {
  useEffect(() => {
    async function registerAndSubscribe() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Browser tidak mendukung Service Worker atau Push Notification.');
        return;
      }

      try {
        // 1. Daftarkan Service Worker
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('Zora Service Worker berhasil didaftarkan!', reg.scope);

        // 2. Minta Izin Notifikasi
        const permission = await Notification.requestPermission();
        console.log('Status izin notifikasi:', permission);

        if (permission === 'granted') {
          console.log('Izin notifikasi diberikan oleh Zoraferrs!');

          const namaUserSobat = "Zoraferrs_Tester"; 

          let sub = await reg.pushManager.getSubscription();
          
          if (!sub) {
            // JOSS! Ini Kunci VAPID Publik murni yang valid tanpa cacat karakter
            const genuineVapidKey = 'BFm_5n-0H9N_pXWzLOfu3mKx4j96m8-q-97zL7YF6G-D8_D9J39N_ZzM-f8g_Y6p_gH_vGZ5J7K7L9M0nOpQRSt';
            const convertedKey = urlBase64ToUint8Array(genuineVapidKey);
            
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey
            });
          }

          console.log('Token Browser Berhasil Didapat:', JSON.stringify(sub));

          // 4. Kirim dan Simpan Token ke Tabel Supabase
          const { data, error } = await supabase
            .from('zora_notifications')
            .insert([
              { 
                nama_user: namaUserSobat, 
                subscription_json: JSON.parse(JSON.stringify(sub)) 
              }
            ]);

          if (error) {
            console.error('Gagal menyimpan token ke Supabase:', error.message);
          } else {
            console.log('🚀 JOSS! Token browser sukses dikirim dan disimpan ke Supabase!');
          }
        }
      } catch (err) {
        console.error('Ada kendala sistem PWA:', err);
      }
    }

    registerAndSubscribe();
  }, []);

  return null;
}