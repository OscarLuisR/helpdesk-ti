<!-- 🛡️ [FASE 2.3 - TICKETS] Formulario de creación de tickets con auto-cálculo dinámico de prioridad y área TI -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg">
    <div class="row items-center justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <h1 class="page-title">Registrar Nuevo Ticket</h1>
        <p class="page-subtitle">
          Selecciona al usuario solicitante y la incidencia del catálogo para calcular automáticamente su prioridad SLA y área responsable.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          outline
          no-caps
          color="secondary"
          icon="inbox"
          label="Ir a Recepción"
          to="/tickets/recepcion"
        />
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Formulario principal -->
      <div class="col-12 col-lg-8">
        <q-card flat bordered class="card">
          <h2 class="card-title">Datos de la Incidencia</h2>

          <div v-if="errorFormulario" class="form-error q-pa-sm rounded-borders q-mb-md">
            {{ errorFormulario }}
          </div>

          <q-form class="q-gutter-y-md" @submit.prevent="enviarFormulario">
            <div>
              <label class="field-label">Usuario Solicitante *</label>
              <q-select
                v-model="form.id_usuario_solicitante"
                :options="opcionesUsuariosFiltradas"
                option-value="id"
                :option-label="(u) => `${u.nombre_completo} (${u.nick}) — ${u.departamento}`"
                emit-value
                map-options
                use-input
                input-debounce="150"
                outlined
                dense
                clearable
                :loading="usersStore.cargando"
                placeholder="Buscar por nombre, nick o departamento..."
                :rules="[(v) => (v !== null && v > 0) || 'Selecciona el usuario solicitante.']"
                @filter="filtrarUsuarios"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No se encontraron usuarios activos
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div>
              <label class="field-label">Incidencia del Catálogo *</label>
              <q-select
                v-model="form.id_catalogo"
                :options="opcionesCatalogoFiltradas"
                option-value="id"
                :option-label="(c) => `${c.nombre} (${c.departamento} · ${c.prioridad})`"
                emit-value
                map-options
                use-input
                input-debounce="150"
                outlined
                dense
                clearable
                :loading="catalogStore.cargando"
                placeholder="Buscar falla o requerimiento en el catálogo..."
                :rules="[(v) => (v !== null && v > 0) || 'Selecciona una incidencia del catálogo.']"
                @filter="filtrarCatalogo"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No se encontraron incidencias activas
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div>
              <label class="field-label">Descripción Detallada de la Incidencia *</label>
              <q-input
                v-model="form.descripcion_incidencia"
                outlined
                type="textarea"
                rows="5"
                maxlength="2000"
                counter
                placeholder="Describe el síntoma reportado, equipo/ubicación y mensajes de error observados..."
                :rules="[
                  (v) => (v && v.trim().length >= 10) || 'Ingresa al menos 10 caracteres.',
                  (v) => (v && v.trim().length <= 2000) || 'Máximo 2000 caracteres.',
                ]"
              />
            </div>

            <div class="row justify-end q-gutter-sm q-pt-sm">
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Limpiar"
                :disable="ticketStore.guardando"
                @click="limpiarFormulario"
              />
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                icon="confirmation_number"
                label="Registrar Ticket"
                :loading="ticketStore.guardando"
              />
            </div>
          </q-form>
        </q-card>
      </div>

      <!-- Tarjeta lateral de cálculo automático SLA y Área TI -->
      <div class="col-12 col-lg-4">
        <q-card flat bordered class="card sla-card">
          <h2 class="card-title">Clasificación Automática (SLA)</h2>

          <div v-if="!incidenciaSeleccionada" class="text-body2 muted">
            Al elegir una incidencia del catálogo, el sistema calculará automáticamente su
            <strong>prioridad SLA</strong>, tiempos meta y <strong>área TI responsable</strong>.
          </div>

          <div v-else class="q-gutter-y-md">
            <div class="sla-row q-pa-sm">
              <div class="text-caption muted text-uppercase">Área TI Destino</div>
              <div class="row items-center q-gutter-x-xs q-mt-xs">
                <span v-if="incidenciaSeleccionada.codigo_departamento" class="chip brand">
                  {{ incidenciaSeleccionada.codigo_departamento }}
                </span>
                <span class="text-weight-bold text-dark">
                  {{ incidenciaSeleccionada.departamento }}
                </span>
              </div>
            </div>

            <div class="sla-row q-pa-sm">
              <div class="text-caption muted text-uppercase">Prioridad Calculada</div>
              <div class="q-mt-xs">
                <span class="chip" :class="claseChipPrioridad(incidenciaSeleccionada.prioridad)">
                  <span class="chip__dot" />
                  {{ incidenciaSeleccionada.prioridad }}
                </span>
              </div>
            </div>

            <div v-if="prioridadCalculada" class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="sla-row q-pa-sm">
                  <div class="text-caption muted">Máx. Asignación</div>
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ prioridadCalculada.tiempo_max_asignacion_minutos }} min
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="sla-row q-pa-sm">
                  <div class="text-caption muted">Meta Resolución</div>
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ prioridadCalculada.tiempo_meta_resolucion_horas }} h
                  </div>
                </div>
              </div>
            </div>

            <div v-if="prioridadCalculada?.descripcion_criterio" class="text-caption muted">
              <strong>Criterio:</strong> {{ prioridadCalculada.descripcion_criterio }}
            </div>
          </div>

          <q-separator v-if="ultimoFolioCreado" class="q-my-md" />

          <div v-if="ultimoFolioCreado" class="folio-creado q-pa-sm">
            <div class="text-caption text-positive text-weight-bold text-uppercase">
              Último Ticket Generado
            </div>
            <div class="text-h6 text-weight-bold text-dark q-mt-xs">
              {{ ultimoFolioCreado }}
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { claseChipPrioridad } from '@/composables/useTickets';
import { useCatalogStore, type ServiceCatalog } from '@/stores/useCatalogStore';
import { usePrioridadesStore } from '@/stores/usePrioridadesStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useUsersStore, type User } from '@/stores/useUsersStore';

const $q = useQuasar();
const usersStore = useUsersStore();
const catalogStore = useCatalogStore();
const prioridadesStore = usePrioridadesStore();
const ticketStore = useTicketStore();

const form = reactive({
  id_usuario_solicitante: null as number | null,
  id_catalogo: null as number | null,
  descripcion_incidencia: '',
});

const errorFormulario = ref<string | null>(null);
const ultimoFolioCreado = ref<string | null>(null);
const filtroUsuarioTexto = ref('');
const filtroCatalogoTexto = ref('');

const usuariosActivos = computed(() => usersStore.users.filter((u) => u.is_activo));
const catalogoActivo = computed(() => catalogStore.serviciosActivos);

const opcionesUsuariosFiltradas = computed<User[]>(() => {
  const q = filtroUsuarioTexto.value.trim().toLowerCase();
  if (!q) return usuariosActivos.value;
  return usuariosActivos.value.filter((u) =>
    [u.nombre_completo, u.nick, u.departamento].some((v) => v.toLowerCase().includes(q)),
  );
});

const opcionesCatalogoFiltradas = computed<ServiceCatalog[]>(() => {
  const q = filtroCatalogoTexto.value.trim().toLowerCase();
  if (!q) return catalogoActivo.value;
  return catalogoActivo.value.filter((c) =>
    [c.nombre, c.departamento, c.prioridad].some((v) => v.toLowerCase().includes(q)),
  );
});

const incidenciaSeleccionada = computed<ServiceCatalog | null>(() => {
  if (!form.id_catalogo) return null;
  return catalogoActivo.value.find((c) => c.id === form.id_catalogo) ?? null;
});

const prioridadCalculada = computed(() => {
  if (!incidenciaSeleccionada.value) return null;
  return (
    prioridadesStore.prioridades.find(
      (p) => p.id === incidenciaSeleccionada.value?.id_prioridad,
    ) ?? null
  );
});

function filtrarUsuarios(val: string, update: (fn: () => void) => void): void {
  update(() => {
    filtroUsuarioTexto.value = val;
  });
}

function filtrarCatalogo(val: string, update: (fn: () => void) => void): void {
  update(() => {
    filtroCatalogoTexto.value = val;
  });
}

function limpiarFormulario(): void {
  form.id_usuario_solicitante = null;
  form.id_catalogo = null;
  form.descripcion_incidencia = '';
  errorFormulario.value = null;
}

async function enviarFormulario(): Promise<void> {
  errorFormulario.value = null;
  if (!form.id_usuario_solicitante || !form.id_catalogo) {
    errorFormulario.value = 'Debes seleccionar el usuario solicitante y la incidencia del catálogo.';
    return;
  }

  try {
    const creado = await ticketStore.crearTicket({
      id_usuario_solicitante: form.id_usuario_solicitante,
      id_catalogo: form.id_catalogo,
      descripcion_incidencia: form.descripcion_incidencia.trim(),
    });

    ultimoFolioCreado.value = creado.folio;
    $q.notify({
      type: 'positive',
      message: `Ticket ${creado.folio} registrado correctamente.`,
      position: 'top-right',
      timeout: 3500,
    });
    limpiarFormulario();
  } catch (err: unknown) {
    errorFormulario.value =
      err instanceof Error ? err.message : 'No fue posible registrar el ticket.';
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      usersStore.cargarUsuarios(),
      catalogStore.cargarCatalogo(),
      prioridadesStore.cargarPrioridades(),
    ]);
  } catch (err: unknown) {
    errorFormulario.value =
      err instanceof Error
        ? err.message
        : 'No fue posible cargar los catálogos iniciales para el formulario.';
  }
});
</script>

<style scoped lang="scss">
.field-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.sla-row {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.folio-creado {
  background: rgba(22, 163, 74, 0.08);
  border: 1px solid rgba(22, 163, 74, 0.25);
  border-radius: 8px;
}
</style>
