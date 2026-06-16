 
// Firebase Messaging Service Worker + PWA install support
// This runs in the background and handles push notifications when the app is closed.

// Take control immediately on install/activate so new deploys don't get stuck
// behind an old SW waiting for every tab to close.
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch handler — Chrome requires a functional one for PWA install prompt.
// We only intercept top-level navigations (HTML) to do a network-first pass
// so users never get served stale index.html pointing at deleted JS chunks.
// Everything else falls through to the browser's default networking — proxying
// arbitrary requests through the SW just turns transient failures into
// uncaught "Failed to fetch" rejections.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => fetch(event.request))
    );
  }
});

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// NOTE (intern scaffold): credentials removed. Push notifications are not part
// of the Souk assignment and need no real project. If you ever wire this up,
// use your OWN throwaway Firebase project — never a production one.
firebase.initializeApp({
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Handle background notifications (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, click_action } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || 'ZaryahPlus', {
    body: body || 'You have a new notification',
    icon: icon || '/favicon.png',
    badge: '/favicon.png',
    tag: data.tag || 'zaryahplus-notification',
    data: { url: click_action || data.url || '/' },
    actions: data.action_text ? [{ action: 'open', title: data.action_text }] : [],
  });
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes('zaryahplus') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new tab
      return clients.openWindow(url);
    })
  );
});
