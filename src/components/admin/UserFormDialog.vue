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
            {{ usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario' }}
          </div>
          <div class="text-caption muted">
            {{ usuarioEditar ? 'Actualiza los datos o perfil del usuario.' : 'Registra una nueva cuenta de acceso corporativo.' }}
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
            <div class="col-12 col-md-6">
              <q-input v-model="nombre" label="Nombre completo" placeholder="Ej. María González" outlined dense maxlength="80" lazy-rules :rules="[(v: string) => !!v?.trim() || 'Ingresa el nombre completo']" />
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="username" label="Nombre de usuario (Login)" placeholder="Ej. maria.gonzalez" outlined dense maxlength="50" lazy-rules :rules="[validarUsernameLogin]" />
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="telefono" label="Teléfono" placeholder="0412-2964550" mask="####-#######" outlined dense lazy-rules :rules="[validarTelefonoUsuario]" />
            </div>

            <div class="col-12 col-md-6">
              <q-select v-model="departamento" :options="DEPARTAMENTOS_SISTEMA" label="Departamento" outlined dense options-dense lazy-rules :rules="[(v: string) => !!v || 'Selecciona un departamento']" />
            </div>

            <div class="col-12 col-md-6">
              <q-select v-model="rol" :options="OPCIONES_ROL_SIMULADOR" option-value="valor" option-label="etiqueta" emit-value map-options label="Rol en el sistema" outlined dense options-dense />
            </div>

            <div class="col-12 col-md-6">
              <div class="row items-center justify-between estado-row q-px-sm q-py-xs full-height">
                <span class="text-body2 text-weight-medium text-dark">Estado de la cuenta</span>
                <q-toggle v-model="activoToggle" color="primary" :label="activoToggle ? 'Activo' : 'Inactivo'" />
              </div>
            </div>

            <div class="col-12 row justify-end q-gutter-x-sm q-pt-sm">
              <q-btn flat no-caps color="secondary" label="Cancelar" :disable="guardando" @click="emit('update:abierto', false)" />
              <q-btn type="submit" unelevated no-caps color="primary" :label="usuarioEditar ? 'Guardar cambios' : 'Crear usuario'" :loading="guardando" :disable="guardando">
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
import {
  formatearTelefonoMask,
  validarTelefonoUsuario,
  validarUsernameLogin,
} from '@/composables/useUsersView';
import { OPCIONES_ROL_SIMULADOR } from '@/models/auth';
import type { RolUsuario } from '@/models/types';
import { DEPARTAMENTOS_SISTEMA, type User, type UserFormPayload } from '@/stores/useUsersStore';

const $q = useQuasar();
const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  usuarioEditar: User | null;
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: UserFormPayload];
}>();

const nombre = ref('');
const username = ref('');
const telefono = ref('');
const departamento = ref<string>(DEPARTAMENTOS_SISTEMA[0]!);
const rol = ref<RolUsuario>('USUARIO');
const activoToggle = ref(true);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    if (props.usuarioEditar) {
      nombre.value = props.usuarioEditar.nombre;
      username.value = props.usuarioEditar.username;
      telefono.value = props.usuarioEditar.telefono;
      departamento.value = props.usuarioEditar.departamento;
      rol.value = props.usuarioEditar.rol;
      activoToggle.value = props.usuarioEditar.estado === 'Activo';
    } else {
      nombre.value = '';
      username.value = '';
      telefono.value = '';
      departamento.value = DEPARTAMENTOS_SISTEMA[0]!;
      rol.value = 'USUARIO';
      activoToggle.value = true;
    }
  },
);

function limpiarTexto(valor: string): string {
  return valor.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  const telefonoArmado = formatearTelefonoMask(telefono.value);
  if (validarTelefonoUsuario(telefonoArmado) !== true) return;

  emit('guardar', {
    nombre: limpiarTexto(nombre.value),
    username: username.value.replace(/[\p{Cc}\s]/gu, '').toLowerCase(),
    telefono: telefonoArmado,
    departamento: departamento.value,
    rol: rol.value,
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
.estado-row { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; }
.form-error {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: var(--danger);
  font-size: 0.84rem;
}
</style>
