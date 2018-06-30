const CONVERT_CACHE= 'converterCache-v1';
let urlsToCache = [
  '/',
  '/css/main.css',
  '/js/',
  '/img/',
  "css/css/normalize.min.css",
  'https://fonts.googleapis.com/css?family=Inconsolata:700'
];



// Service Worker Install
self.addEventListener('install', function(event) {
    console.log('[ServiceWorker] Installed')
    // Perform Instlation Steps, Wait for Promise
    event.waitUntil(
      caches.open(CONVERT_CACHE).then(function(cache) {
        console.log('[ServiceWorker] Caching allFiles...')
        return cache.addAll(urlsToCache);
      }).catch(err => console.log(err))
    );
  });
  

  self.addEventListener('fetch', (event)=> {
    event.respondWith(caches.match(event.request).then((response) =>{

      if (response !== undefined) {
        return response;
      } else {
        return fetch(event.request).then((response)=> {
          // response may be used only once
          // we need to save clone to put one copy in cache
          // and serve second one
          let responseClone = response.clone();
          
          caches.open('converterCache').then((cache)=> {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      }
    }));
  });

  
  // Update a service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => {
            return cacheName.startsWith('converter-') &&
              cacheName != CONVERT_CACHE;
            })
          .map(function(cacheName) {
                return cache.delete(cacheName)
            })
        )
      })
    );
  });