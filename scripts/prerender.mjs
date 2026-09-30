// Regenera el HTML de las tarjetas de unidades dentro de index.html (entre <!--PRE:cards--> y <!--/PRE:cards-->)
// usando la misma función card() que usa el navegador. Así el stock se ve sin JavaScript y en buscadores.
// Uso: node scripts/prerender.mjs   (correrlo cada vez que cambie STOCK)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const negocio = (html.match(/var NEGOCIO = \{[\s\S]*?\n\};/) || [])[0];
const stock = (html.match(/var STOCK = \[[\s\S]*?\n\];/) || [])[0];
const fn = (html.match(/\/\*PRE:start\*\/([\s\S]*?)\/\*PRE:end\*\//) || [])[1];
if (!negocio || !stock || !fn) { console.error('ERROR: no se encontró NEGOCIO, STOCK o el bloque PRE en index.html'); process.exit(1); }
const ctx = vm.createContext({});
vm.runInContext(`${negocio}\n${stock}\nvar N = NEGOCIO;\n${fn}\nvar OUT = STOCK.map(card).join("");`, ctx);
if (!/<!--PRE:cards-->[\s\S]*?<!--\/PRE:cards-->/.test(html)) { console.error('ERROR: faltan los marcadores <!--PRE:cards--> en index.html'); process.exit(1); }
const out = html.replace(/<!--PRE:cards-->[\s\S]*?<!--\/PRE:cards-->/, () => `<!--PRE:cards-->${ctx.OUT}<!--/PRE:cards-->`);
fs.writeFileSync(file, out);
console.log('Tarjetas prerenderizadas en index.html');
