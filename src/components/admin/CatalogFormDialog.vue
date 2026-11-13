<template>
  <q-dialog
    :model-value="abierto"
    persistent
    :maximized="$q.screen.lt.sm"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="(val) => emit('update:abierto', val)"
  >
    <q-card flat bordered class="dialog-card" :class="{ 'no-border-radius full-height': $q.screen.lt.sm }">
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">
            {{ servicioEditar ? 'Editar Servicio / Incidencia' : 'Nuevo Servicio / Incidencia' }}
          </div>
          <div class="text-caption muted">
            {{
              servicioEditar
                ? 'Actualiza los parámetros del catálogo.'
                : 'Registra una nueva incidencia o servicio para la Mesa Técnica.'
            }}
          </div>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="guardando" @click="emit('update:abierto', false)" />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-banner v-if="error" dense rounded class="form-error q-mb-md" role="alert">
          <template #avatar><q-icon name="error_outline" color="negative" size="20px" /></template>
          {{ error }}
        </q-banner>

        <q-form @submit.prevent="alGuardar">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="nombre"
                label="Nombre del Servicio / Incidencia"
                placeholder="Ej. Falla de Impresora o Periférico"
                outlined
                dense
                maxlength="150"
                lazy-rules
                :rules="[
                  (v: string) => !!v?.trim() || 'Ingresa el nombre del servicio',
                  (v: string) => (v?.trim().length ?? 0) <= 150 || 'Máximo 150 caracteres',
                ]"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="idDepartamento"
                :options="opcionesDepartamento"
                option-value="id"
                :option-label="(d: Department) => `${d.codigo} — ${d.nombre}`"
                emit-value
                map-options
                label="Departamento Destino"
                outlined
                dense
                options-dense
                lazy-rules
                :rules="[(v: number | null) => (typeof v === 'number' && v > 0) || 'Selecciona un departamento']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="idPrioridad"
                :options="opcionesPrioridad"
                option-value="id"
                option-label="nombre"
                emit-value
                map-options
                label="Prioridad Sugerida"
                outlined
                dense
                options-dense
                lazy-rules
                :rules="[(v: number | null) => (typeof v === 'number' && v > 0) || 'Selecciona una prioridad']"
              />
            </div>

            <div v-if="servicioEditar" class="col-12">
              <div class="row items-center justify-between toggle-row q-px-md q-py-xs full-height">
                <div>
                  <div class="text-body2 text-weight-medium text-dark">Estado del servicio</div>
                  <div class="text-caption muted">{{ activoToggle ? 'Activo' : 'Inactivo' }}</div>
                </div>
                <q-toggle v-model="activoToggle" color="primary" />
              </div>
            </div>

            <div class="col-12 row justify-end q-gutter-x-sm q-pt-sm">
              <q-btn flat no-caps color="secondary" label="Cancelar" :disable="guardando" @click="emit('update:abierto', false)" />
              <q-btn type="submit" unelevated no-caps color="primary" :label="servicioEditar ? 'Guardar cambios' : 'Registrar servicio'" :loading="guardando" :disable="guardando">
                <template #loading><q-spinner-oval size="18px" class="q-mr-sm" /><span>Guardando...</span></template>
              </q-btn>
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { ServiceCatalog, ServiceCatalogPayload } from '@/stores/useCatalogStore';
import type { Department } from '@/stores/useDepartmentsStore';
import type { PrioridadItem } from '@/stores/usePrioridadesStore';

const $q = useQuasar();
const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  servicioEditar: ServiceCatalog | null;
  departamentos: Department[];
  prioridades: PrioridadItem[];
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: ServiceCatalogPayload];
}>();

const nombre = ref('');
const idDepartamento = ref<number | null>(null);
const idPrioridad = ref<number | null>(null);
const activoToggle = ref(true);

const opcionesDepartamento = computed(() =>
  props.departamentos.filter(
    (d) => d.is_activo || d.id === props.servicioEditar?.id_departamento,
  ),
);

const opcionesPrioridad = computed(() =>
  props.prioridades.filter((p) => p.is_activo || p.id === props.servicioEditar?.id_prioridad),
);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    if (props.servicioEditar) {
      nombre.value = props.servicioEditar.nombre;
      idDepartamento.value = props.servicioEditar.id_departamento;
      idPrioridad.value = props.servicioEditar.id_prioridad;
      activoToggle.value = props.servicioEditar.is_activo;
    } else {
      nombre.value = '';
      idDepartamento.value = opcionesDepartamento.value[0]?.id ?? null;
      idPrioridad.value = opcionesPrioridad.value[0]?.id ?? null;
      activoToggle.value = true;
    }
  },
);

function limpiar(v: string): string {
  return v.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  if (!idDepartamento.value || !idPrioridad.value) return;

  const payload: ServiceCatalogPayload = {
    nombre: limpiar(nombre.value),
    id_departamento: idDepartamento.value,
    id_prioridad: idPrioridad.value,
  };

  if (props.servicioEditar) {
    payload.is_activo = activoToggle.value;
  }

  emit('guardar', payload);
}
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100vw;
  max-width: 720px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.dialog-header { border-bottom: 1px solid var(--border); }
.muted { color: var(--muted); }
.toggle-row { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; }
.form-error {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: var(--danger);
  font-size: 0.84rem;
}
</style>
