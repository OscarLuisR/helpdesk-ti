---
description: Ejecución autónoma E2E del checklist de QA (Etapas 1 a 4) para HelpDesk TI
---

# Instrucciones de Ejecución Autónoma (No detenerse a pedir confirmación)

1. **Verificación previa de servicios y entorno:**
   - Verifica si el frontend (`helpdesk-ti`, Quasar/Vue 3) y el backend (`helpdesk-ti-backend`, Node.js/Express/PostgreSQL/Redis) están corriendo en local; si alguno está detenido, levántalo en segundo plano usando `pnpm`.
   - Lee `.env`, seeders o consulta PostgreSQL en `helpdesk-ti-backend` para obtener:
     - Los valores reales de `TAMANO_MAX_ADJUNTO_MB`, `MAX_IMAGENES_NUEVO_TICKET` y `MAX_ADJUNTOS_POR_TICKET`.
     - Credenciales activas (usuario/correo y contraseña) de los 5 roles operativos TI: `MESA_TECNICA`, `GERENTE_AREA` (Soporte y Redes), `TECNICO` (Técnico A, Técnico B y uno de Redes), `ADMINISTRADOR` y `DIRECTOR`.
   - Crea una carpeta temporal `./tmp_qa_assets` en la raíz del workspace con:
     - Varias imágenes PNG válidas pequeñas (suficientes para superar `MAX_IMAGENES_NUEVO_TICKET` y `MAX_ADJUNTOS_POR_TICKET`).
     - 1 archivo que supere `TAMANO_MAX_ADJUNTO_MB` en bytes.
     - 1 archivo de extensión inválida (`invalido.exe`).

2. **Reglas de ejecución y control de estado:**
   - Ejecuta secuencialmente desde la **Etapa 1 hasta la Etapa 4** usando el navegador integrado.
   - Lleva un registro interno del código/ID real generado para cada ticket (`Ticket #1` a `Ticket #10`) para no confundirlos con registros previos en la base de datos.
   - En cada paso que indique **(debe bloquear)** o **(debe rechazarlo)**, verifica explícitamente que el botón esté deshabilitado, que el archivo sea rechazado o que aparezca la alerta/validación correspondiente antes de avanzar.
   - Al finalizar el Subcaso 7B, restaura la configuración original de SLA en `/admin/sla`.
   - Si algún punto falla, documenta el error exacto (mensaje en UI, status HTTP en red o estado en PostgreSQL), conserva captura y continúa con los siguientes casos posibles.
   - Al terminar toda la batería, elimina `./tmp_qa_assets` y entrega un **Artifact en Markdown** con el checklist completo marcado (`[x]` aprobado / `[!]` fallido) y un resumen técnico de hallazgos.

---

# Etapa 1 — Casos Básicos de Registro y Flujo Feliz (B + C)

## Ticket #1: Flujo estándar completo + Solicitante nuevo

- [ ] `[MESA_TECNICA]` Ir a `/tickets/nuevo`: elegir Departamento Solicitante, escribir nombre y teléfono nuevos, seleccionar una incidencia de Soporte (verificar cálculo automático de Área TI, Prioridad y SLA a la derecha) y registrar → nace en **Abierto**.
- [ ] `[GERENTE_AREA - Soporte]` Ir a `/gerencia/bandeja`, abrir el Ticket #1 y presionar **Asignar Técnico** (verificar que **NO** sale aviso de suplencia) → pasa a **Asignado**.
- [ ] `[TECNICO asignado]` Ir a `/tecnico/mis-tickets`, abrir Ticket #1 y presionar **Iniciar Atención** → pasa a **En Progreso**.
- [ ] `[TECNICO asignado]` Probar validaciones: intentar marcar **Marcar Resuelto** sin Causa Raíz o sin Solución Aplicada (debe bloquear); luego llenar ambos campos y confirmar → pasa a **Resuelto - Por Verificar**.
- [ ] `[MESA_TECNICA]` Ir a `/tickets/recepcion`, abrir Ticket #1 → **Verificar y Cerrar** → elegir **Confirmado con usuario** (con check de conformidad activo) → pasa a **Cerrado** (chip _Cierre Confirmado_).

## Ticket #2: Buscador de solicitante + Bloqueo progresivo + Cierre Directo Nivel 1 en apertura (solo TI-MT)

- [ ] `[MESA_TECNICA]` Ir a `/tickets/nuevo`: verificar que todos los campos están deshabilitados hasta elegir **Departamento Solicitante**; elegir el mismo Departamento del Ticket #1 → botón **Buscar** → seleccionar el solicitante creado en el Ticket #1 (verificar autocompletado).
- [ ] `[MESA_TECNICA]` Verificar que el switch **Resuelto en Nivel 1 (Cierre Directo)** permanece deshabilitado al elegir una incidencia de Soporte/Redes, y se habilita **solo** al elegir una incidencia de **Mesa Técnica (`TI-MT`)**.
- [ ] `[MESA_TECNICA]` Activar el switch **Resuelto en Nivel 1 (Cierre Directo)** (verificar que se oculta el área de adjuntos de apertura), llenar Causa Raíz, Solución Aplicada, conformidad y registrar → nace directamente en **Cerrado**.

## Ticket #3: Coincidencia de solicitante (Actualizar vs Crear nuevo) + Adjuntos en apertura + Resolución en Nivel 1 desde detalle (TI-MT)

- [ ] `[MESA_TECNICA]` Ir a `/tickets/nuevo`: elegir el mismo Departamento, escribir el nombre del solicitante del Ticket #1 con teléfono diferente y seleccionar una incidencia de **Mesa Técnica (`TI-MT`)** (sin activar Cierre Directo).
- [ ] `[MESA_TECNICA]` Probar evidencias en apertura:
  - [ ] Intentar subir un archivo inválido (`invalido.exe`) o que supere `TAMANO_MAX_ADJUNTO_MB` (debe rechazarlo).
  - [ ] Subir imágenes válidas (arrastrando, seleccionando y pegando con `Ctrl+V`) hasta probar el tope de `MAX_IMAGENES_NUEVO_TICKET`.
- [ ] `[MESA_TECNICA]` Presionar **Registrar Ticket** → debe abrir el modal de confirmación de solicitante → probar **Actualizar existente** (o repetir luego con **Crear nuevo**) → nace **Abierto**.
- [ ] `[MESA_TECNICA]` Ir a `/tickets/recepcion`, abrir el Ticket #3 y presionar **Resolver en Nivel 1** marcando el check de conformidad → llenar Causa Raíz + Solución Aplicada → pasa directo de **Abierto → Cerrado** en una sola transacción.

---

# Etapa 2 — Comentarios, Adjuntos, Pausas y Balanceo de Cargas (C + D)

## Ticket #4: Balanceo de Cargas + Chat/Adjuntos + Pausa tipificada + Cierre Administrativo

- [ ] `[MESA_TECNICA]` Crear Ticket #4 para el área de Soporte → **Abierto**.
- [ ] `[GERENTE_AREA - Soporte]` Ir a `/gerencia/asignacion` (Balanceo de Cargas) → pestaña **Sin asignar** → seleccionar Ticket #4 a la izquierda → asignar en un clic a Técnico A mirando las tarjetas de carga en vivo → **Asignado**.
- [ ] `[GERENTE_AREA - Soporte]` En `/gerencia/asignacion` → cambiar a pestaña **Reasignables** → seleccionar Ticket #4 y reasignarlo al Técnico B → sigue en **Asignado** con Técnico B.
- [ ] `[TECNICO B]` Iniciar atención → **En Progreso**.
- [ ] `[TECNICO B]` Probar pestaña **Comentarios y Adjuntos**:
  - [ ] Publicar un comentario público y una **Nota Interna TI**.
  - [ ] Anular (tachar) el comentario propio y verificar que queda tachado con autor/fecha de anulación.
  - [ ] Subir un archivo en Adjuntos (validar tope `MAX_ADJUNTOS_POR_TICKET`), previsualizar imagen en el visor modal y presionar **Descargar**.
- [ ] `[TECNICO B]` Presionar **Pausar (En Espera)** → elegir motivo tipificado (ej. _Esperando repuesto/compra_) + detalle opcional → pasa a **En Espera**.
- [ ] `[TECNICO B]` Esperar 1–2 minutos para que acumule tiempo de pausa, luego presionar **Reanudar Atención** → vuelve a **En Progreso**.
- [ ] `[TECNICO B]` Presionar **Marcar Resuelto** con causa raíz y solución → **Resuelto - Por Verificar**.
- [ ] `[MESA_TECNICA]` Ir a `/tickets/recepcion` → **Verificar y Cerrar** → elegir **Cierre administrativo (usuario ilocalizable)** → intentar confirmar sin comentario (debe bloquear) → escribir los intentos de llamada y confirmar → **Cerrado** (chip _Cierre Administrativo_, conformidad _No_).
- [ ] `[CUALQUIER ROL]` Abrir el Ticket #4 ya Cerrado y verificar en Comentarios y Adjuntos que ambos quedaron en solo lectura, y revisar toda la secuencia en la pestaña **Bitácora**.

---

# Etapa 3 — Excepciones del Ciclo de Vida (C)

## Ticket #5: Reapertura desde Resuelto - Por Verificar y desde Cerrado

- [ ] `[MESA_TECNICA]` Crear Ticket #5 (Soporte) → `[GERENTE_AREA]` asignar → `[TECNICO]` En Progreso → **Resuelto - Por Verificar**.
- [ ] `[MESA_TECNICA]` Abrir Ticket #5 en `/tickets/recepcion` → presionar **Reabrir Ticket** (probar que exige motivo obligatorio) → pasa a **Reabierto**.
- [ ] `[TECNICO asignado]` Verificar que puede volver a **Iniciar Atención** desde Reabierto → **En Progreso** → **Resuelto - Por Verificar**.
- [ ] `[MESA_TECNICA]` Cerrar como **Confirmado** → **Cerrado**.
- [ ] `[ADMINISTRADOR o MESA_TECNICA]` Abrir el mismo Ticket #5 ya Cerrado → presionar **Reabrir Ticket** con motivo obligatorio → vuelve a **Reabierto** (verificar que el Gerente puede verlo de nuevo en Balanceo de Cargas y reasignarlo o el técnico reanudarlo y cerrarlo).

## Ticket #6: Transferencia entre Sub-Áreas TI

- [ ] `[MESA_TECNICA]` Crear Ticket #6 en área Soporte → `[GERENTE_AREA - Soporte]` asignar a un técnico → `[TECNICO]` pasar a **En Progreso**.
- [ ] `[TECNICO asignado]` Presionar **Transferir de Área TI** → elegir Redes → probar justificación menor a 10 caracteres (debe bloquear) → escribir justificación técnica ≥ 10 caracteres y confirmar.
- [ ] Verificar resultado: El ticket desaparece de Soporte, aparece en la bandeja de Redes en estado **Abierto** y sin técnico asignado, y en Bitácora sale el chip _Soporte → Redes_.
- [ ] `[GERENTE_AREA - Redes]` Asignarlo a un técnico de Redes y completar su cierre (o dejarlo en progreso para probar carga activa).

## Ticket #7: Asignación en Suplencia por MESA_TECNICA (Anticipada y SLA Vencido)

- [ ] **Subcaso 7A — Suplencia anticipada (SLA vigente):**
  - [ ] `[MESA_TECNICA]` Crear Ticket #7 con prioridad Baja o Media en área Redes.
  - [ ] `[MESA_TECNICA]` Abrirlo de inmediato y presionar **Asignar Técnico** → verificar banner amarillo _"Suplencia anticipada"_ → intentar confirmar sin motivo (debe bloquear) → escribir motivo (ej. _"Gerente de Redes ausente"_) y confirmar → **Asignado** con chip _Suplencia Mesa Técnica_ en bitácora.
- [ ] **Subcaso 7B — Suplencia por SLA vencido:**
  - [ ] En `/admin/sla`, asegurarse de tener una prioridad con `activa_suplencia = true` y tiempo corto (ej. Crítica o temporalmente 1 min; anotar valor original para restaurarlo después).
  - [ ] `[MESA_TECNICA]` Crear Ticket #7B con esa prioridad para Redes, esperar a que venza el tiempo → abrir y presionar **Asignar Técnico** → verificar banner informativo _"Asignación en Suplencia (SLA vencido)"_ → confirmar sin escribir motivo obligatorio → queda registrado con _Suplencia Mesa Técnica_ en bitácora.

## Ticket #8: Ticket propio de Mesa Técnica (TI-MT) — Pausar y Resolver en Nivel 1

- [ ] `[MESA_TECNICA]` Crear Ticket #8 eligiendo una incidencia del catálogo cuyo departamento responsable sea **Mesa Técnica (TI-MT)** (sin Cierre Directo → nace **Abierto**).
- [ ] `[MESA_TECNICA]` Abrirlo en `/tickets/recepcion` y verificar:
  - [ ] En **Acciones del Ciclo de Vida** aparecen únicamente **Transferir de Área TI**, **Pausar (En Espera)**, **Resolver en Nivel 1** y **Cancelar Ticket** (**NO** aparece **Asignar Técnico** ni botón duplicado **Cierre Directo N1**).
  - [ ] Probar **Pausar (En Espera)** con motivo tipificado → pasa a **En Espera** → luego presionar **Resolver en Nivel 1** (sin check → pasa a **Resuelto - Por Verificar**, o con check _"Usuario confirmó conformidad en llamada (cerrar ticket inmediatamente)"_ → cierra directo en un solo paso).

## Ticket #9: Cierre como No Resuelto

- [ ] `[MESA_TECNICA]` Crear Ticket #9 → asignar → `[TECNICO]` iniciar atención (**En Progreso**, o pausar a **En Espera**).
- [ ] `[TECNICO asignado o GERENTE_AREA]` Presionar **Cerrar como No Resuelto** → probar que exige Causa raíz / Dictamen técnico y Observación → confirmar → pasa a estado terminal **No Resuelto** (chat y adjuntos quedan en solo lectura).

## Ticket #10: Cancelación de Ticket (Cancelado)

- [ ] `[MESA_TECNICA o ADMINISTRADOR]` Crear Ticket #10 (queda **Abierto**, o también probarlo estando **Asignado**).
- [ ] `[MESA_TECNICA o ADMINISTRADOR]` Presionar **Cancelar Ticket** → probar que exige motivo obligatorio → confirmar → pasa a estado terminal **Cancelado** (verificar luego en reportes que suma en Cancelados excluidos y no afecta el % de SLA).

---

# Etapa 4 — Permisos de Chat/Roles, Tableros, Base de Soluciones y Reportes (D + E)

## Validación de permisos de comentarios y visibilidad

- [ ] `[DIRECTOR]` Abrir un ticket activo → verificar que puede ver todo pero **NO** tiene botón de anular comentarios ni acciones de ciclo de vida.
- [ ] `[MESA_TECNICA / ADMINISTRADOR]` Anular (tachar) un comentario manual escrito por otro usuario en un ticket activo.

## Tablero Operativo adaptativo (`/dashboard`)

- [ ] Iniciar sesión y verificar la vista diferenciada de: `TECNICO` (su tablero personal), `GERENTE_AREA` (`/gerencia/metricas`, solo su área), `MESA_TECNICA`, `DIRECTOR` (`/dashboard/ejecutivo`) y `ADMINISTRADOR`.
- [ ] Probar los filtros de período (Mes actual, Últimos 30/60/90 días, Todo el historial, rango personalizado) y el clic en las tarjetas KPI para filtrar la bandeja.

## Base de Soluciones (`/tecnico/historial`)

- [ ] Entrar como `TECNICO` (y probar también con otro rol supervisor):
  - [ ] Confirmar que aparecen únicamente los tickets resueltos/cerrados con causa raíz y solución (Tickets #1, #2, #3, #4, #5, #6, #8), sin mostrar nombre ni teléfono del solicitante (sin PII), y que **NO** aparecen el #9 (_No Resuelto_) ni el #10 (_Cancelado_).
  - [ ] Probar filtro por texto libre, por Sub-Gerencia TI, por Incidencia del Catálogo y el botón **Copiar solución**.

## Reportes, Relojes Reales y Exportadores (`/dashboard/reportes` — DIRECTOR, ADMINISTRADOR, MESA_TECNICA)

- [ ] Confirmar que se reflejan los números de tus pruebas: evaluables vs 1 cancelado excluido (Ticket #10), suplencias (Tickets #7A/#7B), transferencias (Ticket #6), reaperturas (Ticket #5), cierres confirmados vs administrativos (Ticket #4) y demoras por motivo de pausa (Ticket #4).
- [ ] Probar filtros de fecha y Sub-Gerencia TI.
- [ ] Descargar y verificar los 3 reportes del menú **Exportar**:
  - [ ] Casos Detallados (Excel / CSV)
  - [ ] Matriz Mensual Técnicos (CSV)
  - [ ] Informe Ejecutivo (PDF)
