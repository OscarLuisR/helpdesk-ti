# Protección de Diseño UI/UX Aprobado y Responsividad (Quasar + Vue 3)

El sistema visual de `helpdesk-ti` ya está definido y aprobado (estética SaaS moderna / Clean Fintech: tarjetas planas con borde sutil, badges suaves, tipografía limpia y componentes nativos de Quasar v2).

## Reglas obligatorias al modificar o crear vistas `.vue`

1. **Inspección previa obligatoria:** Antes de agregar filtros, botones, modales o tarjetas a una vista, lee `src/css/quasar.variables.scss`, `src/css/app.scss` y revisa una vista hermana ya aprobada (ej. `BandejaTicketsPage.vue` o `DashboardOperativoPage.vue`) para reutilizar exactamente sus mismas clases, tokens y estructura.
2. **Respeto estricto a colores y estilos aprobados:** Prohibido usar colores hexadecimales crudos o defaults genéricos de Material Design (sombras pesadas `shadow-*`, `elevated`, inputs `filled`). Utiliza únicamente las variables CSS y paleta definidas en `quasar.variables.scss` y `app.scss`, manteniendo inputs `outlined` + `dense` y tarjetas planas con borde sutil.
3. **Respeto estricto a fuentes y tipografía:** No alteres familias tipográficas (`font-family`), tamaños base, pesos ni jerarquías de títulos, subtítulos o badges. Reutiliza las clases tipográficas existentes del proyecto sin introducir estilos `font-*` arbitrarios.
4. **Responsividad obligatoria (Móvil, Tablet y Escritorio):** Toda modificación o vista nueva (filtros, barras de herramientas, tarjetas, tablas y diálogos) debe adaptarse sin desbordamientos horizontales en `xs`, `sm`, `md` y `lg`:
   - Usa siempre columnas fluidas de Quasar (`row q-col-gutter-*` con `col-12 col-sm-6 col-md-*`) en lugar de anchos fijos en píxeles (`width: ...px`).
   - Asegura que los filtros en barra se apilen verticalmente en pantallas pequeñas (`col-12` en `xs`/`sm`) y mantengan alineación limpia en escritorio.
5. **Cero Tailwind / Cambios quirúrgicos:** Utiliza exclusivamente el sistema de grillas y utilidades nativas de Quasar v2. Al añadir un elemento nuevo en una pantalla existente, intégralo dentro de la cabecera o barra actual sin reorganizar ni reescribir el resto del layout.
