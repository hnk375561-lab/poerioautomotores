# Fernando Poerio Automotores · sitio demo

Sitio estático (HTML/CSS/JS; el movimiento usa GSAP + ScrollTrigger incluidos en `vendor/`, sin CDN ni build) de propuesta para Fernando Poerio Automotores, Concepción del Uruguay. **No es el sitio oficial ni está aprobado por el negocio.**

## Archivos
- `js/motion.js`: sistema de movimiento (hero, stock, ficha, bloques, navegación, barra móvil). Reglas: fotos con máscara `clip-path` (siempre `inset()` de 4 valores en `%`), texto por palabra o subida corta, curva `expo.out`, solo `transform`/`opacity`/`clip-path` (excepción: altura del acordeón de Preguntas), sin smooth-scroll ni scroll-jacking. Capas: anclas con ScrollTo (la rueda las interrumpe), filtros de unidades con Flip, paralaje/botones magnéticos/tilt solo con mouse, mapa con máscara, y la vista previa del mensaje (ver abajo). Se desactiva con `prefers-reduced-motion` y si GSAP no carga (el contenido queda visible y la vista previa se dibuja estática); `vendor/` trae GSAP 3.15.0, ScrollTrigger, Flip y ScrollToPlugin.
- **Vista previa del mensaje** (bajo el formulario "Contanos tu auto"): `index.html` arma el estado con `pvState()`, que es la misma función que construye el texto que se envía por WhatsApp, así que lo que se ve es exactamente lo que se manda. `window.poerioFx` (motion.js) lo anima; sin él, `pvStatic()` lo dibuja sin movimiento. No guarda ni inventa datos: solo refleja lo que la persona escribe.
- `index.html`: sitio completo. Datos del negocio (`NEGOCIO`) y unidades (`STOCK`) en el bloque `<script>` al final.
- `privacidad.html`: política de privacidad preliminar, aviso sobre la información de las unidades y aviso de demo.
- `404.html`: página de error (usa `<base href>` absoluto porque GitHub Pages la sirve desde cualquier ruta).
- `robots.txt`, `preview.png` (imagen para compartir), `images/<unidad>-N.webp` (la primera foto es la portada). Cada foto de unidad tiene dos variantes para `srcset`: `<unidad>-N-480.webp` y `<unidad>-N-800.webp` (mismo nombre, ancho 480 y 800 px); al sumar una foto hay que generar las dos.
- `scripts/prerender.mjs` (`npm run prerender`): escribe en `index.html` el HTML de las tarjetas de unidades (entre `<!--PRE:cards-->` y `<!--/PRE:cards-->`) con la misma función que usa el navegador, para que el stock se vea sin JavaScript. Correrlo cada vez que cambie `STOCK`; `npm test` avisa si quedó desactualizado.
- `data/dealership.json`: datos confirmados y su fuente. `golive/`: pendientes y pasos a producción.

## Comprobar
`npm test` valida que no haya `href="#"`, que los datos coincidan con `index.html`, que no haya precios sin confirmar, que existan todas las imágenes (y no sobren), un solo `h1`, `alt` en imágenes, `noindex` en las tres páginas y `Disallow: /` en `robots.txt`.

## Publicar
GitHub > Settings > Pages > Deploy from a branch > main / (root). URL esperada: https://hnk375561-lab.github.io/poerioautomotores/

## Estado
Demo: `noindex`, aviso visible y `robots.txt` con `Disallow: /`. Para pasar a producción seguir `golive/PRODUCCION.md`.
