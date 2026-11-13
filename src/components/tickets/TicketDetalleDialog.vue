<!-- 🛡️ [FASE 2.3 - TICKETS] Modal de detalle, transiciones de estado RBAC y bitácora del ticket -->
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
          <span v-if="ticket" class="chip" :class="claseChipPrioridad(ticket.prioridad)">
            <span class="chip__dot" />
            {{ ticket.prioridad }}
          </span>
          <span v-if="ticket" class="chip" :class="ESTADO_CLASS[ticket.estado]">
            <span class="chip__dot" />
            {{ ticket.estado }}
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
        class="text-grey-7 tabs-barra q-px-md"
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
              label="Marcar Resuelto"
              @click="seleccionarAccion('Resuelto - Por Verificar')"
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
          </div>

          <!-- Formulario dinámico según la acción seleccionada -->
          <div v-if="accionActiva" class="q-mt-sm q-gutter-y-sm">
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
              label="Técnico especialista *"
              :loading="cargandoTecnicos"
              :hint="
                opcionesTecnicos.length
                  ? 'Solo técnicos activos del área responsable'
                  : 'No hay técnicos activos en esta área'
              "
            />

            <q-input
              v-if="accionActiva === 'En Espera'"
              v-model="form.motivo_pausa"
              outlined
              dense
              maxlength="100"
              counter
              label="Motivo de pausa *"
              placeholder="Ej. Esperando repuesto / confirmación del usuario"
            />

            <template v-if="accionActiva === 'Resuelto - Por Verificar'">
              <q-input
                v-model="form.causa_raiz"
                outlined
                dense
                type="textarea"
                rows="2"
                maxlength="2000"
                label="Causa raíz (opcional)"
              />
              <q-input
                v-model="form.solucion_aplicada"
                outlined
                dense
                type="textarea"
                rows="3"
                maxlength="2000"
                label="Solución aplicada *"
              />
            </template>

            <q-checkbox
              v-if="accionActiva === 'Cerrado'"
              v-model="form.conformidad_usuario"
              dense
              color="primary"
              label="El usuario solicitante confirma conformidad con la solución"
            />

            <q-input
              v-model="form.comentario"
              outlined
              dense
              type="textarea"
              rows="2"
              maxlength="1000"
              :label="
                accionActiva === 'Reabierto'
                  ? 'Motivo de reapertura *'
                  : 'Comentario para bitácora (opcional)'
              "
            />

            <div class="row justify-end q-gutter-sm q-mt-xs">
              <q-btn flat no-caps color="grey-7" label="Cancelar" @click="accionActiva = null" />
              <q-btn
                unelevated
                no-caps
                color="primary"
                :loading="ticketStore.guardando"
                label="Confirmar transición"
                @click="ejecutarTransicion"
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
                  <div class="text-caption text-dark">
                    <span v-if="item.estado_anterior" class="muted">{{ item.estado_anterior }} → </span>
                    <span class="chip q-ml-xs" :class="ESTADO_CLASS[item.estado_nuevo]">
                      {{ item.estado_nuevo }}
                    </span>
                  </div>
                  <div v-if="item.motivo_pausa" class="text-caption text-warning q-mt-xs">
                    <strong>Motivo de pausa:</strong> {{ item.motivo_pausa }}
                  </div>
                  <div v-if="item.comentario" class="text-caption muted q-mt-xs">
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
import TicketComentariosAdjuntos from '@/components/tickets/TicketComentariosAdjuntos.vue';
import { claseChipPrioridad, ESTADO_CLASS } from '@/composables/useTickets';
import type {
  EstadoTicket,
  PatchTicketEstadoPayload,
  TecnicoDisponible,
  Ticket,
  TicketBitacoraItem,
} from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useTicketStore } from '@/stores/ticketStore';

const props = defineProps<{
  modelValue: boolean;
  ticket: Ticket | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [val: boolean];
  actualizado: [];
}>();

const $q = useQuasar();
const authStore = useAuthStore();
const ticketStore = useTicketStore();

const bitacora = ref<TicketBitacoraItem[]>([]);
const cargandoBitacora = ref(false);
const opcionesTecnicos = ref<TecnicoDisponible[]>([]);
const cargandoTecnicos = ref(false);
const accionActiva = ref<EstadoTicket | null>(null);
const errorAccion = ref<string | null>(null);
const tabActiva = ref<'resumen' | 'comentarios' | 'adjuntos' | 'bitacora'>('resumen');

const form = reactive({
  id_tecnico: null as number | null,
  motivo_pausa: '',
  causa_raiz: '',
  solucion_aplicada: '',
  comentario: '',
  conformidad_usuario: true,
});

const rol = computed(() => authStore.role);
const idUsuario = computed(() => Number(authStore.usuario?.id ?? 0));

const esTecnicoAsignado = computed(
  () =>
    rol.value === 'TECNICO' &&
    props.ticket !== null &&
    Number(props.ticket.id_tecnico) === idUsuario.value,
);

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

const puedeIniciar = computed(() => {
  if (!props.ticket || !esTecnicoAsignado.value) return false;
  return ['Asignado', 'En Espera', 'Reabierto'].includes(props.ticket.estado);
});

const puedePausar = computed(
  () => props.ticket?.estado === 'En Progreso' && esTecnicoAsignado.value,
);

const puedeResolver = computed(
  () => props.ticket?.estado === 'En Progreso' && esTecnicoAsignado.value,
);

const puedeCerrar = computed(
  () => props.ticket?.estado === 'Resuelto - Por Verificar' && rol.value === 'MESA_TECNICA',
);

const puedeReabrir = computed(
  () =>
    props.ticket?.estado === 'Resuelto - Por Verificar' &&
    (rol.value === 'MESA_TECNICA' || rol.value === 'ADMINISTRADOR'),
);

const tieneAccionesDisponibles = computed(
  () =>
    puedeAsignar.value ||
    puedeIniciar.value ||
    puedePausar.value ||
    puedeResolver.value ||
    puedeCerrar.value ||
    puedeReabrir.value,
);

function resetearFormulario(): void {
  tabActiva.value = 'resumen';
  accionActiva.value = null;
  errorAccion.value = null;
  form.id_tecnico = null;
  form.motivo_pausa = '';
  form.causa_raiz = '';
  form.solucion_aplicada = '';
  form.comentario = '';
  form.conformidad_usuario = true;
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

async function seleccionarAccion(estado: EstadoTicket): Promise<void> {
  accionActiva.value = estado;
  errorAccion.value = null;

  if (estado === 'Asignado' && props.ticket) {
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
  }
}

async function ejecutarTransicion(): Promise<void> {
  if (!props.ticket || !accionActiva.value) return;
  errorAccion.value = null;

  const payload: PatchTicketEstadoPayload = {
    estado_nuevo: accionActiva.value,
  };

  if (accionActiva.value === 'Asignado') {
    if (!form.id_tecnico) {
      errorAccion.value = 'Debes seleccionar un técnico especialista.';
      return;
    }
    payload.id_tecnico = form.id_tecnico;
  }

  if (accionActiva.value === 'En Espera') {
    if (!form.motivo_pausa.trim()) {
      errorAccion.value = 'Debes indicar el motivo de la pausa.';
      return;
    }
    payload.motivo_pausa = form.motivo_pausa.trim();
  }

  if (accionActiva.value === 'Resuelto - Por Verificar') {
    if (!form.solucion_aplicada.trim()) {
      errorAccion.value = 'Debes documentar la solución aplicada.';
      return;
    }
    payload.solucion_aplicada = form.solucion_aplicada.trim();
    if (form.causa_raiz.trim()) {
      payload.causa_raiz = form.causa_raiz.trim();
    }
  }

  if (accionActiva.value === 'Cerrado') {
    payload.conformidad_usuario = form.conformidad_usuario;
  }

  if (accionActiva.value === 'Reabierto' && !form.comentario.trim()) {
    errorAccion.value = 'Debes indicar el motivo de reapertura.';
    return;
  }

  if (form.comentario.trim()) {
    payload.comentario = form.comentario.trim();
  }

  try {
    const res = await ticketStore.cambiarEstadoTicket(props.ticket.id, payload);
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
  return new Date(fecha).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<style scoped lang="scss">
.detalle-dialog-card {
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.detalle-body {
  overflow-y: auto;
}

.tabs-barra {
  border-bottom: 1px solid var(--border);
}

.info-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.acciones-panel {
  background: var(--primary-soft);
  border: 1px solid rgba(15, 118, 110, 0.25);
  border-radius: 8px;
}

.whitespace-preline {
  white-space: pre-line;
}
</style>
