const CACHE = 'iron-time-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => {
      if (res.ok && res.status === 200) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});

function remind() {
  return self.registration.showNotification('Iron Time', {
    body: "Time to train. Your workout is waiting.",
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'daily-reminder'
  });
}

self.addEventListener('periodicsync', e => { if (e.tag === 'daily-reminder') e.waitUntil(remind()); });
self.addEventListener('sync', e => { if (e.tag === 'sync-logs') e.waitUntil(Promise.resolve()); });
self.addEventListener('push', e => {
  let t = 'Time to train. Your workout is waiting.';
  try { if (e.data) t = e.data.text(); } catch (x) {}
  e.waitUntil(self.registration.showNotification('Iron Time', { body: t, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : clients.openWindow('./index.html?day=today')));
});
