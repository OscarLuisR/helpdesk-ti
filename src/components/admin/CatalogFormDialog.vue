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
            {{ servicioEditar ? 'Editar Servicio / Caso' : 'Nuevo Servicio / Caso' }}
          </div>
          <div class="text-caption muted">
            {{ servicioEditar ? 'Actualiza los parámetros del servicio.' : 'Registra un nuevo tipo de servicio para la Mesa Técnica.' }}
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
                label="Nombre del Servicio / Falla"
                placeholder="Ej. Falla de Impresora o Periférico"
                outlined
                dense
                maxlength="100"
                lazy-rules
                :rules="[(v: string) => !!v?.trim() || 'Ingresa el nombre del servicio']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="naturaleza"
                :options="OPCIONES_NATURALEZA"
                label="Naturaleza del Trabajo"
                outlined
                dense
                options-dense
                lazy-rules
                :rules="[(v: string) => !!v || 'Selecciona una naturaleza']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="subgerenciaDestino"
                :options="OPCIONES_SUBGERENCIA"
                label="Sub-Gerencia Destino"
                outlined
                dense
                options-dense
                lazy-rules
                :rules="[(v: string) => !!v || 'Selecciona sub-gerencia']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="prioridadSugerida"
                :options="OPCIONES_PRIORIDAD"
                label="Prioridad Sugerida"
                outlined
                dense
                options-dense
                lazy-rules
                :rules="[(v: string) => !!v || 'Selecciona la prioridad']"
              />
            </div>

            <div class="col-12 col-md-6">
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
import { ref, watch } from 'vue';
import {
  OPCIONES_NATURALEZA,
  OPCIONES_PRIORIDAD,
  OPCIONES_SUBGERENCIA,
  type NaturalezaTrabajo,
  type PrioridadSugerida,
  type ServiceCatalog,
  type ServiceCatalogPayload,
  type SubgerenciaDestino,
} from '@/stores/useCatalogStore';

const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  servicioEditar: ServiceCatalog | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: ServiceCatalogPayload];
}>();

const nombre = ref('');
const naturaleza = ref<NaturalezaTrabajo>('Incidencia');
const subgerenciaDestino = ref<SubgerenciaDestino>('Soporte Técnico');
const prioridadSugerida = ref<PrioridadSugerida>('Media');
const activoToggle = ref(true);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    if (props.servicioEditar) {
      nombre.value = props.servicioEditar.nombre;
      naturaleza.value = props.servicioEditar.naturaleza;
      subgerenciaDestino.value = props.servicioEditar.subgerenciaDestino;
      prioridadSugerida.value = props.servicioEditar.prioridadSugerida;
      activoToggle.value = props.servicioEditar.estado === 'Activo';
    } else {
      nombre.value = '';
      naturaleza.value = 'Incidencia';
      subgerenciaDestino.value = 'Soporte Técnico';
      prioridadSugerida.value = 'Media';
      activoToggle.value = true;
    }
  },
);

function limpiar(v: string): string {
  return v.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  emit('guardar', {
    nombre: limpiar(nombre.value),
    naturaleza: naturaleza.value,
    subgerenciaDestino: subgerenciaDestino.value,
    prioridadSugerida: prioridadSugerida.value,
    estado: activoToggle.value ? 'Activo' : 'Inactivo',
  });
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
