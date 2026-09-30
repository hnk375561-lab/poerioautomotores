# Secciones reservadas (pendientes de confirmación)

Estas secciones existen en `index.html` como estructura, marcadas con la etiqueta «Pendiente de confirmación». **No contienen datos del negocio.** Se completan solo con confirmación escrita del dueño (regla 1 de `CLAUDE.md`) y cada dato nuevo se registra en `AFIRMACIONES-A-CONFIRMAR.md` con fuente y fecha.

| Sección (id) | Qué hay que pedirle al dueño | Al completarla |
|---|---|---|
| Próximos ingresos (`#ingresos`) | Unidades nuevas con año, km, combustible y fotos propias | Cargar en `STOCK`, correr `npm run prerender` y quitar la sección |
| Nuestra historia (`#historia`) | Texto de origen y trayectoria; confirmar o no «39 años» | Reemplazar las tarjetas por el texto confirmado |
| Conocé el local (`#local`) | Fotos del frente y del cartel, con autorización | Reemplazar los marcos por `<img>` con `alt` y `srcset` |
| Conocé al equipo (`#equipo`) | Foto del equipo y autorización de las personas que aparezcan | Reemplazar el marco; no cargar datos personales del dueño ni su familia |
| Precios y financiación (`#financiacion`) | Precios por unidad, planes de financiación, medios de pago | Precios en `STOCK` (el test solo admite «Consultar» hasta entonces); texto de financiación y pagos en la sección |
| Opiniones de clientes (`#opiniones`) | Reseñas reales con autorización de cada cliente | Reemplazar las tarjetas; no mostrar puntuación ni cantidad hasta tener reseñas reales |
| Horarios (dentro de «Dónde estamos») | Días y horarios | Completar `NEGOCIO.horarios` y `data/dealership.json` (`hours.display`) |

## Antes de salir a producción
- Ninguna sección puede quedar con la etiqueta «Pendiente de confirmación» ni con tarjetas vacías: cada una se completa o se elimina.
- Al eliminar una, revisar que no quede ningún enlace interno a su `id`.
