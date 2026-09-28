# Guía de mantenimiento (adaptada del proyecto Toyota C. del Uruguay)

1. **Cero datos inventados.** Horarios, precios, marcas 0 km, servicios y fecha de fundación solo se cargan con confirmación escrita del dueño o fuente pública citada. Si falta: "Consultar" / "a confirmar".
2. **Todo dato nuevo se registra** en `golive/AFIRMACIONES-A-CONFIRMAR.md` con fuente y fecha, y se refleja en `data/dealership.json`.
3. Los datos del negocio viven en `data/dealership.json` **y** en el bloque `NEGOCIO` de `index.html`; deben coincidir. Comprobar con `npm test`.
4. Cambio mínimo: no reescribir secciones enteras. No cargar datos personales del dueño ni su familia.
5. Mientras sea demo: mantener `noindex`, el aviso de demo y `robots.txt` con `Disallow: /`.
6. Para salir a producción: dueño confirma todo → actualizar JSON y NEGOCIO → `golive/AFIRMACIONES-A-CONFIRMAR.md` sin pendientes → quitar noindex/robots y el aviso demo.
