/* Service worker de Boletus Finder.
   - Pàgina, codi i dades propis: es demanen a la xarxa, però si en 3 segons no ha respost (poca cobertura) o falla,
     se serveix la còpia guardada. La xarxa, quan arriba, actualitza la còpia per a la propera vegada.
   - Leaflet i tipografies: es guarden en instal·lar l'app, i després sempre surten de la còpia.
   - Fotos d'iNaturalist i rajoles del mapa de l'ICGC: primer la còpia guardada; si no hi és, la xarxa (i es guarda).
     El botó «Baixa fotos i mapa» de la pàgina les demana totes de cop perquè quedin guardades.
   - Dades de pluja (Open-Meteo): sempre de la xarxa.
   Per forçar que tothom descarregui de nou els fitxers propis, canvia el número de VERSIO. */
const VERSIO = 'v4';
const APP = 'bf-app-' + VERSIO;
const EXTERNS = 'bf-externs';
const MAPA = 'bf-mapa';
const MAX_RAJOLES = 900;
const ESPERA_PROPIS = 3000;      // ms abans de tirar de la còpia
const ESPERA_EXTERNS = 10000;    // ms abans de donar per perduda una foto o rajola que no tenim
const ESSENCIALS = ['./', 'index.html', 'app.js', 'dades/bolets-1.js', 'dades/bolets-2.js', 'dades/bolets-3.js', 'dades/zones.js', 'dades/inat.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
const EXTERNS_INICI = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=IBM+Plex+Mono:wght@400;500&display=swap'
];

const ambLimit = (promesa, ms) => new Promise((ok, ko) => { const t = setTimeout(() => ko(new Error('temps esgotat')), ms); promesa.then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); ko(e); }); });
/* Tots aquests servidors admeten CORS: demanant-ho així, les còpies ocupen el que pesen de debò.
   'no-store' evita la memòria cau del navegador: hi pot haver una còpia antiga de la mateixa foto demanada sense CORS,
   i reaprofitar-la faria fallar la petició. Aquí ja guardem les còpies nosaltres. */
const deFora = url => fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-store' });

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(APP).then(c => c.addAll(ESSENCIALS))
      .then(() => caches.open(EXTERNS))
      .then(c => Promise.all(EXTERNS_INICI.map(u => deFora(u).then(r => r.ok && c.put(u, r)).catch(() => {}))))   // si falla, ja es guardaran en fer-los servir
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n.startsWith('bf-app-') && n !== APP).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Fitxers propis: xarxa amb límit de temps, i si no, còpia */
function propi(req) {
  const xarxa = fetch(req).then(res => {
    if (res.ok) { const copia = res.clone(); caches.open(APP).then(c => c.put(req, copia)); }
    return res;
  });
  const copia = () => caches.match(req, { ignoreSearch: req.mode === 'navigate', ignoreVary: true })
    .then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
  return ambLimit(xarxa, ESPERA_PROPIS).catch(() => {
    xarxa.catch(() => {});                                   // la petició lenta pot acabar més tard; que no faci soroll
    return copia().then(r => r || xarxa);                    // sense còpia, no queda més remei que esperar la xarxa
  });
}

/* Recursos de fora: còpia primer */
function extern(nom, req, limit) {
  return caches.open(nom).then(c => c.match(req.url, { ignoreVary: true }).then(r => r || ambLimit(deFora(req.url), ESPERA_EXTERNS).then(res => {
    if (res.ok) {
      c.put(req.url, res.clone());
      if (limit) c.keys().then(k => { if (k.length > limit) k.slice(0, k.length - limit).forEach(x => c.delete(x)); });
    }
    return res;
  }))).catch(() => Response.error());
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) e.respondWith(propi(req));
  else if (/inaturalist-open-data|fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.hostname)) e.respondWith(extern(EXTERNS, req));
  else if (url.hostname === 'geoserveis.icgc.cat') e.respondWith(extern(MAPA, req, MAX_RAJOLES));
});
