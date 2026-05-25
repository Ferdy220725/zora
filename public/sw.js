self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Ada pembaruan informasi untukmu.',
        icon: data.icon || '/favicon.ico',
        vibrate: data.vibrate || [100, 50, 100],
        badge: '/favicon.ico',
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        }
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Zora Management', options)
      );
    } catch (error) {
      // Backup jika data yang terkirim berupa teks biasa
      const options = {
        body: event.data.text(),
        icon: '/favicon.ico'
      };
      event.waitUntil(
        self.registration.showNotification('Zora Management', options)
      );
    }
  }
});