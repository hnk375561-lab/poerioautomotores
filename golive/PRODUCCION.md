# De demo a producción

## Ahora (demo)
- `noindex, nofollow` en `index.html`, `404.html` y `privacidad.html`; `robots.txt` con `Disallow: /`.
- Aviso de demo arriba de todo, en el pie y en `privacidad.html#demo`.
- Precios, horarios y datos sin confirmar figuran como "Consultar" o "a confirmar".
- Sin JSON-LD ni sitemap a propósito: no se publican datos estructurados de un negocio sin aprobación.

## Datos que faltan (los tiene que dar el dueño)
1. Horarios de atención (`NEGOCIO.horarios` y `hours.display`).
2. Razón social, CUIT, domicilio legal y correo, para completar `privacidad.html` (sección "Responsable") y un canal formal para ejercer derechos.
3. Confirmar que el teléfono/WhatsApp 03442 45-3550 es el oficial de atención.
4. Cuenta oficial de Facebook (hoy es un perfil llamado "Fernando Poerio") y que `@poerioautomotores` sea su Instagram (no se pudo verificar).
5. Qué unidades siguen disponibles, y sus precios si quiere publicarlos.
6. Autorización para usar las fotos; decidir si se tapan las patentes visibles.
6b. Autorización para usar el logo (imagen del negocio con "39 años de confianza"; hoy figura en el pie, la ficha, el 404 y la página de privacidad) y confirmar que la cifra sigue vigente.
7. Confirmar "Comprar", 0 km (marcas), consignación (condiciones) y el lema "39 años de confianza" (hoy no se muestra en el sitio).
8. Si quiere mostrar el enlace de opiniones de Google (la ficha tiene 3 opiniones, una de 1 estrella hace más de 5 años).

## Al aprobar (checklist)
1. `data/dealership.json` y `NEGOCIO` en `index.html`: cargar los datos confirmados, `demo.official: true`, `demo.publicIndexing: true`. Ajustar `scripts/validate-dealership.mjs` (hoy exige `noindex`, `Disallow: /` y `official === false`).
2. Quitar `noindex, nofollow` de `index.html`, `404.html` y `privacidad.html`.
3. `robots.txt`:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://DOMINIO-DEFINITIVO/sitemap.xml
   ```
4. Crear `sitemap.xml` con `/` y `/privacidad.html`.
5. `index.html`: reemplazar el dominio en `canonical`, `og:url`, `og:image` y `twitter:image`; quitar "DEMO ·" de `<title>`, `og:title`, `twitter:title` y `og:site_name`; ajustar `description` con datos confirmados.
6. `404.html`: cambiar `<base href>` al dominio definitivo.
7. Quitar el aviso `.demo` de arriba, la frase "Sitio demo…" del pie, la sección "Sobre esta demo" y la nota preliminar de `privacidad.html`; completar el responsable con datos reales y hacer revisar el texto por un profesional.
8. Agregar JSON-LD `AutoDealer` solo con datos confirmados (nombre, dirección, teléfono, coordenadas de `data/dealership.json`, `sameAs` con redes oficiales, `openingHoursSpecification` cuando haya horarios). No agregar precios ni `Vehicle` sin datos confirmados.
9. Si hay dominio propio: configurarlo en GitHub Pages (Settings > Pages > Custom domain, HTTPS) y actualizar los puntos 3 a 6.
10. `npm test` y revisar en celular.

## Mejoras futuras (opcionales)
- Fotos originales de todas las unidades y retiro de las vendidas.
- Fuentes propias en vez de Google Fonts (evita la conexión a Google).
- Página propia por unidad, si el stock crece.
