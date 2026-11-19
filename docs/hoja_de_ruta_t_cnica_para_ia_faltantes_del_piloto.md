# Especificación Técnica de Brechas y Pendientes para el Piloto (`helpdesk-ti` + `helpdesk-ti-backend`)

Este documento define el contexto exacto y las tareas pendientes de desarrollo para completar el Piloto del Sistema Helpdesk TI, contrastando lo que ya está construido hoy en el código fuente con las reglas operativas definitivas.

---

## 0. Regla Rectora de Alcance (Importante para la IA)

1. **Incidencias y Requerimientos de Servicio son lo mismo en el sistema:**
   * Todo ticket nace exclusivamente de la llamada o solicitud de un usuario (reparación de hardware, falla de red, falla de aplicativo administrativo, instalación de impresora, mudanza de equipo, entrega de insumos, etc.).
   * Todo entra unificado a través de `catalogo_incidencias` y `tickets`. **NO se debe crear ningún campo de `naturaleza` ni `tipo_trabajo`** para separar incidencia vs. requerimiento.
2. **Descartado definitivamente del alcance:**
   * **NO** existen Actividades Internas ni Mantenimientos Preventivos sin usuario solicitante.
   * **NO** existe flujo de Desarrollo / Evolutivo por fechas de entrega planificadas.
   * **NO** existe calendario automatizado de mantenimientos preventivos.
   * La productividad de los técnicos se mide estrictamente sobre los tickets de usuarios atendidos, sus tiempos de respuesta/resolución efectiva, carga activa y volumen resuelto.

---

## 1. Reglas Operativas Faltantes en el Flujo de Tickets (BD + Backend + UI)

### 1.1. Reclasificación / Transferencia entre Sub-Áreas TI
* **Estado actual:** Al crear el ticket desde `catalogo_incidencias`, `id_departamento` queda fijo. Si Mesa Técnica envió el caso a *Aplicaciones* y al diagnosticar resulta ser de *Redes*, no hay forma de transferirlo.
* **Qué construir:**
  * **BD / Backend (`FUNCIONES.sql` / `tickets.services.ts`):** Endpoint y función/transacción para transferir `id_departamento` de un ticket activo a otra Sub-Gerencia TI, limpiando `id_tecnico` (pasando el ticket a `Abierto` en la nueva bandeja) y registrando en `ticket_bitacora` el cambio de departamento con nota técnica obligatoria.
  * **Frontend (`TicketDetalleDialog.vue`):** Botón/acción *"Transferir de Área TI"* disponible para `GERENTE_AREA`, `TECNICO` (asignado), `MESA_TECNICA` y `ADMINISTRADOR`, con selector de departamento TI destino y campo de justificación obligatorio.

### 1.2. Cierre Directo en Nivel 1 (En la Llamada Inicial)
* **Estado actual:** `fn_post_tickets` siempre crea el ticket en estado `Abierto`, y `TRANSICIONES_PERMITIDAS` en `tickets.services.ts` exige pasar por `Asignado -> En Progreso -> Resuelto - Por Verificar -> Cerrado`.
* **Qué construir:**
  * Permitir que `MESA_TECNICA` (y `ADMINISTRADOR`) marque la opción **"Resuelto en Nivel 1 (Cierre Directo)"** desde `NuevoTicketPage.vue` al crear el ticket (o desde `TicketDetalleDialog.vue` mientras sigue en `Abierto`), exigiendo `causa_raiz` y `solucion_aplicada`, asignando al operador como ejecutor N1 y dejándolo directamente en estado `Cerrado` con traza en `ticket_bitacora`.

### 1.3. Pausas Tipificadas y Cierre Administrativo
* **Pausas tipificadas (`En Espera`):**
  * **Estado actual:** En `TicketDetalleDialog.vue` y `ticket_bitacora`, `motivo_pausa` es un campo de texto libre (100 caracteres).
  * **Qué construir:** Convertir el ingreso de pausa en un selector de **Motivo Tipificado obligatorio** (`Esperando repuesto/compra`, `Proveedor externo`, `Usuario no disponible`, `Esperando autorización`) acompañado de una observación/detalle opcional, para poder agrupar en los KPIs cuánto tiempo se pierde por cada causa externa.
* **Cierre Administrativo y Ventana de Reapertura:**
  * **Estado actual:** El cierre solo pide `conformidad_usuario`, y en `TRANSICIONES_PERMITIDAS` el estado `Cerrado` no permite ninguna transición posterior (`'Cerrado': []`).
  * **Qué construir:**
    * Al cerrar desde `MESA_TECNICA`, permitir indicar el **Tipo de Cierre**: `Confirmado con usuario` vs. `Cierre administrativo por usuario ilocalizable` (registrando observación/intentos de llamada).
    * Permitir que `MESA_TECNICA` o `ADMINISTRADOR` puedan transicionar de `Cerrado -> Reabierto` cuando fue un cierre administrativo (o dentro de una ventana de garantía) si el usuario vuelve a llamar porque la falla persiste.

### 1.4. Candados Reales de Asignación en Suplencia (Backend + Bitácora)
* **Estado actual:** En `DashboardOperativoPage.vue` existe la alerta visual de Suplencia SLA, pero en `validarAsignacionTecnico` (`tickets.services.ts`) `MESA_TECNICA` puede asignar cualquier ticket en cualquier momento sin validación ni marca diferenciada.
* **Qué construir:**
  * En `tickets.services.ts`, cuando `MESA_TECNICA` asigna un técnico a un ticket en estado `Abierto`, verificar si ya venció el `tiempo_max_asignacion_minutos` de su prioridad SLA (con `activa_suplencia = true`) o si se indica motivo de suplencia por ausencia del gerente, y grabar explícitamente en `ticket_bitacora` que fue una **"Asignación en suplencia por Mesa Técnica"** para poder contabilizar cuántas suplencias ocurren por sub-gerencia.

### 1.5. Equipo / Activo Afectado en el Ticket
* **Estado actual:** La tabla `tickets` (`TABLAS.sql`) no almacena referencia del equipo o sistema intervenido.
* **Qué construir:**
  * Agregar en `tickets` (y en `fn_post_tickets` / `NuevoTicketPage.vue` / `TicketDetalleDialog.vue`) un campo opcional `equipo_afectado` (VARCHAR 150, ej. serial, código de bien nacional o nombre del equipo/sistema) para medir reincidencia de fallas por equipo en los reportes.

### 1.6. Causa Raíz Obligatoria, Estado `Cancelado` y Soporte Multi-técnico (Opcional)
* **Causa raíz obligatoria:** En `TicketDetalleDialog.vue` y `tickets.services.ts`, al pasar a `Resuelto - Por Verificar`, hacer que `causa_raiz` sea **obligatoria** igual que `solucion_aplicada` (es indispensable para alimentar la Base de Soluciones en `/tecnico/historial`).
* **Estado `Cancelado`:** Agregar el estado `Cancelado` en catálogo de estados y en `TRANSICIONES_PERMITIDAS` (solo para `MESA_TECNICA` y `ADMINISTRADOR` desde `Abierto` o `Asignado`, con motivo obligatorio en bitácora) para anular tickets duplicados o creados por error sin contaminar tiempos ni métricas de resolución.
* **Co-asignación / Apoyo técnico (Opcional):** Si un caso requiere la intervención conjunta de más de un técnico (como aparece en los reportes mensuales donde 2 técnicos atienden un mismo servicio), evaluar un campo de técnicos de apoyo o tabla puente `ticket_tecnicos_apoyo` sin cambiar la simplicidad del técnico responsable principal (`id_tecnico`).

---

## 2. Vistas Declaradas en `useNavigation.ts` Pendientes de Construir

Actualmente existen 3 rutas en el menú lateral (`useNavigation.ts`) que no tienen página ni registro en `routes.ts`:

| Ruta | Rol(es) | Especificación de la Vista a Construir |
| :--- | :--- | :--- |
| `/gerencia/asignacion` | `GERENTE_AREA` | **Balanceo de Cargas:** Vista dividida o comparativa que muestre a la izquierda los tickets del departamento pendientes de asignar (`Abierto` / `Reabierto`) y a la derecha las tarjetas de los técnicos de su sub-gerencia con su carga activa en vivo (`Asignado`, `En Progreso`, `En Espera`), permitiendo asignar o reasignar con un clic. |
| `/tecnico/historial` | `TECNICO` (y roles supervisores) | **Base de Soluciones:** Buscador por texto, servicio del catálogo (`catalogo_incidencias`) o departamento TI que consulte tickets en estado `Resuelto - Por Verificar` o `Cerrado`, mostrando síntoma, `causa_raiz` y `solucion_aplicada`. *(Requiere un endpoint específico en backend porque actualmente `GET /tickets` para el rol `TECNICO` filtra estrictamente `id_tecnico = user.id`)*. |
| `/dashboard/reportes` | `DIRECTOR` (y `ADMINISTRADOR` / `MESA_TECNICA`) | **Reportes y SLAs:** Vista ejecutiva con filtro por rango de fechas / mes, tablas de cumplimiento de SLA por sub-gerencia y por técnico, ranking de reincidencia y botones de descarga de informes en CSV/Excel y PDF. |

---

## 3. Relojes Reales desde `ticket_bitacora`, KPIs y Exportaciones

### 3.1. Cálculo en Backend/PostgreSQL de los 3 Relojes Reales
* **Estado actual:** `DashboardOperativoPage.vue` calcula tiempos de forma aproximada en el navegador (`fecha_asignacion - fecha_creacion`, y `tiempoPausaTexto` usa `fecha_creacion` en vez del inicio real de la pausa).
* **Qué construir en Backend (SQL / Servicio de Métricas):**
  Calcular a partir de los eventos reales de `ticket_bitacora`:
  1. `tiempo_asignacion_minutos`: Diferencia entre `fecha_creacion` y la primera transición a `Asignado`.
  2. `tiempo_efectivo_minutos`: Suma exacta de todos los intervalos donde el ticket estuvo en estado `En Progreso` (cerrando cada intervalo cuando pasa a `En Espera`, `Resuelto - Por Verificar`, etc.).
  3. `tiempo_pausa_minutos`: Suma exacta de los intervalos en estado `En Espera`, agrupable por el motivo tipificado de pausa.
  4. `cumple_sla_asignacion` y `cumple_sla_resolucion`: Comparación booleana contra `tiempo_max_asignacion_minutos` y `tiempo_meta_resolucion_horas` de la tabla `prioridades_sla`.

### 3.2. KPIs y Filtros Pendientes en el Dashboard
* **Filtro por período / rango de fechas:** Permitir filtrar métricas por mes/año o últimos 30, 60 y 90 días.
* **Top de solicitudes/fallas del catálogo y equipos afectados:** Ranking de ítems de `catalogo_incidencias` más demandados y de `equipo_afectado` con más tickets.
* **Comparativa de tiempos entre técnicos pares:** Tiempo efectivo promedio por ítem del catálogo comparado entre los técnicos de una misma sub-gerencia (para detectar desvíos o tiempos inflados).
* **Indicadores de gobernanza:** Conteo de asignaciones en suplencia ejecutadas por `MESA_TECNICA`, porcentaje de reapertura por técnico y porcentaje de conformidad de usuarios (`conformidad_usuario`).

### 3.3. Exportación de Informes Oficiales (CSV/Excel y PDF)
Desde `/dashboard/reportes` (y opciones de exportación por área), generar automáticamente desde PostgreSQL:
1. **Listado Detallado de Casos Atendidos (Excel/CSV):** Folio, Fecha, Solicitante, Departamento Cliente, Sub-Área TI, Técnico(s), Servicio del Catálogo, Equipo Afectado, Estado, Tiempo Efectivo, Tiempo en Pausa, Causa Raíz y Solución Aplicada.
2. **Matriz Mensual por Técnico (Excel/CSV):** Conteo de tickets resueltos, tiempo efectivo promedio, % de cumplimiento SLA y % de reaperturas por técnico y por mes.
3. **Informe Ejecutivo Mensual (PDF):** Resumen gerencial con totales por sub-gerencia, top de departamentos solicitantes, cumplimiento de SLAs y desglose de demoras por pausas externas.

---

## 4. Limpieza Técnica Pre-Producción y Preparación de Fase 2

1. **Eliminar el simulador de roles en desarrollo:**
   * Retirar `cambiarRolSimulado` y el selector de simulación de rol en `useNavigation.ts` / layout antes de pasar a producción.
2. **Eliminar archivos legados con datos mock (código muerto):**
   * Borrar del repositorio frontend los archivos antiguos que ya fueron reemplazados por la integración real con PostgreSQL y que contienen el viejo modelo descartado de `TipoTrabajo`:
     * `src/types/types.ts` (mock antiguo)
     * `src/components/TipoCasoFormDialog.vue`
     * `src/composables/useCatalogoCasosCrud.ts`
     * `src/stores/catalogosStore.ts`
     * `src/pages/BandejaTecnico.vue`
     * `src/pages/RegistrosPage.vue`
     * `src/data/usuarios.ts`
3. **Fase 2 Post-Piloto (Autoservicio del rol `USUARIO`):**
   * Durante el Piloto (Fase 1), la vista `/usuario/mis-solicitudes` se mantiene de solo lectura para que el solicitante consulte el estatus de sus tickets abiertos vía telefónica.
   * En la Fase 2 se habilitará en esa misma vista el botón para que el `USUARIO` registre una solicitud y confirme o rechace el cierre cuando un ticket suyo esté en `Resuelto - Por Verificar`.

---

## 5. Orden de Ejecución Recomendado para la IA

1. **Iteración 1 (Base de Datos y Backend Core de Tickets):**
   * Migración/ajuste en `TABLAS.sql` y `FUNCIONES.sql`: campo `equipo_afectado`, estado `Cancelado`, `causa_raiz` obligatoria al resolver, pausa tipificada, tipo de cierre (confirmado vs. administrativo), transferencia de `id_departamento`, cierre directo N1 y validación/marca de suplencia en `ticket_bitacora`.
2. **Iteración 2 (UI del Flujo de Tickets):**
   * Actualizar `NuevoTicketPage.vue` (campo `equipo_afectado` + switch de Cierre Directo N1 para Mesa Técnica) y `TicketDetalleDialog.vue` (modal de transferencia de área, selector tipificado de pausa, `causa_raiz` obligatoria, cierre administrativo, reapertura y cancelación).
3. **Iteración 3 (Motor de Relojes SQL y las 3 Vistas Faltantes):**
   * Endpoint de métricas reales desde `ticket_bitacora` y endpoint de búsqueda para Base de Soluciones.
   * Construir y registrar en `routes.ts`: `/gerencia/asignacion`, `/tecnico/historial` y `/dashboard/reportes`.
4. **Iteración 4 (Exportadores y Limpieza Final):**
   * Exportación CSV/Excel y PDF en `/dashboard/reportes`, filtros por fecha en `DashboardOperativoPage.vue`, eliminación de archivos mock legados y retiro de `cambiarRolSimulado`.