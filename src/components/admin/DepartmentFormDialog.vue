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
            {{ departamentoEditar ? 'Editar Departamento' : 'Nuevo Departamento' }}
          </div>
          <div class="text-caption muted">
            {{ departamentoEditar ? 'Actualiza los datos del área solicitante.' : 'Registra un departamento corporativo o área de TI.' }}
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
            <div class="col-12 col-md-4">
              <q-input v-model="codigo" label="Código" placeholder="Ej. TI-SOP" outlined dense maxlength="10" lazy-rules :rules="[(v: string) => !!v?.trim() || 'Ingresa el código']" />
            </div>
            <div class="col-12 col-md-8">
              <q-input v-model="nombre" label="Nombre del departamento" placeholder="Ej. Soporte Técnico" outlined dense maxlength="80" lazy-rules :rules="[(v: string) => !!v?.trim() || 'Ingresa el nombre']" />
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="responsable" label="Responsable" placeholder="Ej. Patricia Vega" outlined dense maxlength="80" lazy-rules :rules="[(v: string) => !!v?.trim() || 'Ingresa el responsable']" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="telefono" label="Teléfono del Responsable" placeholder="0414-3021144" outlined dense maxlength="15" lazy-rules :rules="[(v: string) => !!v?.trim() || 'Teléfono requerido']" />
            </div>

            <div class="col-12">
              <q-input v-model="ubicacion" label="Ubicación física / Sede (Opcional)" placeholder="Ej. Piso 3" outlined dense maxlength="100" />
            </div>

            <div class="col-12 col-md-6">
              <div class="row items-center justify-between toggle-row q-px-md q-py-xs full-height">
                <div>
                  <div class="text-body2 text-weight-medium text-dark">Sub-Gerencia de TI</div>
                  <div class="text-caption muted">Diferencia de áreas usuarias</div>
                </div>
                <q-toggle v-model="esSubgerenciaTI" color="primary" />
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="row items-center justify-between toggle-row q-px-md q-py-xs full-height">
                <div>
                  <div class="text-body2 text-weight-medium text-dark">Estado</div>
                  <div class="text-caption muted">{{ activoToggle ? 'Activo' : 'Inactivo' }}</div>
                </div>
                <q-toggle v-model="activoToggle" color="primary" />
              </div>
            </div>

            <div class="col-12 row justify-end q-gutter-x-sm q-pt-sm">
              <q-btn flat no-caps color="secondary" label="Cancelar" :disable="guardando" @click="emit('update:abierto', false)" />
              <q-btn type="submit" unelevated no-caps color="primary" :label="departamentoEditar ? 'Guardar cambios' : 'Crear departamento'" :loading="guardando" :disable="guardando">
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
import type { Department, DepartmentFormPayload } from '@/stores/useDepartmentsStore';

const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  departamentoEditar: Department | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: DepartmentFormPayload];
}>();

const codigo = ref('');
const nombre = ref('');
const responsable = ref('');
const telefono = ref('');
const ubicacion = ref('');
const esSubgerenciaTI = ref(false);
const activoToggle = ref(true);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    if (props.departamentoEditar) {
      codigo.value = props.departamentoEditar.codigo;
      nombre.value = props.departamentoEditar.nombre;
      responsable.value = props.departamentoEditar.responsable;
      telefono.value = props.departamentoEditar.telefono;
      ubicacion.value = props.departamentoEditar.ubicacion ?? '';
      esSubgerenciaTI.value = props.departamentoEditar.esSubgerenciaTI;
      activoToggle.value = props.departamentoEditar.estado === 'Activo';
    } else {
      codigo.value = '';
      nombre.value = '';
      responsable.value = '';
      telefono.value = '';
      ubicacion.value = '';
      esSubgerenciaTI.value = false;
      activoToggle.value = true;
    }
  },
);

function limpiar(v: string): string {
  return v.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  emit('guardar', {
    codigo: limpiar(codigo.value).toUpperCase(),
    nombre: limpiar(nombre.value),
    responsable: limpiar(responsable.value),
    telefono: limpiar(telefono.value),
    ubicacion: limpiar(ubicacion.value),
    esSubgerenciaTI: esSubgerenciaTI.value,
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
