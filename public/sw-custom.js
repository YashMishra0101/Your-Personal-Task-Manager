// Custom Service Worker logic
// Currently empty as alarm features have been removed.
// Standard PWA functionality is handled by Workbox via VitePWA plugin.

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
