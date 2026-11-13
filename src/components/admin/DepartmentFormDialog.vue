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
            {{ departamentoEditar ? 'Actualiza los datos del departamento.' : 'Registra un departamento corporativo o área de TI.' }}
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
              <q-input
                v-model="codigo"
                label="Código"
                placeholder="Ej. TI-SOP"
                outlined
                dense
                maxlength="25"
                lazy-rules
                :rules="[
                  (v: string) => !!v?.trim() || 'Ingresa el código',
                  (v: string) => (v?.trim().length ?? 0) <= 25 || 'Máximo 25 caracteres',
                ]"
              />
            </div>
            <div class="col-12 col-md-8">
              <q-input
                v-model="nombre"
                label="Nombre del departamento"
                placeholder="Ej. Soporte Técnico"
                outlined
                dense
                maxlength="50"
                lazy-rules
                :rules="[
                  (v: string) => !!v?.trim() || 'Ingresa el nombre',
                  (v: string) => (v?.trim().length ?? 0) <= 50 || 'Máximo 50 caracteres',
                ]"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="idTipoDepartamento"
                :options="tiposDepartamento"
                option-value="id"
                option-label="nombre"
                emit-value
                map-options
                label="Tipo de departamento"
                outlined
                dense
                options-dense
                lazy-rules
                :rules="[(v: number | null) => (typeof v === 'number' && v > 0) || 'Selecciona el tipo de departamento']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="telefono"
                label="Teléfono"
                placeholder="0412-1234567"
                mask="####-#######"
                outlined
                dense
                lazy-rules
                :rules="[validarTelefono]"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="responsable"
                label="Responsable (Opcional)"
                placeholder="Ej. Patricia Vega"
                outlined
                dense
                maxlength="100"
              />
            </div>

            <div class="col-12" :class="departamentoEditar ? 'col-md-6' : 'col-md-6'">
              <q-input
                v-model="ubicacion"
                label="Ubicación física / Sede"
                placeholder="Ej. Edificio Principal - Piso 3"
                outlined
                dense
                maxlength="100"
                lazy-rules
                :rules="[
                  (v: string) => !!v?.trim() || 'Ingresa la ubicación',
                  (v: string) => (v?.trim().length ?? 0) <= 100 || 'Máximo 100 caracteres',
                ]"
              />
            </div>

            <div v-if="departamentoEditar" class="col-12">
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
import { useQuasar } from 'quasar';
import type { Department, DepartmentFormPayload } from '@/stores/useDepartmentsStore';
import type { TipoDepartamentoItem } from '@/stores/useTipoDepartamentosStore';

const PATRON_TELEFONO = /^\d{4}-\d{7}$/;

const $q = useQuasar();
const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  departamentoEditar: Department | null;
  tiposDepartamento: TipoDepartamentoItem[];
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
const idTipoDepartamento = ref<number | null>(null);
const activoToggle = ref(true);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    if (props.departamentoEditar) {
      codigo.value = props.departamentoEditar.codigo;
      nombre.value = props.departamentoEditar.nombre;
      responsable.value = props.departamentoEditar.responsable ?? '';
      telefono.value = props.departamentoEditar.telefono;
      ubicacion.value = props.departamentoEditar.ubicacion ?? '';
      idTipoDepartamento.value = props.departamentoEditar.id_tipo_departamento;
      activoToggle.value = props.departamentoEditar.is_activo;
    } else {
      codigo.value = '';
      nombre.value = '';
      responsable.value = '';
      telefono.value = '';
      ubicacion.value = '';
      idTipoDepartamento.value = props.tiposDepartamento[0]?.id ?? null;
      activoToggle.value = true;
    }
  },
);

function limpiar(v: string): string {
  return v.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function validarTelefono(v: string): true | string {
  const limpio = (v ?? '').trim();
  if (!limpio) return 'Teléfono requerido';
  if (!PATRON_TELEFONO.test(limpio)) {
    return 'Formato requerido: XXXX-XXXXXXX (ej. 0412-1234567)';
  }
  return true;
}

function alGuardar(): void {
  if (!idTipoDepartamento.value) return;

  const responsableLimpio = limpiar(responsable.value);
  const payload: DepartmentFormPayload = {
    codigo: limpiar(codigo.value).toUpperCase(),
    nombre: limpiar(nombre.value),
    responsable: responsableLimpio.length > 0 ? responsableLimpio : null,
    telefono: limpiar(telefono.value),
    ubicacion: limpiar(ubicacion.value),
    id_tipo_departamento: idTipoDepartamento.value,
  };

  if (props.departamentoEditar) {
    payload.estado = activoToggle.value ? 'Activo' : 'Inactivo';
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
