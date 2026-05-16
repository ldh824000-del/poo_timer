const CACHE_NAME = 'poo-timer-v1';
const ASSETS = [
  './index.html',
  './style.css',
  './script.js',
  './sleeping.png',
  './pooping.png',
  './happy.png',
  './angry.png'
];

// 설치 시 자산 캐싱
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 네트워크 우선 전략으로 서빙
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});