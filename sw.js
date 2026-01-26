
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Basic push listener for future-proofing
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Fridge Update', body: 'Check your household items!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png'
    })
  );
});
