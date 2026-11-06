<template>
  <q-dialog
    :model-value="abierto"
    persistent
    @update:model-value="(val) => emit('update:abierto', val)"
  >
    <q-card flat bordered class="dialog-card">
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">
            {{ departamentoEditar ? 'Editar Departamento' : 'Nuevo Departamento' }}
          </div>
          <div class="text-caption muted">
            Datos del departamento solicitante y extensión para verificación telefónica.
          </div>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-7"
          :disable="guardando"
          @click="emit('update:abierto', false)"
        />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-banner v-if="error" dense rounded class="form-error q-mb-md" role="alert">
          <template #avatar>
            <q-icon name="error_outline" color="negative" size="20px" />
          </template>
          {{ error }}
        </q-banner>

        <q-form class="q-gutter-y-md" @submit.prevent="alGuardar">
          <div class="row q-col-gutter-sm">
            <div class="col-4">
              <q-input
                v-model="codigo"
                label="Código"
                outlined
                dense
                maxlength="10"
                lazy-rules
                :rules="[(v: string) => !!v?.trim() || 'Requerido']"
              />
            </div>
            <div class="col-8">
              <q-input
                v-model="extensionTelefonica"
                label="Extensión telefónica"
                outlined
                dense
                maxlength="15"
                lazy-rules
                :rules="[(v: string) => !!v?.trim() || 'Ingresa la extensión']"
              />
            </div>
          </div>

          <q-input
            v-model="nombre"
            label="Nombre del departamento o gerencia"
            outlined
            dense
            maxlength="80"
            lazy-rules
            :rules="[(v: string) => !!v?.trim() || 'Ingresa el nombre del departamento']"
          />

          <q-input
            v-model="responsable"
            label="Jefe o responsable del área"
            outlined
            dense
            maxlength="80"
            lazy-rules
            :rules="[(v: string) => !!v?.trim() || 'Ingresa el responsable']"
          />

          <q-input
            v-model="ubicacion"
            label="Ubicación física / Piso"
            outlined
            dense
            maxlength="100"
            lazy-rules
            :rules="[(v: string) => !!v?.trim() || 'Ingresa la ubicación']"
          />

          <div class="row items-center justify-between estado-row q-px-sm q-py-xs">
            <span class="text-body2 text-weight-medium text-dark">Estado del departamento</span>
            <q-toggle v-model="activo" color="primary" :label="activo ? 'Activo' : 'Inactivo'" />
          </div>

          <div class="row justify-end q-gutter-x-sm q-pt-sm">
            <q-btn
              flat
              no-caps
              color="secondary"
              label="Cancelar"
              :disable="guardando"
              @click="emit('update:abierto', false)"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              :label="departamentoEditar ? 'Guardar cambios' : 'Crear departamento'"
              :loading="guardando"
              :disable="guardando"
            >
              <template #loading>
                <q-spinner-oval size="18px" class="q-mr-sm" />
                <span>Guardando...</span>
              </template>
            </q-btn>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { DepartamentoMaestro, PayloadDepartamentoMaestro } from '@/models/catalogos';

const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  departamentoEditar: DepartamentoMaestro | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: PayloadDepartamentoMaestro];
}>();

const codigo = ref('');
const nombre = ref('');
const responsable = ref('');
const ubicacion = ref('');
const extensionTelefonica = ref('');
const activo = ref(true);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    codigo.value = props.departamentoEditar?.codigo ?? '';
    nombre.value = props.departamentoEditar?.nombre ?? '';
    responsable.value = props.departamentoEditar?.responsable ?? '';
    ubicacion.value = props.departamentoEditar?.ubicacion ?? '';
    extensionTelefonica.value = props.departamentoEditar?.extensionTelefonica ?? '';
    activo.value = props.departamentoEditar?.activo ?? true;
  },
);

function limpiarTexto(valor: string): string {
  return valor.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  emit('guardar', {
    codigo: limpiarTexto(codigo.value).toUpperCase(),
    nombre: limpiarTexto(nombre.value),
    responsable: limpiarTexto(responsable.value),
    ubicacion: limpiarTexto(ubicacion.value),
    extensionTelefonica: limpiarTexto(extensionTelefonica.value),
    activo: activo.value,
  });
}
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100%; max-width: 460px; border-radius: var(--radius);
  border: 1px solid var(--border); box-shadow: var(--shadow);
}
.dialog-header { border-bottom: 1px solid var(--border); }
.muted { color: var(--muted); }
.estado-row { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; }
.form-error {
  background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.25);
  color: var(--danger); font-size: 0.84rem;
}
</style>

