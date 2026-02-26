const SW_VERSION = "3.0";
console.log("[SW] Versiyon:", SW_VERSION);

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCPQq0I_KmoMR9C1GmtRqo5Dt-t8ZrtxYQ",
  authDomain: "smartattendancenotifications.firebaseapp.com",
  projectId: "smartattendancenotifications",
  storageBucket: "smartattendancenotifications.firebasestorage.app",
  messagingSenderId: "486884846821",
  appId: "1:486884846821:web:bdcf953e0cc3c698e0780c"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mesaj alındı:', payload);

  const baseUrl = self.location.origin;
  const title = payload.data?.title || "Yeni Yoklama Başladı!";
  const body  = payload.data?.body  || "Lütfen derse katılımınızı onaylayın.";

  return self.registration.showNotification(title, {
    body: body,
    icon: `${baseUrl}/daulogo.jpeg`,
    badge: `${baseUrl}/daulogo.jpeg`,
    tag: 'attendance-notification',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: { url: `${baseUrl}/student/home` }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/student/home') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});