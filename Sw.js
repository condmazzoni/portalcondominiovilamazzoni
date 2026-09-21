// Service Worker para PWA do Portal do Condomínio
const CACHE_NAME = 'portal-condo-v1';
const URLS_TO_CACHE = [
  '/portalcondominiovilamazzoni/',
  '/portalcondominiovilamazzoni/index.html',
  '/portalcondominiovilamazzoni/manifest.json'
];

// Instalar e cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.log('Erro ao cachear alguns recursos:', err);
        // Continuar mesmo se alguns recursos não forem cacheados
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network first, fall back to cache
self.addEventListener('fetch', event => {
  // Não cachear requisições POST ou de dados de API sensíveis
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache bem-sucedido
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Sem rede, usar cache
        return caches.match(event.request).then(response => {
          return response || new Response(
            'Você está offline. Alguns recursos podem não estar disponíveis.',
            { status: 503, statusText: 'Service Unavailable', headers: new Headers({ 'Content-Type': 'text/plain' }) }
          );
        });
      })
  );
});

// Responder a mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});