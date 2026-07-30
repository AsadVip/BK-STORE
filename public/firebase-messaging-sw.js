// Firebase Cloud Messaging Service Worker (firebase-messaging-sw.js)
// Handles background push notifications when website tab is closed or browser is running.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyA6inpBytKQiD9M5OdP-8adbV9VlcMj0j4",
    authDomain: "bk-store-notificatoin-push.firebaseapp.com",
    projectId: "bk-store-notificatoin-push",
    storageBucket: "bk-store-notificatoin-push.firebasestorage.app",
    messagingSenderId: "138901384869",
    appId: "1:138901384869:web:e4f0c8f158766f0924274c",
    measurementId: "G-00NMY80L3X"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background notifications from Firebase Cloud Messaging
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'New Order Received';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'A new order has been placed on BK Store.',
        icon: '/download.png',
        badge: '/download.png',
        data: {
            url: payload.data?.click_action || payload.data?.url || '/admin/orders',
            order_number: payload.data?.order_number
        },
        tag: 'order-notification-' + Date.now(),
        renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle postMessages sent from app client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        const notificationTitle = event.data.title || '🔔 New Order Received';
        const notificationOptions = {
            body: event.data.body || 'A new order has been placed on BK Store.',
            icon: '/download.png',
            badge: '/download.png',
            data: {
                url: event.data.url || '/admin/orders',
                order_number: event.data.orderNumber
            },
            tag: 'order-notification-' + Date.now(),
            renotify: true
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
    }
});

// Handle notification click event -> open Order Details page in browser
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const clickActionUrl = event.notification.data?.url || '/admin/orders';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes('/admin') && 'focus' in client) {
                    client.navigate(clickActionUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(clickActionUrl);
            }
        })
    );
});
