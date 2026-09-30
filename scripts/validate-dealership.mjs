// Verifica que data/dealership.json y el bloque NEGOCIO de index.html no se contradigan
// y que no se publiquen datos sin confirmar. Uso: node scripts/validate-dealership.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'data/dealership.json'), 'utf8'));
const errors = [];
if (d.demo.official !== false) errors.push('demo.official debe ser false');
if (d.identity.cuit !== null) errors.push('CUIT debe ser null hasta confirmación');
if (d.hours.display && d.hours.status === 'not-found') errors.push('hours.display cargado pero status sigue en not-found');
for (const page of ['index.html', '404.html', 'privacidad.html']) {
  const h = fs.readFileSync(path.join(root, page), 'utf8');
  if (d.demo.publicIndexing === false && !h.includes('noindex')) errors.push(`${page}: falta noindex mientras sea demo`);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('rel="canonical"')) errors.push('index.html: falta canonical');
const get = (k) => (html.match(new RegExp(`${k}:\\s*"([^"]*)"`)) || [])[1];
const pairs = [['mapsPlace', d.location.mapsPlaceUrl], ['mapsReviews', d.location.mapsReviewsUrl], ['direccion', d.location.address], ['telefono', d.contact.phone], ['telefonoTel', d.contact.phoneTel],
  ['whatsapp', d.contact.whatsApp], ['instagram', d.contact.instagram], ['facebook', d.contact.facebook]];
for (const [k, v] of pairs) if (get(k) !== v) errors.push(`NEGOCIO.${k} ("${get(k)}") no coincide con dealership.json ("${v}")`);
if ((get('horarios') || '') !== (d.hours.display || '')) errors.push('NEGOCIO.horarios no coincide con hours.display');
// Precios: solo "Consultar" salvo que el dueño confirme por escrito
const stock = html.split('var STOCK')[1] || '';
for (const m of stock.matchAll(/precio:\s*"([^"]*)"/g)) if (m[1] !== 'Consultar') errors.push(`Precio publicado sin confirmar: ${m[1]}`);
for (const u of [d.location.mapsPlaceUrl, d.location.mapsReviewsUrl]) if (!u || !u.startsWith('https://www.google.com/maps/place/')) errors.push('URL de Maps debe ser https://www.google.com/maps/place/...');
if (/google\.com\/maps\/search/.test(html)) errors.push('index.html: enlace a Maps por búsqueda de texto; usar mapsPlace');

// Referencias, imágenes y accesibilidad básica
const stockSrc = (html.match(/var STOCK = (\[[\s\S]*?\n\]);/) || [])[1];
if (!stockSrc) errors.push('No se pudo leer STOCK');
else {
  const STOCK = vm.runInNewContext(stockSrc);
  const used = new Set();
  for (const c of STOCK) for (const f of (c.fotos || [c.foto])) { used.add(path.basename(f)); if (!fs.existsSync(path.join(root, f))) errors.push(`Falta la imagen ${f} (${c.titulo})`); }
  for (const m of html.matchAll(/(images\/[A-Za-z0-9._-]+\.(?:webp|png|jpe?g))/g)) { used.add(path.basename(m[1])); if (!fs.existsSync(path.join(root, m[1]))) errors.push(`Falta la imagen ${m[1]}`); }
  // Variantes responsive (srcset): cada foto de unidad tiene -480 y -800
  for (const f of [...used]) {
    const m = f.match(/^((?:clio|ecosport|ka-s|kwid|punto|up)-\d+)\.webp$/);
    if (!m) continue;
    for (const t of [480, 800]) { const vname = `${m[1]}-${t}.webp`; used.add(vname); if (!fs.existsSync(path.join(root, 'images', vname))) errors.push(`Falta la variante images/${vname}`); }
  }
  // Tarjetas prerenderizadas (node scripts/prerender.mjs): deben coincidir con STOCK
  const pre = (html.match(/<!--PRE:cards-->([\s\S]*?)<!--\/PRE:cards-->/) || [])[1];
  if (pre === undefined) errors.push('index.html: faltan los marcadores <!--PRE:cards-->');
  else {
    if ((pre.match(/<article class="car"/g) || []).length !== STOCK.length) errors.push('Tarjetas prerenderizadas no coinciden con STOCK: correr node scripts/prerender.mjs');
    for (const c of STOCK) if (!pre.includes(`>${c.titulo}</button>`)) errors.push(`Falta en el prerender: ${c.titulo}. Correr node scripts/prerender.mjs`);
  }
  for (const f of fs.readdirSync(path.join(root, 'images'))) if (!used.has(f)) errors.push(`Imagen sin uso: images/${f}`);
}
if ((html.match(/<h1[\s>]/g) || []).length !== 1) errors.push('index.html debe tener un único h1');
for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) errors.push(`img sin alt: ${m[0].slice(0, 60)}`);
if (!html.includes('href="privacidad.html')) errors.push('index.html: falta enlace a privacidad.html');
for (const page of ['index.html', '404.html', 'privacidad.html']) if (/href="#"/.test(fs.readFileSync(path.join(root, page), 'utf8'))) errors.push(`${page}: hay href="#" (enlace sin destino)`);
if (/href="http:\/\//.test(html)) errors.push('Enlace http:// sin cifrar en index.html');
for (const page of ['404.html', 'privacidad.html']) {
  const h = fs.readFileSync(path.join(root, page), 'utf8');
  if (!h.includes(`wa.me/${d.contact.whatsApp}`)) errors.push(`${page}: WhatsApp no coincide con dealership.json`);
  if (!h.includes(`tel:${d.contact.phoneTel}`) && page === 'privacidad.html') errors.push(`${page}: teléfono no coincide con dealership.json`);
}
if (!/<base href="https:\/\/[^"]+\/">/.test(fs.readFileSync(path.join(root, '404.html'), 'utf8'))) errors.push('404.html: falta <base href> absoluto');
if (!/Disallow:\s*\/\s*$/m.test(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'))) errors.push('robots.txt debe tener Disallow: / mientras sea demo');
if (errors.length) { console.error(errors.map((e) => 'ERROR: ' + e).join('\n')); process.exit(1); }
console.log('Datos de Poerio válidos y consistentes con index.html.');
