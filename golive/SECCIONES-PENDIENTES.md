# Secciones reservadas (pendientes de confirmación)

Estas secciones existen en `index.html` como estructura, marcadas con la etiqueta «Pendiente de confirmación». **No contienen datos del negocio.** Se completan solo con confirmación escrita del dueño (regla 1 de `CLAUDE.md`) y cada dato nuevo se registra en `AFIRMACIONES-A-CONFIRMAR.md` con fuente y fecha.

| Sección (id) | Qué hay que pedirle al dueño | Al completarla |
|---|---|---|
| Próximos ingresos (`#ingresos`) | Unidades nuevas con año, km, combustible y fotos propias | Cargar en `STOCK`, correr `npm run prerender` y quitar la sección |
| Nuestra historia (`#historia`) | Texto de origen y trayectoria; confirmar o no «39 años» | Reemplazar las tarjetas por el texto confirmado |
| Conocé el local (`#local`) | Fotos del frente y del cartel, con autorización | Reemplazar los marcos por `<img>` con `alt` y `srcset` |
| Conocé al equipo (`#equipo`) | Foto del equipo y autorización de las personas que aparezcan | Reemplazar el marco; no cargar datos personales del dueño ni su familia |
| Precios y financiación (`#financiacion`) | Precios por unidad, planes de financiación, medios de pago | Precios en `STOCK` (el test solo admite «Consultar» hasta entonces); texto de financiación y pagos en la sección |
| Opiniones de clientes (`#opiniones`) | Por ahora la sección solo enlaza a la ficha de Google, sin nombres ni puntuación. Si el dueño quiere reseñas propias en el sitio: textos reales con autorización de cada cliente | Agregar tarjetas con texto autorizado; no mostrar puntuación ni cantidad hasta tener reseñas reales |
| Horarios (dentro de «Dónde estamos») | Días y horarios | Completar `NEGOCIO.horarios` y `data/dealership.json` (`hours.display`) |

## Antes de salir a producción
- Ninguna sección puede quedar con la etiqueta «Pendiente de confirmación» ni con tarjetas vacías: cada una se completa o se elimina.
- Al eliminar una, revisar que no quede ningún enlace interno a su `id`.

## Contenido general que hay que mantener al día
- **«Antes de comprar o permutar un usado»** (`#guia`): información general sobre qué revisar y la documentación habitual de la transferencia. Está fechada en septiembre de 2026. Los requisitos y costos del Registro del Automotor cambian: revisarla cada tanto y, antes de salir a producción, que la revise un profesional (gestor o escribano). No es una promesa ni una condición del negocio.
- **Formularios «Coordiná tu visita» y «Contanos qué auto buscás»**: solo arman un mensaje de WhatsApp que envía la persona. No guardan datos y no confirman disponibilidad ni precios. Si se agrega algún campo nuevo, actualizar `privacidad.html`.
