self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Focus the window if it's open, otherwise open a new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it.
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one.
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);

    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    try {
        const data = event.data.json();
        const notificationTitle = data.notification?.title || 'Task Manager Alarm';
        const notificationOptions = {
            body: data.notification?.body || 'An alarm is ringing!',
            icon: data.notification?.icon || '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200], // Extended vibration
            tag: data.data?.taskId || 'alarm',
            requireInteraction: true,
            data: {
                ...data.data,
                playSound: true, // Flag to play sound when user opens app
            },
            actions: [
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(notificationTitle, notificationOptions)
        );
    } catch (error) {
        console.error('Error handling push event:', error);
    }
});

// Note about alarm sounds:
// Service workers cannot reliably play audio due to browser security restrictions.
// The alarm sound will play when:
// 1. User opens the app from the notification (handled in the main app)
// 2. App is already open/in background (handled by TaskContext)
//
// For truly closed apps, push notifications provide visual + vibration alerts,
// and the sound plays immediately when the user taps the notification.
