<!-- 🛡️ [FASE 2.3 / 3.3 - TICKETS] Modal de detalle, transiciones RBAC, transferencia de área, pausas tipificadas y bitácora -->
<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <q-card class="detalle-dialog-card">
      <q-card-section class="row items-center justify-between dialog-header q-pa-md">
        <div class="row items-center q-gutter-sm">
          <span class="text-subtitle1 text-weight-bold text-dark">
            {{ ticket?.folio ?? 'Detalle de Ticket' }}
          </span>
          <PrioridadBadge v-if="ticket" :prioridad="ticket.prioridad" />
          <span v-if="ticket" class="chip" :class="ESTADO_CLASS[ticket.estado]">
            <span class="chip__dot" />
            {{ ticket.estado }}
          </span>
          <span
            v-if="ticket?.tipo_cierre"
            class="chip"
            :class="ticket.tipo_cierre === 'Administrativo' ? 'warn' : 'ok'"
          >
            Cierre {{ ticket.tipo_cierre }}
          </span>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="cerrarDialogo" />
      </q-card-section>

      <!-- 🛡️ [FASE 2.4 - TICKETS] Pestañas de Resumen/Acciones, Comentarios, Adjuntos y Bitácora -->
      <q-tabs
        v-if="ticket"
        v-model="tabActiva"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="tabs-barra q-px-md"
        no-caps
      >
        <q-tab name="resumen" icon="info" label="Resumen y Acciones" />
        <q-tab name="comentarios" icon="chat" label="Comentarios" />
        <q-tab name="adjuntos" icon="attach_file" label="Adjuntos" />
        <q-tab name="bitacora" icon="history" label="Bitácora" />
      </q-tabs>

      <q-card-section v-if="ticket" class="q-pa-md scroll detalle-body">
        <q-tab-panels v-model="tabActiva" animated>
          <q-tab-panel name="resumen" class="q-pa-none">
        <!-- Ficha resumen -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <div class="info-box q-pa-sm">
              <div class="text-caption muted text-uppercase text-weight-medium">Solicitante</div>
              <div class="text-weight-bold text-dark q-mt-xs">{{ ticket.solicitante }}</div>
              <div class="text-caption muted">
                {{ ticket.departamento_solicitante }} · {{ ticket.solicitante_telefono }}
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6">
            <div class="info-box q-pa-sm">
              <div class="text-caption muted text-uppercase text-weight-medium">
                Área TI y SLA
              </div>
              <div class="text-weight-bold text-dark q-mt-xs">
                {{ ticket.departamento }} ({{ ticket.codigo_departamento }})
              </div>
              <div class="text-caption muted">
                Asignación máx: {{ ticket.tiempo_max_asignacion_minutos }} min · Meta resolución:
                {{ ticket.tiempo_meta_resolucion_horas }} h
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6">
            <div class="info-box q-pa-sm">
              <div class="text-caption muted text-uppercase text-weight-medium">
                Incidencia del Catálogo
              </div>
              <div class="text-weight-medium text-dark q-mt-xs">
                {{ ticket.catalogo_incidencia }}
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6">
            <div class="info-box q-pa-sm">
              <div class="text-caption muted text-uppercase text-weight-medium">
                Técnico Asignado
              </div>
              <div class="text-weight-medium text-dark q-mt-xs">
                {{ ticket.tecnico ?? 'Sin asignar' }}
              </div>
              <div class="text-caption muted">Creado por: {{ ticket.usuario_creador }}</div>
            </div>
          </div>
        </div>

        <div class="info-box q-pa-sm q-mb-md">
          <div class="text-caption muted text-uppercase text-weight-medium q-mb-xs">
            Descripción de la Incidencia
          </div>
          <div class="text-body2 text-dark whitespace-preline">
            {{ ticket.descripcion_incidencia }}
          </div>
        </div>

        <div v-if="ticket.solucion_aplicada || ticket.causa_raiz" class="info-box q-pa-sm q-mb-md">
          <div class="text-caption muted text-uppercase text-weight-medium q-mb-xs">
            Diagnóstico y Solución Técnica
          </div>
          <div v-if="ticket.causa_raiz" class="text-body2 text-dark q-mb-xs">
            <strong>Causa raíz:</strong> {{ ticket.causa_raiz }}
          </div>
          <div v-if="ticket.solucion_aplicada" class="text-body2 text-dark">
            <strong>Solución aplicada:</strong> {{ ticket.solucion_aplicada }}
          </div>
        </div>

        <!-- Panel de acciones según rol y estado -->
        <div v-if="tieneAccionesDisponibles" class="acciones-panel q-pa-md q-mb-md">
          <div class="text-caption text-weight-bold text-uppercase text-primary q-mb-sm">
            Acciones del Ciclo de Vida
          </div>

          <div v-if="errorAccion" class="form-error q-pa-sm rounded-borders q-mb-sm">
            {{ errorAccion }}
          </div>

          <!-- Selección de acción cuando hay múltiples -->
          <div class="row q-gutter-sm q-mb-sm">
            <q-btn
              v-if="puedeAsignar"
              :outline="accionActiva !== 'Asignado'"
              :unelevated="accionActiva === 'Asignado'"
              color="primary"
              no-caps
              dense
              icon="person_add"
              :label="ticket.id_tecnico ? 'Reasignar Técnico' : 'Asignar Técnico'"
              @click="seleccionarAccion('Asignado')"
            />
            <q-btn
              v-if="puedeTransferir"
              :outline="accionActiva !== 'TRANSFERIR'"
              :unelevated="accionActiva === 'TRANSFERIR'"
              color="secondary"
              no-caps
              dense
              icon="swap_horiz"
              label="Transferir de Área TI"
              @click="seleccionarAccion('TRANSFERIR')"
            />
            <q-btn
              v-if="puedeIniciar"
              :unelevated="accionActiva === 'En Progreso'"
              :outline="accionActiva !== 'En Progreso'"
              color="primary"
              no-caps
              dense
              icon="play_arrow"
              :label="ticket.estado === 'En Espera' ? 'Reanudar Atención' : 'Iniciar Atención'"
              @click="seleccionarAccion('En Progreso')"
            />
            <q-btn
              v-if="puedePausar"
              :unelevated="accionActiva === 'En Espera'"
              :outline="accionActiva !== 'En Espera'"
              color="warning"
              no-caps
              dense
              icon="pause"
              label="Pausar (En Espera)"
              @click="seleccionarAccion('En Espera')"
            />
            <q-btn
              v-if="puedeResolver"
              :unelevated="accionActiva === 'Resuelto - Por Verificar'"
              :outline="accionActiva !== 'Resuelto - Por Verificar'"
              color="positive"
              no-caps
              dense
              icon="check_circle"
              :label="ticket.estado === 'Abierto' ? 'Resolver en Nivel 1' : 'Marcar Resuelto'"
              @click="seleccionarAccion('Resuelto - Por Verificar')"
            />
            <q-btn
              v-if="puedeCierreDirectoN1"
              :unelevated="accionActiva === 'Cerrado'"
              :outline="accionActiva !== 'Cerrado'"
              color="positive"
              no-caps
              dense
              icon="verified"
              label="Cierre Directo N1"
              @click="seleccionarAccion('Cerrado')"
            />
            <q-btn
              v-if="puedeCerrar"
              :unelevated="accionActiva === 'Cerrado'"
              :outline="accionActiva !== 'Cerrado'"
              color="positive"
              no-caps
              dense
              icon="verified"
              label="Verificar y Cerrar"
              @click="seleccionarAccion('Cerrado')"
            />
            <q-btn
              v-if="puedeReabrir"
              :unelevated="accionActiva === 'Reabierto'"
              :outline="accionActiva !== 'Reabierto'"
              color="negative"
              no-caps
              dense
              icon="replay"
              label="Reabrir Ticket"
              @click="seleccionarAccion('Reabierto')"
            />
            <q-btn
              v-if="puedeCerrarNoResuelto"
              :unelevated="accionActiva === 'No Resuelto'"
              :outline="accionActiva !== 'No Resuelto'"
              color="warning"
              no-caps
              dense
              icon="highlight_off"
              label="Cerrar como No Resuelto"
              @click="seleccionarAccion('No Resuelto')"
            />
            <q-btn
              v-if="puedeCancelar"
              :unelevated="accionActiva === 'Cancelado'"
              :outline="accionActiva !== 'Cancelado'"
              color="negative"
              no-caps
              dense
              icon="cancel"
              label="Cancelar Ticket"
              @click="seleccionarAccion('Cancelado')"
            />
          </div>

          <!-- Formulario dinámico según la acción seleccionada -->
          <div v-if="accionActiva" class="q-mt-sm q-gutter-y-sm">
            <!-- 🛡️ [FASE 3.3 - TICKETS] Aviso y candado visual de Asignación en Suplencia para MESA_TECNICA -->
            <q-banner
              v-if="accionActiva === 'Asignado' && esAsignacionSuplenciaMesa"
              dense
              rounded
              class="text-caption q-pa-sm"
              :class="slaAsignacionVencido ? 'banner-suplencia-ok' : 'banner-suplencia-warn'"
            >
              <template #avatar>
                <q-icon
                  :name="slaAsignacionVencido ? 'gpp_good' : 'warning_amber'"
                  :color="slaAsignacionVencido ? 'primary' : 'warning'"
                  size="20px"
                />
              </template>
              <span v-if="slaAsignacionVencido">
                <strong>Asignación en Suplencia (SLA vencido):</strong> Este ticket superó la meta de
                {{ ticket.tiempo_max_asignacion_minutos }} min. La intervención de Mesa Técnica quedará
                registrada en bitácora.
              </span>
              <span v-else>
                <strong>Suplencia anticipada:</strong> El SLA de asignación aún está vigente (meta:
                {{ ticket.tiempo_max_asignacion_minutos }} min). Para asignar por ausencia del Gerente
                de Área, debes indicar el motivo obligatorio en el comentario.
              </span>
            </q-banner>

            <q-select
              v-if="accionActiva === 'Asignado'"
              v-model="form.id_tecnico"
              :options="opcionesTecnicos"
              option-value="id"
              option-label="nombre_completo"
              emit-value
              map-options
              outlined
              dense
              :label="esTicketMesaTecnica ? 'Responsable de Mesa Técnica *' : 'Técnico especialista *'"
              :loading="cargandoTecnicos"
              :hint="
                opcionesTecnicos.length
                  ? esTicketMesaTecnica
                    ? 'Personal activo de Mesa Técnica (TI-MT)'
                    : 'Solo técnicos activos del área responsable'
                  : esTicketMesaTecnica
                    ? 'No hay operadores activos en Mesa Técnica'
                    : 'No hay técnicos activos en esta área'
              "
            />

            <!-- 🛡️ [FASE 3.3 - TICKETS] Selector de Sub-Gerencia TI destino para Transferencia -->
            <q-select
              v-if="accionActiva === 'TRANSFERIR'"
              v-model="form.id_departamento_nuevo"
              :options="opcionesAreasTiDestino"
              option-value="id"
              :option-label="(d) => `${d.nombre} (${d.codigo})`"
              emit-value
              map-options
              outlined
              dense
              label="Sub-Gerencia TI destino *"
              :loading="departmentsStore.cargando"
              hint="El ticket pasará a estado Abierto y sin técnico en la bandeja del área destino"
            />

            <!-- 🛡️ [FASE 3.3 - TICKETS] Selector tipificado obligatorio de pausa -->
            <q-select
              v-if="accionActiva === 'En Espera'"
              v-model="form.motivo_pausa"
              :options="[...MOTIVOS_PAUSA]"
              outlined
              dense
              label="Motivo tipificado de pausa *"
              hint="Selecciona la causa externa que detiene el reloj SLA; agrega detalle opcional abajo"
            />

            <template
              v-if="
                accionActiva === 'Resuelto - Por Verificar' ||
                (accionActiva === 'Cerrado' && ticket.estado === 'Abierto')
              "
            >
              <q-input
                v-model="form.causa_raiz"
                outlined
                dense
                type="textarea"
                rows="2"
                maxlength="2000"
                label="Causa raíz *"
                placeholder="Ej. Servicio detenido, conector RJ-45 dañado o permiso faltante en sistema"
              />
              <q-input
                v-model="form.solucion_aplicada"
                outlined
                dense
                type="textarea"
                rows="3"
                maxlength="2000"
                label="Solución aplicada *"
                placeholder="Describe los pasos técnicos ejecutados para resolver la incidencia"
              />
              <q-checkbox
                v-if="accionActiva === 'Resuelto - Por Verificar' && rol === 'MESA_TECNICA'"
                v-model="form.cerrar_inmediato"
                dense
                color="primary"
                label="Usuario confirmó conformidad en llamada (cerrar ticket inmediatamente)"
              />
              <q-checkbox
                v-if="accionActiva === 'Cerrado' && ticket.estado === 'Abierto'"
                v-model="form.conformidad_usuario"
                dense
                color="positive"
                label="El solicitante confirmó conformidad durante la llamada (Cierre Directo N1)"
              />
            </template>

            <q-input
              v-if="accionActiva === 'No Resuelto'"
              v-model="form.causa_raiz"
              outlined
              dense
              type="textarea"
              rows="2"
              maxlength="2000"
              label="Causa raíz / Dictamen técnico *"
              placeholder="Ej. Equipo irreparable, sin repuesto o rechazado por política"
            />

            <!-- 🛡️ [FASE 3.3 - TICKETS] Tipo de Cierre: Confirmado vs Administrativo -->
            <template v-if="accionActiva === 'Cerrado' && ticket.estado !== 'Abierto'">
              <q-option-group
                v-model="form.tipo_cierre"
                inline
                dense
                color="primary"
                :options="[
                  { label: 'Confirmado con usuario', value: 'Confirmado' },
                  { label: 'Cierre administrativo (usuario ilocalizable)', value: 'Administrativo' },
                ]"
              />
              <q-checkbox
                v-if="form.tipo_cierre === 'Confirmado'"
                v-model="form.conformidad_usuario"
                dense
                color="primary"
                label="El usuario solicitante confirma conformidad con la solución"
              />
              <div v-else class="text-caption text-warning">
                El cierre administrativo fija conformidad en <strong>No</strong> y exige documentar los intentos de contacto en el comentario.
              </div>
            </template>

            <q-input
              v-model="form.comentario"
              outlined
              dense
              type="textarea"
              rows="2"
              maxlength="1000"
              :label="etiquetaComentarioAccion"
            />

            <div class="row justify-end q-gutter-sm q-mt-xs">
              <q-btn flat no-caps color="grey-7" label="Cancelar" @click="accionActiva = null" />
              <q-btn
                unelevated
                no-caps
                :color="colorBotonConfirmar"
                :loading="ticketStore.guardando"
                :label="etiquetaBotonConfirmar"
                @click="ejecutarAccion"
              />
            </div>
          </div>
        </div>

        <!-- Bitácora cronológica -->
          </q-tab-panel>

          <q-tab-panel name="comentarios" class="q-pa-none">
            <TicketComentariosAdjuntos
              :ticket-id="ticket.id"
              :ticket-estado="ticket.estado"
              seccion="comentarios"
            />
          </q-tab-panel>

          <q-tab-panel name="adjuntos" class="q-pa-none">
            <TicketComentariosAdjuntos
              :ticket-id="ticket.id"
              :ticket-estado="ticket.estado"
              seccion="adjuntos"
            />
          </q-tab-panel>

          <q-tab-panel name="bitacora" class="q-pa-none">
            <div>
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-caption text-weight-bold text-uppercase muted">
                  Bitácora de Auditoría
                </span>
                <q-spinner v-if="cargandoBitacora" color="primary" size="18px" />
              </div>

              <div v-if="!cargandoBitacora && !bitacora.length" class="text-caption muted">
                Sin movimientos registrados en bitácora.
              </div>

              <q-timeline v-else color="primary" layout="dense" class="q-my-none">
                <q-timeline-entry
                  v-for="item in bitacora"
                  :key="item.id"
                  :subtitle="formatearFecha(item.fecha_registro)"
                >
                  <template #title>
                    <div class="row items-center q-gutter-xs">
                      <span class="text-weight-bold text-dark">{{ item.usuario_accion }}</span>
                      <span class="text-caption muted">({{ item.rol_accion }})</span>
                    </div>
                  </template>
                  <div class="row items-center q-gutter-xs text-caption text-dark">
                    <span v-if="item.estado_anterior" class="muted">{{ item.estado_anterior }} → </span>
                    <span class="chip" :class="ESTADO_CLASS[item.estado_nuevo]">
                      <span class="chip__dot" />
                      {{ item.estado_nuevo }}
                    </span>
                    <span
                      v-if="item.departamento_anterior && item.departamento_nuevo"
                      class="chip info"
                    >
                      <q-icon name="swap_horiz" size="13px" />
                      {{ item.departamento_anterior }} → {{ item.departamento_nuevo }}
                    </span>
                    <span v-if="item.es_suplencia" class="chip warn">
                      Suplencia Mesa Técnica
                    </span>
                    <span
                      v-if="item.tipo_cierre"
                      class="chip"
                      :class="item.tipo_cierre === 'Administrativo' ? 'warn' : 'ok'"
                    >
                      Cierre {{ item.tipo_cierre }}
                    </span>
                  </div>
                  <div v-if="item.motivo_pausa" class="text-caption text-warning q-mt-xs">
                    <strong>Motivo de pausa:</strong> {{ item.motivo_pausa }}
                  </div>
                  <div v-if="item.comentario" class="text-caption muted q-mt-xs whitespace-preline">
                    {{ item.comentario }}
                  </div>
                </q-timeline-entry>
              </q-timeline>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import PrioridadBadge from '@/components/common/PrioridadBadge.vue';
import TicketComentariosAdjuntos from '@/components/tickets/TicketComentariosAdjuntos.vue';
import { ESTADO_CLASS } from '@/composables/useTickets';
import {
  MOTIVOS_PAUSA,
  type EstadoTicket,
  type MotivoPausa,
  type PatchTicketEstadoPayload,
  type TecnicoDisponible,
  type Ticket,
  type TicketBitacoraItem,
  type TipoCierre,
} from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useDepartmentsStore } from '@/stores/useDepartmentsStore';
import { formatearFechaHora } from '@/utils/formatFecha';
import { useTicketStore } from '@/stores/ticketStore';

type AccionDetalle = EstadoTicket | 'TRANSFERIR';

const ESTADOS_TERMINALES_DETALLE: readonly EstadoTicket[] = [
  'Cerrado',
  'No Resuelto',
  'Cancelado',
];

function normalizarTexto(valor: string | null | undefined): string {
  return (valor ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const props = defineProps<{
  modelValue: boolean;
  ticket: Ticket | null;
  tabInicial?: 'resumen' | 'comentarios' | 'adjuntos' | 'bitacora';
}>();

const emit = defineEmits<{
  'update:modelValue': [val: boolean];
  actualizado: [];
}>();

const $q = useQuasar();
const authStore = useAuthStore();
const departmentsStore = useDepartmentsStore();
const ticketStore = useTicketStore();

const bitacora = ref<TicketBitacoraItem[]>([]);
const cargandoBitacora = ref(false);
const opcionesTecnicos = ref<TecnicoDisponible[]>([]);
const cargandoTecnicos = ref(false);
const accionActiva = ref<AccionDetalle | null>(null);
const errorAccion = ref<string | null>(null);
const tabActiva = ref<'resumen' | 'comentarios' | 'adjuntos' | 'bitacora'>('resumen');

const form = reactive<{
  id_tecnico: number | null;
  id_departamento_nuevo: number | null;
  motivo_pausa: MotivoPausa | null;
  causa_raiz: string;
  solucion_aplicada: string;
  comentario: string;
  conformidad_usuario: boolean;
  tipo_cierre: TipoCierre;
  cerrar_inmediato: boolean;
}>({
  id_tecnico: null,
  id_departamento_nuevo: null,
  motivo_pausa: null,
  causa_raiz: '',
  solucion_aplicada: '',
  comentario: '',
  conformidad_usuario: true,
  tipo_cierre: 'Confirmado',
  cerrar_inmediato: false,
});

const rol = computed(() => authStore.role);
const idUsuario = computed(() => Number(authStore.usuario?.id ?? 0));

const esTicketMesaTecnica = computed(
  () => props.ticket?.codigo_departamento?.trim().toUpperCase() === 'TI-MT',
);

const esTecnicoAsignado = computed(
  () =>
    props.ticket !== null &&
    Number(props.ticket.id_tecnico) === idUsuario.value &&
    (rol.value === 'TECNICO' || (rol.value === 'MESA_TECNICA' && esTicketMesaTecnica.value)),
);

// 🛡️ [FASE 3.3 - TICKETS] Evaluación de asignación en suplencia por Mesa Técnica
const esAsignacionSuplenciaMesa = computed(
  () => rol.value === 'MESA_TECNICA' && props.ticket !== null && !esTicketMesaTecnica.value,
);

const slaAsignacionVencido = computed(() => {
  if (!props.ticket || !props.ticket.activa_suplencia) return false;
  const creacionMs = new Date(props.ticket.fecha_creacion).getTime();
  if (!Number.isFinite(creacionMs)) return false;
  const minutos = Math.floor((Date.now() - creacionMs) / 60000);
  return minutos >= Number(props.ticket.tiempo_max_asignacion_minutos);
});

const opcionesAreasTiDestino = computed(() => {
  if (!props.ticket) return [];
  return departmentsStore.departments.filter(
    (d) =>
      d.is_activo &&
      normalizarTexto(d.tipo_departamento) === 'SUB-GERENCIA TI' &&
      d.id !== props.ticket?.id_departamento,
  );
});

const puedeAsignar = computed(() => {
  if (!props.ticket) return false;
  const estadosAsignables: readonly EstadoTicket[] = [
    'Abierto',
    'Asignado',
    'En Espera',
    'Reabierto',
  ];
  if (!estadosAsignables.includes(props.ticket.estado)) return false;

  if (rol.value === 'ADMINISTRADOR' || rol.value === 'MESA_TECNICA') return true;
  if (rol.value === 'GERENTE_AREA') {
    const dptoUsuario = authStore.usuario?.id_departamento;
    return dptoUsuario === undefined || dptoUsuario === props.ticket.id_departamento;
  }
  return false;
});

const puedeTransferir = computed(() => {
  if (!props.ticket) return false;
  if (ESTADOS_TERMINALES_DETALLE.includes(props.ticket.estado)) return false;
  if (rol.value === 'ADMINISTRADOR' || rol.value === 'MESA_TECNICA') return true;
  if (rol.value === 'GERENTE_AREA') {
    const dptoUsuario = authStore.usuario?.id_departamento;
    return dptoUsuario === undefined || dptoUsuario === props.ticket.id_departamento;
  }
  return esTecnicoAsignado.value;
});

const puedeIniciar = computed(() => {
  if (!props.ticket || !esTecnicoAsignado.value) return false;
  return ['Asignado', 'En Espera', 'Reabierto'].includes(props.ticket.estado);
});

const puedePausar = computed(
  () => props.ticket?.estado === 'En Progreso' && esTecnicoAsignado.value,
);

const puedeResolver = computed(() => {
  if (!props.ticket) return false;
  if (props.ticket.estado === 'En Progreso' && esTecnicoAsignado.value) return true;
  return (
    props.ticket.estado === 'Abierto' &&
    rol.value === 'MESA_TECNICA' &&
    esTicketMesaTecnica.value
  );
});

const puedeCierreDirectoN1 = computed(
  () =>
    props.ticket?.estado === 'Abierto' &&
    (rol.value === 'MESA_TECNICA' || rol.value === 'ADMINISTRADOR'),
);

const puedeCerrar = computed(
  () => props.ticket?.estado === 'Resuelto - Por Verificar' && rol.value === 'MESA_TECNICA',
);

const puedeReabrir = computed(
  () =>
    (props.ticket?.estado === 'Resuelto - Por Verificar' || props.ticket?.estado === 'Cerrado') &&
    (rol.value === 'MESA_TECNICA' || rol.value === 'ADMINISTRADOR'),
);

const puedeCancelar = computed(() => {
  if (!props.ticket) return false;
  if (!['Abierto', 'Asignado'].includes(props.ticket.estado)) return false;
  return rol.value === 'MESA_TECNICA' || rol.value === 'ADMINISTRADOR';
});

const puedeCerrarNoResuelto = computed(() => {
  if (!props.ticket) return false;
  if (!['En Progreso', 'En Espera'].includes(props.ticket.estado)) return false;
  if (
    esTecnicoAsignado.value ||
    rol.value === 'MESA_TECNICA' ||
    rol.value === 'ADMINISTRADOR'
  ) {
    return true;
  }
  if (rol.value === 'GERENTE_AREA') {
    const dptoUsuario = authStore.usuario?.id_departamento;
    return dptoUsuario === undefined || dptoUsuario === props.ticket.id_departamento;
  }
  return false;
});

const tieneAccionesDisponibles = computed(
  () =>
    puedeAsignar.value ||
    puedeTransferir.value ||
    puedeIniciar.value ||
    puedePausar.value ||
    puedeResolver.value ||
    puedeCierreDirectoN1.value ||
    puedeCerrar.value ||
    puedeReabrir.value ||
    puedeCancelar.value ||
    puedeCerrarNoResuelto.value,
);

const etiquetaComentarioAccion = computed(() => {
  if (accionActiva.value === 'TRANSFERIR') {
    return 'Justificación técnica de la transferencia * (mín. 10 caracteres)';
  }
  if (accionActiva.value === 'Asignado' && esAsignacionSuplenciaMesa.value && !slaAsignacionVencido.value) {
    return 'Motivo de suplencia por ausencia del Gerente de Área *';
  }
  if (accionActiva.value === 'En Espera') {
    return 'Detalle adicional de la pausa (opcional)';
  }
  if (accionActiva.value === 'Cerrado' && props.ticket?.estado !== 'Abierto' && form.tipo_cierre === 'Administrativo') {
    return 'Registro de intentos de contacto al usuario (obligatorio) *';
  }
  if (accionActiva.value === 'Reabierto') return 'Motivo de reapertura *';
  if (accionActiva.value === 'Cancelado') return 'Motivo de cancelación *';
  if (accionActiva.value === 'No Resuelto') return 'Observación para bitácora y solicitante *';
  return 'Comentario para bitácora (opcional)';
});

const colorBotonConfirmar = computed(() => {
  if (accionActiva.value === 'Cancelado') return 'negative';
  if (accionActiva.value === 'No Resuelto') return 'warning';
  if (accionActiva.value === 'TRANSFERIR') return 'secondary';
  if (accionActiva.value === 'Cerrado') return 'positive';
  return 'primary';
});

const etiquetaBotonConfirmar = computed(() => {
  if (accionActiva.value === 'TRANSFERIR') return 'Confirmar transferencia';
  if (accionActiva.value === 'Cancelado') return 'Confirmar cancelación';
  if (accionActiva.value === 'No Resuelto') return 'Confirmar cierre sin solución';
  if (accionActiva.value === 'Cerrado' && props.ticket?.estado === 'Abierto') {
    return 'Confirmar Cierre Directo N1';
  }
  if (accionActiva.value === 'Cerrado' && form.tipo_cierre === 'Administrativo') {
    return 'Confirmar Cierre Administrativo';
  }
  if (accionActiva.value === 'Resuelto - Por Verificar' && form.cerrar_inmediato) {
    return 'Resolver y Cerrar';
  }
  return 'Confirmar transición';
});

function resetearFormulario(): void {
  tabActiva.value = props.tabInicial ?? 'resumen';
  accionActiva.value = null;
  errorAccion.value = null;
  form.id_tecnico = null;
  form.id_departamento_nuevo = null;
  form.motivo_pausa = null;
  form.causa_raiz = '';
  form.solucion_aplicada = '';
  form.comentario = '';
  form.conformidad_usuario = true;
  form.tipo_cierre = 'Confirmado';
  form.cerrar_inmediato = false;
}

async function cargarDatosDetalle(): Promise<void> {
  if (!props.ticket || !props.modelValue) return;
  resetearFormulario();

  cargandoBitacora.value = true;
  try {
    bitacora.value = await ticketStore.cargarBitacora(props.ticket.id);
  } catch (err: unknown) {
    bitacora.value = [];
    errorAccion.value =
      err instanceof Error ? err.message : 'No fue posible cargar la bitácora.';
  } finally {
    cargandoBitacora.value = false;
  }
}

watch(
  () => [props.modelValue, props.ticket?.id] as const,
  ([abierto]) => {
    if (abierto) {
      void cargarDatosDetalle();
    }
  },
);

async function seleccionarAccion(accion: AccionDetalle): Promise<void> {
  accionActiva.value = accion;
  errorAccion.value = null;

  if (accion === 'Asignado' && props.ticket) {
    cargandoTecnicos.value = true;
    try {
      opcionesTecnicos.value = await ticketStore.cargarTecnicosDisponibles(
        props.ticket.id_departamento,
      );
    } catch (err: unknown) {
      errorAccion.value =
        err instanceof Error ? err.message : 'No se pudieron cargar los técnicos.';
    } finally {
      cargandoTecnicos.value = false;
    }
  } else if (accion === 'TRANSFERIR' && departmentsStore.departments.length === 0) {
    try {
      await departmentsStore.cargarDepartamentos();
    } catch (err: unknown) {
      errorAccion.value =
        err instanceof Error ? err.message : 'No se pudieron cargar las áreas TI destino.';
    }
  }
}

async function ejecutarAccion(): Promise<void> {
  if (!props.ticket || !accionActiva.value) return;
  errorAccion.value = null;

  // 🛡️ [FASE 3.3 - TICKETS] Flujo dedicado para Transferencia de Área TI
  if (accionActiva.value === 'TRANSFERIR') {
    if (!form.id_departamento_nuevo) {
      errorAccion.value = 'Debes seleccionar la Sub-Gerencia TI destino.';
      return;
    }
    if (form.comentario.trim().length < 10) {
      errorAccion.value =
        'Debes indicar una justificación técnica de al menos 10 caracteres para transferir el ticket.';
      return;
    }
    try {
      const res = await ticketStore.transferirTicket(props.ticket.id, {
        id_departamento_nuevo: form.id_departamento_nuevo,
        comentario: form.comentario.trim(),
      });
      $q.notify({
        type: 'positive',
        message: `Ticket ${res.folio} transferido de ${res.departamento_anterior} a ${res.departamento_nuevo}.`,
        position: 'top-right',
      });
      emit('actualizado');
      emit('update:modelValue', false);
    } catch (err: unknown) {
      errorAccion.value =
        err instanceof Error ? err.message : 'No fue posible transferir el ticket.';
    }
    return;
  }

  const payload: PatchTicketEstadoPayload = {
    estado_nuevo: accionActiva.value,
  };

  if (accionActiva.value === 'Asignado') {
    if (!form.id_tecnico) {
      errorAccion.value = 'Debes seleccionar un técnico especialista.';
      return;
    }
    if (esAsignacionSuplenciaMesa.value && !slaAsignacionVencido.value && !form.comentario.trim()) {
      errorAccion.value =
        'El SLA aún está vigente; indica en el comentario el motivo de suplencia por ausencia del Gerente de Área.';
      return;
    }
    payload.id_tecnico = form.id_tecnico;
  }

  if (accionActiva.value === 'En Espera') {
    if (!form.motivo_pausa) {
      errorAccion.value = 'Debes seleccionar el motivo tipificado de la pausa.';
      return;
    }
    payload.motivo_pausa = form.motivo_pausa;
  }

  if (accionActiva.value === 'Resuelto - Por Verificar') {
    if (!form.causa_raiz.trim()) {
      errorAccion.value = 'Debes documentar la causa raíz para alimentar la Base de Soluciones.';
      return;
    }
    if (!form.solucion_aplicada.trim()) {
      errorAccion.value = 'Debes documentar la solución aplicada.';
      return;
    }
    payload.causa_raiz = form.causa_raiz.trim();
    payload.solucion_aplicada = form.solucion_aplicada.trim();
  }

  if (accionActiva.value === 'Cerrado') {
    if (props.ticket.estado === 'Abierto') {
      if (!form.causa_raiz.trim()) {
        errorAccion.value = 'Debes documentar la causa raíz para el Cierre Directo Nivel 1.';
        return;
      }
      if (!form.solucion_aplicada.trim()) {
        errorAccion.value = 'Debes documentar la solución aplicada para el Cierre Directo Nivel 1.';
        return;
      }
      payload.causa_raiz = form.causa_raiz.trim();
      payload.solucion_aplicada = form.solucion_aplicada.trim();
      payload.conformidad_usuario = form.conformidad_usuario;
      payload.tipo_cierre = 'Confirmado';
    } else {
      payload.tipo_cierre = form.tipo_cierre;
      if (form.tipo_cierre === 'Administrativo') {
        if (!form.comentario.trim()) {
          errorAccion.value =
            'Debes documentar en el comentario los intentos de contacto para el Cierre Administrativo.';
          return;
        }
        payload.conformidad_usuario = false;
      } else {
        payload.conformidad_usuario = form.conformidad_usuario;
      }
    }
  }

  if (accionActiva.value === 'Reabierto' && !form.comentario.trim()) {
    errorAccion.value = 'Debes indicar el motivo de reapertura.';
    return;
  }

  if (accionActiva.value === 'Cancelado' && !form.comentario.trim()) {
    errorAccion.value = 'Debes indicar el motivo de cancelación.';
    return;
  }

  if (accionActiva.value === 'No Resuelto') {
    if (!form.causa_raiz.trim()) {
      errorAccion.value = 'Debes indicar la causa raíz o dictamen técnico.';
      return;
    }
    if (!form.comentario.trim()) {
      errorAccion.value = 'Debes indicar la observación para bitácora y solicitante.';
      return;
    }
    payload.causa_raiz = form.causa_raiz.trim();
  }

  if (form.comentario.trim()) {
    payload.comentario = form.comentario.trim();
  }

  try {
    const res = await ticketStore.cambiarEstadoTicket(props.ticket.id, payload);

    if (
      accionActiva.value === 'Resuelto - Por Verificar' &&
      rol.value === 'MESA_TECNICA' &&
      form.cerrar_inmediato
    ) {
      try {
        const payloadCierre: PatchTicketEstadoPayload = {
          estado_nuevo: 'Cerrado',
          tipo_cierre: 'Confirmado',
          conformidad_usuario: true,
          ...(form.comentario.trim() ? { comentario: form.comentario.trim() } : {}),
        };
        const resCierre = await ticketStore.cambiarEstadoTicket(props.ticket.id, payloadCierre);
        $q.notify({
          type: 'positive',
          message: `Ticket ${resCierre.folio} resuelto y cerrado con conformidad del usuario.`,
          position: 'top-right',
        });
      } catch (errCierre: unknown) {
        const msgCierre =
          errCierre instanceof Error ? errCierre.message : 'No se pudo completar el cierre.';
        $q.notify({
          type: 'warning',
          message: `Ticket ${res.folio} quedó en "${res.estado_nuevo}", pero falló el cierre inmediato: ${msgCierre}`,
          position: 'top-right',
          timeout: 4500,
        });
      }
      emit('actualizado');
      emit('update:modelValue', false);
      return;
    }

    $q.notify({
      type: 'positive',
      message: `Ticket ${res.folio} actualizado a "${res.estado_nuevo}".`,
      position: 'top-right',
    });
    emit('actualizado');
    emit('update:modelValue', false);
  } catch (err: unknown) {
    errorAccion.value =
      err instanceof Error ? err.message : 'No fue posible actualizar el estado del ticket.';
  }
}

function cerrarDialogo(): void {
  emit('update:modelValue', false);
}

function formatearFecha(fecha: string): string {
  return formatearFechaHora(fecha);
}
</script>

<style scoped lang="scss">
.detalle-dialog-card {
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  color: var(--text-primary);
  box-shadow: 0 22px 52px rgba(10, 13, 12, 0.22) !important;
  overflow: hidden;
}

.tabs-barra {
  background: var(--surface-card);
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);

  :deep(.q-tab) {
    color: var(--text-muted);
    transition: color var(--transition-ui);

    &:hover {
      color: var(--text-primary);
    }
  }

  :deep(.q-tab--active) {
    color: var(--brand-ink);
  }
}

.detalle-body {
  overflow-y: auto;

  :deep(.q-tab-panels),
  :deep(.q-tab-panel) {
    background: transparent;
    color: var(--text-primary);
  }
}

.info-box {
  background: var(--surface-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.acciones-panel {
  background: var(--brand-primary-soft);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.banner-suplencia-ok {
  background: var(--info-soft);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
}

.banner-suplencia-warn {
  background: var(--warning-soft);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.whitespace-preline {
  white-space: pre-line;
}
</style>
