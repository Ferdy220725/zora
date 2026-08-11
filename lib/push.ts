import { createClient } from "@/utils/supabase/client";
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
export async function subscribeUser(): Promise<{ success: boolean; reason?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, reason: "unsupported" };
  }
  let subscription: PushSubscription | null = null;
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, reason: "not-logged-in" };
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, reason: "denied" };
    }
    subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string
        ) as BufferSource,
      });
    }
    const res = await fetch("/api/save-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(subscription),
    });
    if (!res.ok) {
      await subscription.unsubscribe().catch(() => {});
      return { success: false, reason: "save-failed" };
    }
    return { success: true };
  } catch (err) {
    console.error("Gagal subscribe:", err);
    if (subscription) {
      await subscription.unsubscribe().catch(() => {});
    }
    return { success: false, reason: "error" };
  }
}
export async function getNotificationStatus(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const res = await fetch("/api/check-subscription", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.subscribed) {
      await subscription.unsubscribe().catch(() => {});
      return false;
    }
    return true;
  } catch (err) {
    console.error("Gagal cek status subscription:", err);
    return true;
  }
}