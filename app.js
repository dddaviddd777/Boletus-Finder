/* Boletus Finder · lògica de l'aplicació.
   Les dades són a dades/bolets-*.js, dades/zones.js i dades/inat.js (aquest últim, generat per eines/baixa-inat.mjs). */
const $ = s => document.querySelector(s);
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/·/g, '');

const BOLETS = window.BOLETS, ZONES = window.ZONES, FONTS = window.FONTS;
const INAT = window.INAT || {}, CONTORN = window.CONTORN || [];
const B = Object.fromEntries(BOLETS.map(b => [b.id, b]));
const Z = Object.fromEntries(ZONES.map(z => [z.id, z]));
const ARA = new Date().getMonth() + 1;

const CATS = {
  ex: { n: 'Excel·lents', u: 'Excel·lent', intro: '<b>Excel·lents.</b> Els bolets més apreciats a la cuina catalana. Val la pena aprendre a reconèixer-los bé, i també els seus dobles perillosos.' },
  bo: { n: 'Bons', u: 'Bo', intro: '<b>Bons comestibles.</b> Bolets de cistell de tota la vida, bons per a guisats, truites i arrossos.' },
  cond: { n: 'Amb condicions', u: 'Amb condicions', intro: '<b>Comestibles amb condicions.</b> Només es poden menjar ben cuits, o joves, o traient-ne una part. Crus o mal preparats fan mal.' },
  sv: { n: 'Sense valor', u: 'Sense valor', intro: '<b>Sense valor culinari.</b> No són perillosos, però són amargs o insípids. Convé conèixer-los perquè s\'assemblen a bolets bons.' },
  tox: { n: 'Tòxics', u: 'Tòxic', intro: '<b>Tòxics.</b> Provoquen des de trastorns digestius fins a intoxicacions greus. Molts s\'assemblen a un bolet comestible.' },
  mort: { n: 'Mortals', u: 'Mortal', intro: '<b>Mortals.</b> Un sol exemplar pot matar una persona. Són pocs: aprèn-te\'ls de memòria abans de collir res.' }
};
const ICONS = {
  ex: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6L3.200 9.400l6.100-.8z"/></svg>',
  bo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c0-5 4-8 9-8s9 3 9 8z"/><path d="M10 12v6a2 2 0 0 0 4 0v-6"/></svg>',
  cond: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M2 11h20M9 7c0-1.500 1-1.500 1-3M14 7c0-1.500 1-1.500 1-3"/></svg>',
  sv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
  tox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20z"/><path d="M12 10v5M12 17.500v.010"/></svg>',
  mort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11a7 7 0 0 1 14 0c0 2.500-1 4-2.500 5v3h-9v-3C6 15 5 13.500 5 11z"/><circle cx="9.500" cy="11.500" r="1.200"/><circle cx="14.500" cy="11.500" r="1.200"/><path d="M11 19v-2M13 19v-2"/></svg>'
};
const ARBRES = { pr: 'pi roig', pn: 'pi negre', pb: 'pi blanc', pz: 'pinassa', pp: 'pi pinyer', pm: 'pinastre', av: 'avet', fg: 'faig', ro: 'roure', al: 'alzina', su: 'surera', ca: 'castanyer', bd: 'bedoll', pt: 'prats', rb: 'ribera' };
const HABS = {
  pineda: { n: 'Pinedes', h: ['pr', 'pn', 'pb', 'pz', 'pp', 'pm'] },
  alzinar: { n: 'Alzinars i suredes', h: ['al', 'su'] },
  caduc: { n: 'Fagedes, rouredes i castanyedes', h: ['fg', 'ro', 'ca', 'bd'] },
  avet: { n: 'Avetoses', h: ['av'] },
  prat: { n: 'Prats i pastures', h: ['pt'] },
  ribera: { n: 'Riberes i soques', h: ['rb'] }
};
const MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const MES3 = ['gen.', 'febr.', 'març', 'abr.', 'maig', 'juny', 'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.'];
const NIVELL = ['', 'Ocasional', 'Bona zona', 'Molt bona zona'];
const SOL = { a: 'Àcid (granit, pissarra)', c: 'Calcari', m: 'Barrejat' };
const PLUJA = ['', 'Zona seca', 'Pluja mitjana', 'Zona humida'];
const LIC = { 'cc-by': 'CC BY', 'cc-by-sa': 'CC BY-SA', 'cc-by-nc': 'CC BY-NC', 'cc-by-nc-sa': 'CC BY-NC-SA', 'cc0': 'CC0', 'pd': 'Domini públic' };
const comestible = b => b.c === 'ex' || b.c === 'bo';

/* ---------- Fotos ---------- */
const fotos = b => (INAT[b.id] && INAT[b.id].ph) || [];
const imgURL = (f, mida) => 'https://inaturalist-open-data.s3.amazonaws.com/photos/' + f[0].replace('medium', mida || 'medium');
const credit = (b, f) => `Foto: ${esc(f[2])} · ${LIC[f[1]] || f[1]} · <a href="https://www.inaturalist.org/taxa/${INAT[b.id].t}" target="_blank" rel="noopener">iNaturalist</a>`;
const thumb = b => { const f = fotos(b)[0]; return f ? `<img src="${imgURL(f, 'small')}" alt="" loading="lazy">` : ''; };

/* ---------- Temporada ---------- */
function temporada(m) {
  const on = Array.from({ length: 12 }, (_, i) => m.includes(i + 1));
  if (on.every(Boolean)) return 'Tot l\'any';
  let ini = 0; while (on[ini] && on[(ini + 11) % 12]) ini = (ini + 11) % 12;   // comença en un mes sense bolet abans
  while (!on[ini]) ini = (ini + 1) % 12;
  const trams = []; let i = ini, n = 0;
  while (n < 12) {
    if (on[i]) { let j = i; while (on[(j + 1) % 12] && n < 11) { j = (j + 1) % 12; n++; } trams.push(i === j ? MES3[i] : `${MES3[i]}–${MES3[j]}`); i = (j + 1) % 12; n++; }
    else { i = (i + 1) % 12; n++; }
  }
  return trams.join(' i ');
}

/* ---------- Nivell d'un bolet en una zona ----------
   Retorna {n: 0-3, ev: 'doc' | 'obs' | 'hab', src, obs}.
   1) Si una font cita el bolet per a la zona, mana la font.
   2) Si no, es dedueix de l'hàbitat: arbres, altitud, sòl i pluja.
   3) Les observacions d'iNaturalist dins la zona confirmen la presència i poden apujar el nivell. */
function perHabitat(b, z) {
  if (b.nomesDoc) return 0;
  let s = Math.max(0, ...b.h.map(h => z.t[h] || 0));
  if (!s) return 0;
  const solap = Math.min(b.alt[1], z.alt[1]) - Math.max(b.alt[0], z.alt[0]);
  if (solap <= 0) return 0;
  const part = solap / (z.alt[1] - z.alt[0]);                 // quina part dels boscos de la zona queda dins l'altitud del bolet
  if (part < 0.2) s -= 2; else if (part < 0.4) s -= 1;
  if (b.sol && z.s !== 'm' && b.sol !== z.s) s -= 2;
  if (z.r < b.hum) s -= b.hum - z.r;
  if (b.cap) s = Math.min(s, b.cap);
  return Math.max(0, Math.min(3, s));
}
const cau = {};
function nivell(b, z) {
  const k = b.id + '|' + z.id;
  if (cau[k]) return cau[k];
  const obs = (INAT[b.id] && INAT[b.id].z && INAT[b.id].z[z.id]) || 0;
  let r;
  if (z.doc && z.doc[b.id]) r = { n: z.doc[b.id][0], ev: 'doc', src: z.doc[b.id][1], obs };
  else {
    // Sense cap font ni observació, la deducció per hàbitat no arriba mai a 'molt bona zona'.
    const h = perHabitat(b, z);
    let n = obs ? (h === 3 ? (obs >= 3 ? 3 : 2) : h === 2 ? 2 : 1) : [0, 1, 1, 2][h];
    if (obs >= 5) n = Math.max(n, 2);
    r = { n, ev: obs ? 'obs' : 'hab', obs };
  }
  return cau[k] = r;
}
const evTxt = r => r.ev === 'doc' ? 'Citat per fonts' + (r.obs ? ` · ${r.obs} obs.` : '') : r.ev === 'obs' ? `${r.obs} observaci${r.obs === 1 ? 'ó' : 'ons'}` : 'Deduït per l\'hàbitat';
const enMes = (b, mes) => !mes || b.m.includes(+mes);
/* La temporada depèn de l'altitud: a l'alta muntanya el fred l'acaba abans, i a terra baixa la tardor comença més tard. */
function enMesZona(b, z, mes) {
  if (!mes) return true;
  const m = +mes;
  if (!b.m.includes(m)) return false;
  if (z.alt[0] >= 900) {
    if (m === 11) return b.m.includes(12);
    if (m === 12 || m === 1 || m === 2) return b.m.includes(3);
  }
  if (z.alt[1] <= 1000 && (m === 8 || m === 9)) return b.m.includes(m - 1);
  return true;
}

/* ---------- Estat ---------- */
const state = { c: '', q: '', mes: String(ARA), hab: '', z: '', sp: '', mode: 'bolets' };

function drawCats() {
  const n = {}; BOLETS.forEach(b => n[b.c] = (n[b.c] || 0) + 1);
  $('#cats').innerHTML = Object.entries(CATS).map(([k, v]) => `<button class="cat" data-c="${k}" aria-pressed="${state.c === k}">${ICONS[k]}<b>${v.n}</b><span>${n[k]} bolets</span></button>`).join('');
  $('#catintro').innerHTML = state.c ? CATS[state.c].intro : '<b>Tots els bolets.</b> Tria una categoria a dalt per veure només els excel·lents, els tòxics o els mortals. Per defecte es mostren els que surten aquest mes.';
}
$('#cats').addEventListener('click', e => { const b = e.target.closest('.cat'); if (!b) return; state.c = state.c === b.dataset.c ? '' : b.dataset.c; drawCats(); drawGrid(); });

function drawSelects() {
  $('#mes').innerHTML = `<option value="${ARA}">Ara (${MESOS[ARA - 1]})</option><option value="">Tot l'any</option>` + MESOS.map((m, i) => `<option value="${i + 1}">${m[0].toUpperCase() + m.slice(1)}</option>`).filter((_, i) => i + 1 !== ARA).join('');
  $('#hab').innerHTML = '<option value="">Qualsevol bosc</option>' + Object.entries(HABS).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('');
  const grup = (c, t) => `<optgroup label="${t}">${BOLETS.filter(b => b.c === c).sort((a, b) => a.ca.localeCompare(b.ca, 'ca')).map(b => `<option value="${b.id}">${esc(b.ca)}</option>`).join('')}</optgroup>`;
  $('#spsel').innerHTML = '<option value="">Tots els bolets bons de temporada</option>' + Object.entries(CATS).map(([k, v]) => grup(k, v.n)).join('');
}
$('#q').addEventListener('input', e => { state.q = e.target.value; drawGrid(); });
$('#mes').addEventListener('change', e => { state.mes = e.target.value; drawGrid(); paintMap(); drawZoneInfo(); });
$('#hab').addEventListener('change', e => { state.hab = e.target.value; drawGrid(); });
$('#spsel').addEventListener('change', e => { state.sp = e.target.value; setMode('bolets'); });

function filtered() {
  const q = norm(state.q.trim()), z = state.z && Z[state.z];
  return BOLETS.filter(b => {
    if (state.c && b.c !== state.c) return false;
    if (!q && !enMes(b, state.mes)) return false;                  // si cerques per nom, no filtra per mes
    if (state.hab && !b.h.some(h => HABS[state.hab].h.includes(h))) return false;
    if (q && !norm([b.ca, b.an, b.es, b.s, CATS[b.c].n].join(' ')).includes(q)) return false;
    if (z && (nivell(b, z).n < 1 || (!q && !enMesZona(b, z, state.mes)))) return false;
    return true;
  }).sort((a, b) => z ? (comestible(b) - comestible(a)) || nivell(b, z).n - nivell(a, z).n : 0);
}
function drawGrid() {
  const list = filtered(), z = state.z && Z[state.z];
  const quan = state.q.trim() ? '' : state.mes ? (+state.mes === ARA ? ' que surten ara' : ` al ${MESOS[state.mes - 1]}`.replace('al a', 'a l\'a').replace('al o', 'a l\'o')) : '';
  // Amb una zona triada, la llista es parteix en grups perquè quadri amb el recompte del mapa (que només compta el primer grup)
  const grups = z ? [
    ['Bons que s\'hi fan bé', 'bons que s\'hi fan bé', list.filter(b => comestible(b) && nivell(b, z).n >= 2)],
    ['Bons, però només ocasionals', 'bons ocasionals', list.filter(b => comestible(b) && nivell(b, z).n < 2)],
    ['No són per menjar: amb condicions, sense valor, tòxics i mortals', 'que no són per menjar', list.filter(b => !comestible(b))]
  ].filter(g => g[2].length) : [['', '', list]];
  $('#count').textContent = `${list.length} bolets${quan}${z ? ' a ' + z.n : ''}` + (z && list.length ? ': ' + grups.map(g => `${g[2].length} ${g[1]}`).join(', ') : '');
  if (!list.length) { $('#grid').innerHTML = '<div class="empty">Cap bolet coincideix amb aquests filtres. Prova amb «Tot l\'any», canvia de categoria o tria una altra zona.</div>'; return; }
  const fitxa = b => {
    const f = fotos(b)[0], r = z && nivell(b, z);
    return `<button class="card" data-c="${b.c}" data-id="${b.id}">
    <div class="photo">${ICONS[b.c]}${f ? `<img src="${imgURL(f)}" alt="" loading="lazy" onload="this.classList.add('ok')">` : ''}<span class="band">${CATS[b.c].u}</span></div>
    <div class="body"><h3>${esc(b.ca)}</h3><div class="sci">${esc(b.s)}</div><div class="es">${esc(temporada(b.m))}</div>
    <div class="tags">${r ? `<span class="tag n${r.n}">${NIVELL[r.n]}</span>` : ''}${b.m.includes(ARA) ? '<span class="tag ara">Surt ara</span>' : ''}</div></div></button>`;
  };
  $('#grid').innerHTML = grups.map(([t, , g]) => (t ? `<h2 class="sec">${t} <span>${g.length}</span></h2>` : '') + g.map(fitxa).join('')).join('');
}
$('#grid').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) openBolet(c.dataset.id); });

/* ---------- Mapa ---------- */
let map, capes = {};
function initMap() {
  map = L.map('map', { minZoom: 7, maxZoom: 14, maxBounds: [[39.9, -0.6], [43.4, 4.2]], zoomSnap: 0.25 });
  const icgc = n => L.tileLayer(`https://geoserveis.icgc.cat/servei/catalunya/mapa-base/wmts/${n}/MON3857NW/{z}/{x}/{y}.png`, { maxZoom: 14, attribution: 'Mapa: <a href="https://www.icgc.cat" target="_blank" rel="noopener">ICGC</a>' });
  const topo = icgc('topografic-gris').addTo(map);
  L.control.layers({ 'Topogràfic': topo, 'Topogràfic en color': icgc('topografic'), 'Ortofoto': icgc('orto') }, null, { position: 'topright', collapsed: true }).addTo(map);
  if (CONTORN.length) L.polygon(CONTORN, { className: 'contorn', interactive: false }).addTo(map);
  ZONES.forEach(z => {
    const p = L.polygon(z.p, { className: 'zona' }).addTo(map);
    p.on('click', () => pickZone(z.id));
    p.bindTooltip(() => tipZona(z), { sticky: true, direction: 'top' });
    capes[z.id] = p;
  });
  encaixa();
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { map.invalidateSize(); if (!state.z) encaixa(); }, 200); });
}
const encaixa = () => map.fitBounds([[40.52, 0.16], [42.87, 3.33]], { animate: false });
function totsAra(z) { return BOLETS.filter(b => enMesZona(b, z, state.mes) && nivell(b, z).n >= 1); }
function bonsAra(z) { return BOLETS.filter(b => comestible(b) && enMesZona(b, z, state.mes) && nivell(b, z).n >= 2); }
function tipZona(z) {
  let sub;
  if (state.mode === 'pluja') sub = pluja[z.id] ? PL[pluja[z.id].e].n : 'Sense dades de pluja';
  else if (state.sp) sub = NIVELL[nivell(B[state.sp], z).n] || 'Poc probable';
  else { const n = bonsAra(z).length; const t = totsAra(z).length, quan = state.mes ? (+state.mes === ARA ? 'ara' : MES3[state.mes - 1]) : 'durant l\'any'; sub = t ? `${n} bons que s'hi fan bé ${quan} · ${t} bolets en total` : 'Res de temporada'; }
  return `${esc(z.n)}<small>${esc(sub)}</small>`;
}
function paintMap() {
  if (!map) return;
  const max = Math.max(1, ...ZONES.map(z => bonsAra(z).length));
  ZONES.forEach(z => {
    let cls;
    if (state.mode === 'pluja') cls = pluja[z.id] ? 'p-' + pluja[z.id].e : 'f0';
    else if (state.sp) cls = 'f' + nivell(B[state.sp], z).n;
    else { const n = bonsAra(z).length; cls = 'f' + (!n ? 0 : n >= max * 0.66 ? 3 : n >= max * 0.33 ? 2 : 1); }
    const el = capes[z.id].getElement();
    if (el) el.setAttribute('class', `zona leaflet-interactive ${cls}${state.z === z.id ? ' sel' : ''}`);
  });
  if (state.z) capes[state.z].bringToFront();
  $('#legend').innerHTML = state.mode === 'pluja'
    ? Object.entries(PL).map(([k, v]) => `<span><i style="background:var(--p-${k})"></i>${v.curt}</span>`).join('')
    : state.sp ? '<span><i></i>Molt bona zona</span><span><i class="l2"></i>Bona zona</span><span><i class="l1"></i>Ocasional</span>'
      : '<span><i></i>Molts bolets bons</span><span><i class="l2"></i>Força</span><span><i class="l1"></i>Pocs</span>';
  $('#mapnote').textContent = state.mode === 'pluja'
    ? (plujaEstat === 'ok' ? 'Estimació a partir de la pluja i la temperatura dels últims 21 dies al centre de cada zona (Open-Meteo). És orientativa: una obaga i una solana de la mateixa serra poden anar molt diferent.' : plujaEstat === 'err' ? 'No s\'han pogut carregar les dades de pluja. Cal connexió.' : 'Carregant les dades de pluja…')
    : state.sp ? `Zones on es fa: ${B[state.sp].ca.toLowerCase()}. Contorns aproximats.`
      : 'Com més fosca la zona, més bolets bons hi surten en l\'època triada. Contorns aproximats.';
}
function setMode(m) {
  state.mode = m;
  $('#m-bolets').setAttribute('aria-pressed', m === 'bolets'); $('#m-pluja').setAttribute('aria-pressed', m === 'pluja');
  if (m === 'pluja') carregaPluja();
  paintMap(); drawZoneInfo();
}
$('#m-bolets').addEventListener('click', () => setMode('bolets'));
$('#m-pluja').addEventListener('click', () => setMode('pluja'));
function pickZone(id) {
  state.z = state.z === id ? '' : id; paintMap(); drawZoneInfo(); drawGrid();
  if (state.z && map.getZoom() < 9) map.fitBounds(capes[id].getBounds().pad(1.2), { maxZoom: 10 });
}
$('#allcat').addEventListener('click', () => { state.z = ''; paintMap(); drawZoneInfo(); drawGrid(); encaixa(); });

function plujaHTML(z) {
  const p = pluja[z.id];
  if (!p) return plujaEstat === 'err' ? '' : '<div class="rain"><i></i><div>Carregant la pluja recent…</div></div>';
  return `<div class="rain ${p.e}"><i></i><div><b>${PL[p.e].n}</b><small>${p.p21} mm en 21 dies · ${p.dies == null ? 'cap pluja forta' : p.dies === 0 ? 'ha plogut avui' : `última pluja forta fa ${p.dies} dies`} · mínima ${p.tmin} °C</small></div></div>`;
}
function drawZoneInfo() {
  $('#allcat').setAttribute('aria-pressed', !state.z);
  const el = $('#zoneinfo');
  if (state.z) {
    const z = Z[state.z], bons = bonsAra(z);
    if (!plujaEstat) carregaPluja();
    el.innerHTML = `<b>${esc(z.n)}</b><span class="sub">${esc(z.lloc)} · ${esc(z.co)}</span>${esc(z.d)}
      ${bons.length ? `<br><b style="font-size:13.500px;margin-top:6px">Bons que s'hi fan bé (${bons.length} de ${totsAra(z).length} bolets)</b>${bons.map(b => esc(b.ca.toLowerCase())).join(', ')}` : ''}
      ${plujaHTML(z)}<button class="btn main" id="zfitxa">Fitxa de la zona</button>`;
    $('#zfitxa').onclick = () => openZona(z.id);
  } else if (state.sp && state.mode === 'bolets') {
    const b = B[state.sp], top = ZONES.map(z => [z, nivell(b, z)]).filter(x => x[1].n >= 2).sort((a, c) => c[1].n - a[1].n || c[1].obs - a[1].obs);
    el.innerHTML = `<b>${esc(b.ca)}</b>${top.length ? 'Millors zones: ' + top.slice(0, 6).map(x => esc(x[0].n)).join(', ') + '.' : 'No té cap zona destacada: surt de manera dispersa.'} Toca una zona per veure què més hi surt.`;
  } else el.innerHTML = '<b>Tot Catalunya</b>Toca una zona del mapa per veure quins bolets s\'hi fan, o tria un bolet al desplegable per veure on surt.';
}

/* ---------- Pluja recent (Open-Meteo) ---------- */
const PL = {
  bo: { n: 'Bones condicions: ha plogut bé fa una o dues setmanes', curt: 'Bones condicions' },
  aviat: { n: 'Ha plogut fa poc: els bolets trigaran una o dues setmanes', curt: 'Pluja recent' },
  reg: { n: 'Condicions regulars: ha plogut poc', curt: 'Regular' },
  sec: { n: 'Massa sec: fa setmanes que no plou prou', curt: 'Sec' },
  gel: { n: 'Glaçades fortes: a la part alta la temporada s\'ha acabat', curt: 'Glaçades' }
};
let pluja = {}, plujaEstat = '';
const centre = z => { const a = z.p.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]); return [a[0] / z.p.length, a[1] / z.p.length]; };
function estatPluja(prec, tmin) {                    // prec i tmin: del dia més antic al d'avui
  const n = prec.length, v = prec.map(x => x || 0);
  const recent = v.slice(n - 4).reduce((a, b) => a + b, 0), antic = v.slice(0, n - 4).reduce((a, b) => a + b, 0);
  let dies = null; for (let i = n - 1; i >= 0; i--) if (v[i] >= 10) { dies = n - 1 - i; break; }
  const t3 = Math.min(...tmin.slice(n - 4).filter(x => x != null));
  const e = t3 <= -3 ? 'gel' : antic >= 30 ? 'bo' : recent >= 20 ? 'aviat' : antic + recent >= 15 ? 'reg' : 'sec';
  return { e, p21: Math.round(antic + recent), dies, tmin: Math.round(t3) };
}
async function carregaPluja() {
  if (plujaEstat) return;
  plujaEstat = 'carregant';
  const acaba = () => { paintMap(); drawZoneInfo(); const el = $('#zrain'); if (el) el.innerHTML = plujaHTML(Z[el.dataset.z]); };
  try {
    const desat = JSON.parse(localStorage.getItem('bf-pluja') || 'null');
    if (desat && Date.now() - desat.t < 3 * 3600e3) { pluja = desat.d; plujaEstat = 'ok'; acaba(); return; }
  } catch (e) { /* sense emmagatzematge: es torna a demanar */ }
  try {
    const c = ZONES.map(centre);
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + c.map(p => p[0].toFixed(3)).join(',') + '&longitude=' + c.map(p => p[1].toFixed(3)).join(',') +
      '&elevation=' + ZONES.map(z => Math.round((z.alt[0] + z.alt[1]) / 2)).join(',') + '&daily=precipitation_sum,temperature_2m_min&past_days=21&forecast_days=1&timezone=Europe%2FMadrid';
    const r = await fetch(url); if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    (Array.isArray(d) ? d : [d]).forEach((x, i) => pluja[ZONES[i].id] = estatPluja(x.daily.precipitation_sum, x.daily.temperature_2m_min));
    plujaEstat = 'ok';
    try { localStorage.setItem('bf-pluja', JSON.stringify({ t: Date.now(), d: pluja })); } catch (e) { /* tant és */ }
  } catch (e) { plujaEstat = 'err'; setTimeout(() => { if (plujaEstat === 'err') plujaEstat = ''; }, 60000); }
  acaba();
}

/* ---------- Mapa petit de les fitxes ---------- */
const PX = ([lat, lon]) => [((lon - 0.1) * 74.5).toFixed(1), ((42.92 - lat) * 100).toFixed(1)];
const camí = pts => 'M' + pts.map(p => PX(p).join(',')).join('L') + 'Z';
function miniMapa(b) {
  return `<svg class="mini" viewBox="0 0 246 246" role="img" aria-label="Mapa de Catalunya amb les zones on surt">${CONTORN.length ? `<path class="land" d="${camí(CONTORN)}"/>` : ''}` +
    ZONES.map(z => `<path class="z f${nivell(b, z).n}" d="${camí(z.p)}"/>`).join('') + '</svg>';
}

/* ---------- Panell: fitxa d'un bolet ---------- */
function calendari(b) {
  const d = (INAT[b.id] && INAT[b.id].mesos) || [], max = Math.max(1, ...d);
  return `<div class="cal">${MESOS.map((m, i) => `<div class="${b.m.includes(i + 1) ? 'on' : ''}${i + 1 === ARA ? ' now' : ''}" title="${m}: ${d[i] || 0} observacions"><div class="bar"><i style="height:${Math.round((d[i] || 0) / max * 100)}%"></i></div><span>${m[0].toUpperCase()}</span></div>`).join('')}</div>
  <p class="calnote">Mesos acolorits: temporada habitual. Barres: ${INAT[b.id] ? INAT[b.id].n : 0} observacions verificades a Catalunya, per mes (iNaturalist).</p>`;
}
function onTrobar(b) {
  const per = n => ZONES.map(z => [z, nivell(b, z)]).filter(x => x[1].n === n).sort((a, c) => (c[1].ev === 'doc') - (a[1].ev === 'doc') || c[1].obs - a[1].obs);
  const fila = n => { const g = per(n); return g.length ? `<li><b>${NIVELL[n]}</b>${g.map(([z, r]) => `<button data-z="${z.id}" title="${esc(evTxt(r))}">${esc(z.n)}</button>${r.ev === 'doc' ? '*' : ''}`).join(', ')}</li>` : ''; };
  const cos = [3, 2, 1].map(fila).join('');
  if (b.nomesDoc && !cos) return '<p>No es mostra en zones concretes.</p>';
  return `<div class="where">${miniMapa(b)}<ul>${cos || '<li>Cap zona destacada.</li>'}<li><b>Llegenda</b>* citat per alguna font. La resta, deduït de l\'hàbitat o d\'observacions.</li></ul></div>`;
}
function avisos(b) {
  const a = [];
  if (b.c === 'mort') a.push('<div class="note dead"><b>Bolet mortal.</b> No el posis mai al cistell amb els altres: un sol tros barrejat amb els bons pot ser suficient.</div>');
  if (b.c === 'tox') a.push('<div class="note warn"><b>Bolet tòxic.</b> No es menja de cap manera.</div>');
  if (b.c === 'cond') a.push('<div class="note"><b>Comestible amb condicions.</b> Llegeix bé com s\'ha de preparar abans de menjar-lo.</div>');
  if (b.av) a.push(`<div class="note ${comestible(b) || b.c === 'cond' ? '' : b.c === 'mort' ? 'dead' : 'warn'}"><b>Compte:</b> ${esc(b.av)}</div>`);
  return a.join('');
}
function openBolet(id) {
  const b = B[id], fs = fotos(b);
  const conf = (b.conf || []).map(([cid, txt]) => {
    const o = cid && B[cid];
    return o ? `<button data-b="${o.id}" data-c="${o.c}"><span class="ph">${thumb(o)}</span><span><b>${esc(o.ca)}</b> <span class="tag cat">${CATS[o.c].u}</span><span class="t">${esc(txt)}</span></span></button>`
      : `<div class="row"><span class="t">${esc(txt)}</span></div>`;
  }).join('');
  const menja = comestible(b) || b.c === 'cond';
  show(`<div class="sheet" data-c="${b.c}" role="dialog" aria-modal="true" aria-labelledby="sh-t">
    <div class="hero">${ICONS[b.c]}${fs[0] ? `<img id="sh-img" src="${imgURL(fs[0], 'large')}" alt="${esc(b.ca)}">` : ''}<button class="close" id="close" aria-label="Tanca">×</button></div>
    ${fs.length > 1 ? `<div class="thumbs">${fs.map((f, i) => `<button data-i="${i}" aria-pressed="${i === 0}" aria-label="Foto ${i + 1}"><img src="${imgURL(f, 'small')}" alt=""></button>`).join('')}</div>` : ''}
    <div class="credit" id="sh-credit">${fs[0] ? credit(b, fs[0]) : 'Sense foto disponible amb llicència lliure.'}</div>
    <div class="inner">
      <div class="eyebrow">${CATS[b.c].u}</div>
      <h2 id="sh-t">${esc(b.ca)}</h2><div class="sci">${esc(b.s)}</div>
      <div class="es">També: ${esc(b.an)} · Castellà: ${esc(b.es)}</div>
      <dl class="facts">
        <div><dt>Temporada</dt><dd>${esc(temporada(b.m))}</dd></div>
        <div><dt>Altitud</dt><dd>${b.alt[0]}–${b.alt[1]} m</dd></div>
        <div><dt>Sòl</dt><dd>${b.sol === 'a' ? 'Àcid' : b.sol === 'c' ? 'Calcari' : 'Indiferent'}</dd></div>
      </dl>
      ${avisos(b)}
      <div class="h4">Com reconèixer-lo</div><p>${esc(b.d)}</p>
      <p><i>On viu: ${esc(b.hab)}.</i></p>
      <div class="h4">${menja ? 'A la cuina' : 'Es pot menjar?'}</div><p>${esc(b.cu)}</p>
      ${b.co && b.co !== '—' ? `<p><b>Conservació:</b> ${esc(b.co)}</p>` : ''}
      ${conf ? `<div class="h4">${menja ? 'No el confonguis amb' : 'Es confon amb'}</div><div class="conf">${conf}</div>` : ''}
      <div class="h4">Quan surt</div>${calendari(b)}
      <div class="h4">${menja ? 'On trobar-lo' : 'On surt'}</div>${onTrobar(b)}
      <div class="links" style="margin-top:14px"><button class="btn main" id="almapa">Mostra'l al mapa gran</button></div>
      <div class="h4">Més informació</div>
      <div class="links"><a href="https://ca.wikipedia.org/w/index.php?go=Go&search=${encodeURIComponent(b.s)}" target="_blank" rel="noopener">Viquipèdia</a>${INAT[b.id] ? `<a href="https://www.inaturalist.org/taxa/${INAT[b.id].t}" target="_blank" rel="noopener">Més fotos a iNaturalist</a>` : ''}</div>
    </div></div>`);
  const sh = $('.sheet');
  sh.addEventListener('click', e => {
    const t = e.target.closest('.thumbs button'), c = e.target.closest('.conf button'), zb = e.target.closest('.where button');
    if (t) { const f = fs[+t.dataset.i]; $('#sh-img').src = imgURL(f, 'large'); $('#sh-credit').innerHTML = credit(b, f); sh.querySelectorAll('.thumbs button').forEach(x => x.setAttribute('aria-pressed', x === t)); }
    else if (c) openBolet(c.dataset.b);
    else if (zb) openZona(zb.dataset.z);
  });
  $('#almapa').onclick = () => { state.sp = b.id; state.z = ''; $('#spsel').value = b.id; closeSheet(); setMode('bolets'); drawGrid(); $('.mapbox').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
}

/* ---------- Panell: fitxa d'una zona ---------- */
function openZona(id) {
  const z = Z[id], c = centre(z);
  const tots = BOLETS.map(b => [b, nivell(b, z)]).filter(x => x[1].n >= 1);
  const fila = ([b, r]) => `<button data-b="${b.id}" data-c="${b.c}"><span class="ph">${thumb(b)}</span><span><b>${esc(b.ca)}</b><small>${esc(temporada(b.m))} · ${esc(evTxt(r))}</small></span><span class="r"><span class="tag n${r.n}">${NIVELL[r.n]}</span>${b.m.includes(ARA) ? '<span class="tag ara">Surt ara</span>' : ''}</span></button>`;
  const ordre = (a, b) => b[1].n - a[1].n || b[0].m.includes(ARA) - a[0].m.includes(ARA) || (b[1].ev === 'doc') - (a[1].ev === 'doc') || b[1].obs - a[1].obs;
  const bons = tots.filter(x => comestible(x[0])).sort(ordre), cond = tots.filter(x => x[0].c === 'cond' || x[0].c === 'sv').sort(ordre);
  const perill = tots.filter(x => (x[0].c === 'tox' || x[0].c === 'mort') && x[1].n >= 2).sort((a, b) => (b[0].c === 'mort') - (a[0].c === 'mort') || ordre(a, b));
  const fonts = [...new Set(Object.values(z.doc || {}).map(d => d[1]))];
  const arbres = Object.entries(z.t).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="t${v}">${ARBRES[k]}</span>`).join('');
  show(`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">
    <div class="hero plain"><button class="close" id="close" aria-label="Tanca">×</button></div>
    <div class="inner">
      <div class="eyebrow">${esc(z.reg)} · ${esc(z.co)}</div>
      <h2 id="sh-t">${esc(z.n)}</h2><div class="es">${esc(z.lloc)}</div>
      <dl class="facts">
        <div><dt>Altitud dels boscos</dt><dd>${z.alt[0]}–${z.alt[1]} m</dd></div>
        <div><dt>Sòl</dt><dd>${SOL[z.s]}</dd></div>
        <div><dt>Clima</dt><dd>${PLUJA[z.r]}</dd></div>
      </dl>
      <p>${esc(z.d)}</p>
      <div class="treechips">${arbres}</div>
      ${z.nt ? `<div class="note"><b>Normativa:</b> ${esc(z.nt)}</div>` : ''}
      <div id="zrain" data-z="${z.id}">${plujaHTML(z)}</div>
      <div class="h4">Bolets bons (${bons.length})</div><div class="rows">${bons.map(fila).join('') || '<p>Cap de destacat.</p>'}</div>
      ${perill.length ? `<div class="h4">Perillosos que hi són freqüents (${perill.length})</div><div class="rows">${perill.map(fila).join('')}</div>` : ''}
      ${cond.length ? `<div class="h4">Amb condicions o sense valor (${cond.length})</div><div class="rows">${cond.map(fila).join('')}</div>` : ''}
      ${fonts.length ? `<div class="h4">Fonts que citen aquesta zona</div><ul class="srcs">${fonts.map(i => `<li><a href="${FONTS[i].u}" target="_blank" rel="noopener">${esc(FONTS[i].n)}</a></li>`).join('')}</ul>` : ''}
      <div class="h4">Per anar-hi</div>
      <div class="links"><a class="main" href="https://www.google.com/maps/search/?api=1&query=${c[0].toFixed(4)},${c[1].toFixed(4)}" target="_blank" rel="noopener">Obre a Google Maps</a><button class="btn" id="zsel">Filtra el catàleg per aquesta zona</button></div>
    </div></div>`);
  $('.sheet').addEventListener('click', e => { const r = e.target.closest('.rows button'); if (r) openBolet(r.dataset.b); });
  $('#zsel').onclick = () => { state.z = id; closeSheet(); paintMap(); drawZoneInfo(); drawGrid(); $('.main').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  if (!plujaEstat) carregaPluja();
}

/* ---------- Obrir i tancar panells (el botó enrere del mòbil també tanca) ---------- */
function show(html) {
  $('#overlay').innerHTML = html; $('#overlay').hidden = false; document.body.style.overflow = 'hidden';
  if (!(history.state && history.state.panell)) history.pushState({ panell: 1 }, '');
  $('#close').onclick = () => closeSheet(); $('#close').focus();
}
function closeSheet(dePop) {
  if ($('#overlay').hidden) return;
  $('#overlay').hidden = true; $('#overlay').innerHTML = ''; document.body.style.overflow = '';
  if (!dePop && history.state && history.state.panell) history.back();
}
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
window.addEventListener('popstate', () => closeSheet(true));

/* ---------- Arrencada ---------- */
drawCats(); drawSelects(); drawGrid(); drawZoneInfo();
if (window.L) { initMap(); paintMap(); }
else $('#map').innerHTML = '<p style="padding:20px;font-family:var(--f-body)">El mapa necessita connexió la primera vegada. El catàleg funciona igualment.</p>';

/* Aplicació instal·lable: registra el service worker (només funciona servit per https o localhost) */
if ('serviceWorker' in navigator && location.protocol !== 'file:')
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
