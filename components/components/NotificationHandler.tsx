"use client";

import { useEffect } from 'react';
import { createClient } from '../utils/supabase/client'; 

// Fungsi pembantu untuk konversi VAPID Key ke format array biner browser
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationHandler() {
  const supabase = createClient();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    const registerNotification = async () => {
      try {
        // 1. Minta izin ke user
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // 2. Pastikan Service Worker sudah siap
        const registration = await navigator.serviceWorker.ready;

        // 3. Ambil VAPID Public Key dari Environment Variable
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID Public Key tidak ditemukan di env!");
          return;
        }

        // 4. Daftarkan perangkat ke Push Manager Browser
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        // 5. Kirim & Simpan token ke database Supabase
        const tokenString = JSON.stringify(subscription);
        
        // Ambil data lama agar tidak duplikat token yang sama
        const { data: existing } = await supabase
          .from('zora_notifications')
          .select('id')
          .eq('subscription_json', tokenString)
          .single();

        if (!existing) {
          await supabase.from('push_subscriptions').insert([
            {
              nama_user: `Zoraferrs_User_${Math.floor(Math.random() * 1000)}`,
              subscription_json: tokenString
            }
          ]);
          console.log("✅ Token push baru berhasil diamankan ke Supabase!");
        }

      } catch (error) {
        console.error("Gagal sinkronisasi token Web Push:", error);
      }
    };

    registerNotification();
  }, [supabase]);

  return null;
}