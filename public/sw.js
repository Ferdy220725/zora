self.addEventListener('push', function(event) {
  let data = { title: 'Zora System', body: 'Ada pemberitahuan baru untukmu!' };

  if (event.data) {
    try {
      // Coba baca sebagai JSON dulu
      data = event.data.json();
    } catch (e) {
      // Kalau gagal (berarti teks mentah biasa seperti bawaan DevTools), pakai teksnya langsung
      data = { title: 'Zora System', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // Pastikan file ikon ini ada di folder public kamu ya
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});