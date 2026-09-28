// Verifica que data/dealership.json y el bloque NEGOCIO de index.html no se contradigan
// y que no se publiquen datos sin confirmar. Uso: node scripts/validate-dealership.mjs
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'data/dealership.json'), 'utf8'));
const errors = [];
if (d.demo.official !== false) errors.push('demo.official debe ser false');
if (d.identity.cuit !== null) errors.push('CUIT debe ser null hasta confirmación');
if (d.hours.display && d.hours.status === 'not-found') errors.push('hours.display cargado pero status sigue en not-found');
for (const page of ['index.html', '404.html']) {
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
if (errors.length) { console.error(errors.map((e) => 'ERROR: ' + e).join('\n')); process.exit(1); }
console.log('Datos de Poerio válidos y consistentes con index.html.');
