<template>
  <q-dialog
    :model-value="abierto"
    persistent
    :maximized="$q.screen.lt.sm"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="(val) => emit('update:abierto', val)"
  >
    <q-card
      flat
      bordered
      class="dialog-card"
      :class="{ 'no-border-radius full-height': $q.screen.lt.sm }"
    >
      <q-card-section class="row items-center justify-between q-pb-sm dialog-header">
        <div>
          <div class="text-subtitle1 text-weight-bold text-dark">
            {{ rolEditar ? 'Editar Rol' : 'Nuevo Rol' }}
          </div>
          <div class="text-caption muted">
            {{
              rolEditar
                ? 'Actualiza el código, nombre descriptivo o estado del rol del sistema.'
                : 'Registra un nuevo perfil de acceso en el catálogo de roles.'
            }}
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

        <q-form @submit.prevent="alGuardar">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5">
              <q-input
                v-model="codigo"
                label="Código"
                placeholder="Ej. MESA_TECNICA"
                outlined
                dense
                maxlength="25"
                :disable="guardando"
                lazy-rules
                :rules="[validarCodigo]"
              />
            </div>

            <div class="col-12 col-md-7">
              <q-input
                v-model="nombre"
                label="Nombre del rol"
                placeholder="Ej. Mesa Técnica"
                outlined
                dense
                maxlength="25"
                :disable="guardando"
                lazy-rules
                :rules="[validarNombre]"
              />
            </div>

            <div v-if="rolEditar" class="col-12">
              <div class="row items-center justify-between toggle-row q-px-md q-py-xs">
                <div>
                  <div class="text-body2 text-weight-medium text-dark">Estado del rol</div>
                  <div class="text-caption muted">
                    {{ activoToggle ? 'Activo (disponible para asignar)' : 'Inactivo' }}
                  </div>
                </div>
                <q-toggle v-model="activoToggle" color="primary" :disable="guardando" />
              </div>
            </div>

            <div class="col-12 row justify-end q-gutter-x-sm q-pt-sm">
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
                :label="rolEditar ? 'Guardar cambios' : 'Crear rol'"
                :loading="guardando"
                :disable="guardando"
              >
                <template #loading>
                  <q-spinner-oval size="18px" class="q-mr-sm" />
                  <span>Guardando...</span>
                </template>
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
import type { RolFormPayload, RolItem } from '@/stores/useRolesStore';

const $q = useQuasar();

const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  rolEditar: RolItem | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: RolFormPayload];
}>();

const codigo = ref('');
const nombre = ref('');
const activoToggle = ref(true);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    if (props.rolEditar) {
      codigo.value = props.rolEditar.codigo;
      nombre.value = props.rolEditar.nombre;
      activoToggle.value = props.rolEditar.is_activo;
    } else {
      codigo.value = '';
      nombre.value = '';
      activoToggle.value = true;
    }
  },
);

function limpiarTexto(valor: string): string {
  return valor.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function validarCodigo(valor: string): true | string {
  const limpio = limpiarTexto(valor ?? '');
  if (!limpio) return 'Ingresa el código del rol';
  if (limpio.length > 25) return 'Máximo 25 caracteres';
  return true;
}

function validarNombre(valor: string): true | string {
  const limpio = limpiarTexto(valor ?? '');
  if (!limpio) return 'Ingresa el nombre del rol';
  if (limpio.length > 25) return 'Máximo 25 caracteres';
  return true;
}

function alGuardar(): void {
  const payload: RolFormPayload = {
    codigo: limpiarTexto(codigo.value).toUpperCase(),
    nombre: limpiarTexto(nombre.value),
  };

  if (props.rolEditar) {
    payload.is_activo = activoToggle.value;
  }

  emit('guardar', payload);
}
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100vw;
  max-width: 560px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.dialog-header {
  border-bottom: 1px solid var(--border);
}
.muted {
  color: var(--muted);
}
.toggle-row {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.form-error {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: var(--danger);
  font-size: 0.84rem;
}
</style>
