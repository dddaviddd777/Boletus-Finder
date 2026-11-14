/* Service worker de Boletus Finder.
   - Pàgina, codi i dades propis: primer la xarxa (per veure sempre la versió més nova), i la còpia guardada si no hi ha connexió.
   - Fotos d'iNaturalist, tipografies i Leaflet: primer la còpia guardada, i la xarxa només la primera vegada.
   - Rajoles del mapa de l'ICGC: igual, però se'n guarden com a màxim 500 (les que ja has mirat es veuen sense connexió).
   - Dades de pluja (Open-Meteo): sempre de la xarxa.
   Per forçar que tothom descarregui de nou els fitxers propis, canvia el número de VERSIO. */
const VERSIO = 'v1';
const APP = 'bf-app-' + VERSIO;
const EXTERNS = 'bf-externs';
const MAPA = 'bf-mapa';
const MAX_RAJOLES = 500;
const ESSENCIALS = ['./', 'index.html', 'app.js', 'dades/bolets-1.js', 'dades/bolets-2.js', 'dades/zones.js', 'dades/inat.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(ESSENCIALS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n.startsWith('bf-app-') && n !== APP).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function primerCopia(nom, req, limit) {
  return caches.open(nom).then(c => c.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') {
      c.put(req, res.clone());
      if (limit) c.keys().then(k => { if (k.length > limit) k.slice(0, k.length - limit).forEach(x => c.delete(x)); });
    }
    return res;
  })));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fitxers propis: xarxa primer, còpia si no hi ha connexió
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copia = res.clone(); caches.open(APP).then(c => c.put(req, copia)); }
          return res;
        })
        .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  // Fotos, tipografies i Leaflet: còpia guardada primer
  if (/inaturalist-open-data|fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.hostname)) {
    e.respondWith(primerCopia(EXTERNS, req));
    return;
  }

  // Rajoles del mapa: còpia guardada primer, amb límit
  if (url.hostname === 'geoserveis.icgc.cat') e.respondWith(primerCopia(MAPA, req, MAX_RAJOLES));
});
