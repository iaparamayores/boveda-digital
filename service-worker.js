// ==========================================
// SERVICE WORKER - CARTERA DIGITAL
// ==========================================
// IMPORTANTE: Solo cambiar la versión (v1, v2, v3...) 
// cuando modifiques los íconos o el manifest.json.
// El index.html se actualiza solo gracias a network-first.

const CACHE_NAME = 'cartera-digital-v1';

// Assets que se cachean sí o sí (íconos y manifest)
// Usamos los nombres reales que ya tenés en tu repo
const ASSETS_ESTATICOS = [
    '/manifest.json',
    '/file_000000007760820ebe4b87c92c3be683.png',
    '/file_0000000057b8820eaa0a010ca4254b0e.png'
];

// ==========================================
// INSTALACIÓN
// ==========================================
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando assets estáticos');
                return cache.addAll(ASSETS_ESTATICOS);
            })
            .catch(err => console.log('[SW] Error cacheando:', err))
    );
    self.skipWaiting();
});

// ==========================================
// ACTIVACIÓN
// ==========================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando...');
    event.waitUntil(
        caches.keys().then(nombresCache => {
            return Promise.all(
                nombresCache
                    .filter(nombre => nombre !== CACHE_NAME)
                    .map(nombre => {
                        console.log('[SW] Borrando caché vieja:', nombre);
                        return caches.delete(nombre);
                    })
            );
        }).then(() => {
            console.log('[SW] Activado y tomando control');
            return self.clients.claim();
        })
    );
});

// ==========================================
// INTERCEPCIÓN DE PETICIONES
// ==========================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. NETWORK-FIRST para el HTML
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    console.log('[SW] Sin red, usando HTML de caché');
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 2. CACHE-FIRST para íconos, manifest y librería QR
    if (esAssetEstatico(url)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) {
                    return cached;
                }
                return fetch(event.request).then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }
});

// ==========================================
// FUNCIÓN AUXILIAR
// ==========================================
function esAssetEstatico(url) {
    // Íconos (cualquier PNG, JPG, SVG, etc.)
    if (/\.(png|jpg|jpeg|svg|webp|ico)(\?.*)?$/.test(url.pathname)) {
        return true;
    }
    // Manifest
    if (url.pathname.includes('manifest.json')) {
        return true;
    }
    // Librería QR del CDN
    if (url.hostname === 'cdnjs.cloudflare.com' && url.pathname.includes('qrcode')) {
        return true;
    }
    return false;
}