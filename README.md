# Fernando Poerio Automotores · sitio demo

Sitio estático (HTML/CSS/JS; el movimiento usa GSAP + ScrollTrigger incluidos en `vendor/`, sin CDN ni build) de propuesta para Fernando Poerio Automotores, Concepción del Uruguay. **No es el sitio oficial ni está aprobado por el negocio.**

## Archivos
- `js/motion.js`: animaciones (hero, unidades, bloques, navegación). Se desactivan con `prefers-reduced-motion` y si GSAP no carga; `vendor/` trae GSAP 3.15.0 y ScrollTrigger.
- `index.html`: sitio completo. Datos del negocio (`NEGOCIO`) y unidades (`STOCK`) en el bloque `<script>` al final.
- `privacidad.html`: política de privacidad preliminar, aviso sobre la información de las unidades y aviso de demo.
- `404.html`: página de error (usa `<base href>` absoluto porque GitHub Pages la sirve desde cualquier ruta).
- `robots.txt`, `preview.png` (imagen para compartir), `images/<unidad>-N.webp` (la primera foto es la portada).
- `data/dealership.json`: datos confirmados y su fuente. `golive/`: pendientes y pasos a producción.

## Comprobar
`npm test` valida que no haya `href="#"`, que los datos coincidan con `index.html`, que no haya precios sin confirmar, que existan todas las imágenes (y no sobren), un solo `h1`, `alt` en imágenes, `noindex` en las tres páginas y `Disallow: /` en `robots.txt`.

## Publicar
GitHub > Settings > Pages > Deploy from a branch > main / (root). URL esperada: https://hnk375561-lab.github.io/poerioautomotores/

## Estado
Demo: `noindex`, aviso visible y `robots.txt` con `Disallow: /`. Para pasar a producción seguir `golive/PRODUCCION.md`.
