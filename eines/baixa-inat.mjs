/* Baixa d'iNaturalist, per a cada bolet de dades/bolets-*.js:
   - fins a 3 fotos amb llicència Creative Commons (amb autor i llicència),
   - les observacions verificades a Catalunya, comptades per zona (dades/zones.js) i per mes,
   i el contorn de Catalunya. Ho escriu tot a dades/inat.js.
   Ús:  node eines/baixa-inat.mjs          (torna a fer servir el que ja té a eines/.cau)
        node eines/baixa-inat.mjs --net    (ho torna a baixar tot) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAU = path.join(ARREL, 'eines', '.cau');
const CATALUNYA = 61614;                       // identificador del lloc "Catalunya" a iNaturalist
const API = 'https://api.inaturalist.org';
const NET = process.argv.includes('--net');
fs.mkdirSync(CAU, { recursive: true });

const w = {};
for (const f of ['bolets-1.js', 'bolets-2.js', 'zones.js'])
  new Function('window', fs.readFileSync(path.join(ARREL, 'dades', f), 'utf8'))(w);

const espera = ms => new Promise(r => setTimeout(r, ms));
let darrera = 0;
async function demana(url) {
  for (let i = 0; i < 5; i++) {
    const falta = 1100 - (Date.now() - darrera);
    if (falta > 0) await espera(falta);
    darrera = Date.now();
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'BoletusFinder-build/1.0', Accept: 'application/json' } });
      if (r.status === 429 || r.status >= 500) { await espera(15000 * (i + 1)); continue; }
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return await r.json();
    } catch (e) { if (i === 4) throw e; await espera(5000); }
  }
  throw new Error('Sense resposta: ' + url);
}

function dins([lat, lon], pol) {
  let d = false;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [yi, xi] = pol[i], [yj, xj] = pol[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) d = !d;
  }
  return d;
}

const LLIURES = new Set(['cc-by', 'cc-by-nc', 'cc-by-sa', 'cc-by-nc-sa', 'cc0', 'pd']);
function foto(p) {
  if (!p || !LLIURES.has(p.license_code) || !/inaturalist-open-data/.test(p.url || '')) return null;
  const m = p.url.match(/photos\/(\d+)\/\w+\.(\w+)/);
  if (!m) return null;
  const autor = p.attribution_name || ((p.attribution || '').match(/^\(c\)\s*([^,]+),/) || [])[1] || 'autor desconegut';
  return [m[1] + '/medium.' + m[2], p.license_code, autor.trim()];
}

async function unBolet(b) {
  const fitxer = path.join(CAU, b.id + '.json');
  if (!NET && fs.existsSync(fitxer)) return JSON.parse(fs.readFileSync(fitxer, 'utf8'));
  const nom = b.q || b.s, rang = b.rk || 'species';
  const cerca = await demana(`${API}/v1/taxa?q=${encodeURIComponent(nom)}&rank=${rang}&is_active=true&per_page=10`);
  const t = cerca.results.find(x => x.name.toLowerCase() === nom.toLowerCase()) || cerca.results[0];
  if (!t) { console.log('  !! no trobat:', nom); return null; }
  if (t.name.toLowerCase() !== nom.toLowerCase()) console.log(`  ?? ${nom} -> ${t.name}`);

  const detall = (await demana(`${API}/v1/taxa/${t.id}`)).results[0];
  const fotos = [], vistes = new Set();
  const afegeix = p => { const f = foto(p); if (f && !vistes.has(f[0]) && fotos.length < 3) { vistes.add(f[0]); fotos.push(f); } };
  afegeix(detall.default_photo);
  (detall.taxon_photos || []).forEach(tp => afegeix(tp.photo));
  if (fotos.length < 3) {            // completa amb fotos fetes a Catalunya
    const o = await demana(`${API}/v1/observations?taxon_id=${t.id}&place_id=${CATALUNYA}&quality_grade=research&photo_license=cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa,cc0&order_by=votes&per_page=12`);
    o.results.forEach(ob => afegeix(ob.photos && ob.photos[0]));
  }

  const z = {}; let n = 0, total = 0;
  for (let pag = 1; pag <= 10; pag++) {
    const o = await demana(`${API}/v2/observations?taxon_id=${t.id}&place_id=${CATALUNYA}&quality_grade=research&per_page=200&page=${pag}&fields=location,obscured`);
    total = o.total_results;
    for (const ob of o.results) {
      n++;
      if (ob.obscured || !ob.location) continue;
      const pt = ob.location.split(',').map(Number);
      const zona = w.ZONES.find(zz => dins(pt, zz.p));
      if (zona) z[zona.id] = (z[zona.id] || 0) + 1;
    }
    if (n >= total || !o.results.length) break;
  }
  const h = await demana(`${API}/v1/observations/histogram?taxon_id=${t.id}&place_id=${CATALUNYA}&quality_grade=research&date_field=observed&interval=month_of_year`);
  const mesos = Array.from({ length: 12 }, (_, i) => h.results.month_of_year[i + 1] || 0);

  const res = { t: t.id, nom: t.name, ph: fotos, n: total, z, mesos };
  fs.writeFileSync(fitxer, JSON.stringify(res));
  return res;
}

/* Contorn de Catalunya, simplificat (Douglas-Peucker) */
function simplifica(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    const u = l ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)) : 0;
    const d = Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy);
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [a, b];
  return simplifica(pts.slice(0, idx + 1), tol).slice(0, -1).concat(simplifica(pts.slice(idx), tol));
}
async function contorn() {
  const fitxer = path.join(CAU, '_contorn.json');
  if (!NET && fs.existsSync(fitxer)) return JSON.parse(fs.readFileSync(fitxer, 'utf8'));
  const g = (await demana(`${API}/v1/places/${CATALUNYA}`)).results[0].geometry_geojson;
  const anells = g.type === 'MultiPolygon' ? g.coordinates.map(p => p[0]) : [g.coordinates[0]];
  const gran = anells.sort((a, b) => b.length - a.length)[0];
  const mig = Math.floor(gran.length / 2);
  const s = simplifica(gran.slice(0, mig + 1), 0.006).concat(simplifica(gran.slice(mig), 0.006).slice(1));
  const res = s.map(([lon, lat]) => [+lat.toFixed(3), +lon.toFixed(3)]);
  fs.writeFileSync(fitxer, JSON.stringify(res));
  return res;
}

const sp = {};
let i = 0;
for (const b of w.BOLETS) {
  i++;
  try {
    const r = await unBolet(b);
    if (r) { sp[b.id] = r; console.log(`${i}/${w.BOLETS.length} ${b.id}: ${r.nom} · ${r.ph.length} fotos · ${r.n} obs · ${Object.keys(r.z).length} zones`); }
  } catch (e) { console.log(`${i}/${w.BOLETS.length} ${b.id}: ERROR ${e.message}`); }
}
const c = await contorn();
console.log('contorn:', c.length, 'punts');
const avui = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ARREL, 'dades', 'inat.js'),
  `/* Generat per eines/baixa-inat.mjs el ${avui}. No l'editis a mà.\n   Fotos i observacions d'iNaturalist (inaturalist.org), llicències Creative Commons. */\n` +
  `window.INAT_DATA = '${avui}';\nwindow.INAT = ${JSON.stringify(sp)};\nwindow.CONTORN = ${JSON.stringify(c)};\n`);
console.log('Fet: dades/inat.js');
