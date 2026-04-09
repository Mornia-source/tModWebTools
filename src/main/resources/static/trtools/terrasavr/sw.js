const cacheName = 'terrasavr-2024-12-17';
self.addEventListener('install', e => {
	e.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll([
				'/r/terrasavr/',
				'/r/terrasavr/doc/',
				'/r/terrasavr/style.css',
				'/r/terrasavr/script.js',
				'/r/terrasavr/img/buffs.png',
				'/r/terrasavr/img/color.png',
				'/r/terrasavr/img/nitems.png',
				'/r/terrasavr/img/overlay.png',
				'/r/terrasavr/img/shadow.png',
				'/r/terrasavr/img/side.png',
				'/r/terrasavr/img/visual.png',
				'/r/terrasavr/lang/pako_inflate.min.js',
				'/r/terrasavr/lang/lang.zip',
			]).then(function() {
				self.skipWaiting()
			})
		}).catch(function(e) {
			console.log("failed to add caches:", e)
		})
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
	event.respondWith(
		caches.open(cacheName).then(function(cache) {
			return cache.match(event.request, {ignoreSearch: true})
		}).then(function(response) {
			return response || fetch(event.request);
		}).catch(function(e) {
			console.log("failed to fetch cache:", e, event)
		})
	);
});