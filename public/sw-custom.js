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
    // This is where a push notification would be handled if we had a server
    // For now, we rely on local notifications
});
