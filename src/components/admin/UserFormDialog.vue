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
            {{
              usuarioEditar
                ? 'Actualiza los datos, departamento o rol del usuario.'
                : `Registra una nueva cuenta corporativa (clave inicial por defecto: ${configuracionesStore.claveTemporalDefecto}).`
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

        <q-form ref="formRef" @submit.prevent="alGuardar">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="nombreCompleto"
                label="Nombre completo"
                placeholder="Ej. María González"
                outlined
                dense
                maxlength="100"
                lazy-rules
                :rules="[
                  (v: string) => !!v?.trim() || 'Ingresa el nombre completo',
                  (v: string) => (v?.trim().length ?? 0) <= 100 || 'Máximo 100 caracteres',
                ]"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="nick"
                label="Nombre de usuario (Login)"
                placeholder="Ej. maria.gonzalez"
                outlined
                dense
                maxlength="25"
                lazy-rules
                :rules="[validarUsernameLogin]"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="telefono"
                label="Teléfono"
                placeholder="0412-2964550"
                mask="####-#######"
                outlined
                dense
                lazy-rules
                :rules="[validarTelefonoUsuario]"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="email"
                label="Correo electrónico (Opcional)"
                placeholder="usuario@empresa.com"
                outlined
                dense
                maxlength="150"
                lazy-rules
                :rules="[validarEmailUsuario]"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="idDepartamento"
                :options="opcionesDepartamento"
                option-value="id"
                option-label="nombre"
                emit-value
                map-options
                label="Departamento"
                outlined
                dense
                options-dense
                lazy-rules
                :rules="[(v: number | null) => (typeof v === 'number' && v > 0) || 'Selecciona un departamento']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="idRol"
                :options="opcionesRol"
                option-value="id"
                option-label="nombre"
                emit-value
                map-options
                label="Rol en el sistema"
                outlined
                dense
                options-dense
                lazy-rules
                :rules="[(v: number | null) => (typeof v === 'number' && v > 0) || 'Selecciona un rol']"
              />
            </div>

            <div v-if="usuarioEditar" class="col-12">
              <div class="row items-center justify-between estado-row q-px-md q-py-xs full-height">
                <div>
                  <div class="text-body2 text-weight-medium text-dark">Estado de la cuenta</div>
                  <div class="text-caption muted">{{ activoToggle ? 'Activo' : 'Inactivo' }}</div>
                </div>
                <q-toggle v-model="activoToggle" color="primary" />
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
import { computed, nextTick, ref, watch } from 'vue';
import { useQuasar, type QForm } from 'quasar';
import {
  formatearTelefonoMask,
  validarEmailUsuario,
  validarTelefonoUsuario,
  validarUsernameLogin,
} from '@/composables/useUsersView';
import { useConfiguracionesStore } from '@/stores/useConfiguracionesStore';
import { esDepartamentoTI, type Department } from '@/stores/useDepartmentsStore';
import type { RolItem } from '@/stores/useRolesStore';
import type { User, UserFormPayload } from '@/stores/useUsersStore';

const $q = useQuasar();
const configuracionesStore = useConfiguracionesStore();
const props = defineProps<{
  abierto: boolean;
  guardando: boolean;
  error: string | null;
  usuarioEditar: User | null;
  roles: RolItem[];
  departamentos: Department[];
}>();

const emit = defineEmits<{
  'update:abierto': [valor: boolean];
  guardar: [payload: UserFormPayload];
}>();

const nombreCompleto = ref('');
const nick = ref('');
const telefono = ref('');
const email = ref('');
const idDepartamento = ref<number | null>(null);
const idRol = ref<number | null>(null);
const formRef = ref<QForm | null>(null);
const activoToggle = ref(true);

// 🛡️ [FASE 2 - REGLA OPERATIVA TI] Por ahora solo personal directo de TI (tipos 1 y 2) y roles técnicos/gerenciales
const ROLES_TI_PERMITIDOS = new Set<string>([
  'DIRECTOR',
  'GERENTE_AREA',
  'MESA_TECNICA',
  'TECNICO',
]);

const opcionesDepartamento = computed(() =>
  props.departamentos.filter(
    (d) => (d.is_activo && esDepartamentoTI(d)) || d.id === props.usuarioEditar?.id_departamento,
  ),
);

const opcionesRol = computed(() =>
  props.roles.filter(
    (r) =>
      (r.is_activo && ROLES_TI_PERMITIDOS.has(r.codigo.trim().toUpperCase())) ||
      r.id === props.usuarioEditar?.id_rol,
  ),
);

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return;
    if (props.usuarioEditar) {
      nombreCompleto.value = props.usuarioEditar.nombre_completo;
      nick.value = props.usuarioEditar.nick;
      telefono.value = props.usuarioEditar.telefono;
      email.value = props.usuarioEditar.email ?? '';
      idDepartamento.value = props.usuarioEditar.id_departamento;
      idRol.value = props.usuarioEditar.id_rol;
      activoToggle.value = props.usuarioEditar.is_activo;
    } else {
      nombreCompleto.value = '';
      nick.value = '';
      telefono.value = '';
      email.value = '';
      // 🛡️ Sin preselección al crear: obliga a elegir explícitamente departamento y rol
      idDepartamento.value = null;
      idRol.value = null;
      activoToggle.value = true;
    }
    void nextTick(() => formRef.value?.resetValidation());
  },
);

function limpiarTexto(valor: string): string {
  return valor.replace(/[<>"'`\p{Cc}]/gu, '').trim();
}

function alGuardar(): void {
  const telefonoArmado = formatearTelefonoMask(telefono.value);
  if (validarTelefonoUsuario(telefonoArmado) !== true) return;
  if (!idDepartamento.value || !idRol.value) return;

  const emailLimpio = limpiarTexto(email.value).toLowerCase();
  const payload: UserFormPayload = {
    nombre_completo: limpiarTexto(nombreCompleto.value),
    nick: nick.value.replace(/[\p{Cc}\s]/gu, '').toLowerCase(),
    telefono: telefonoArmado,
    email: emailLimpio.length > 0 ? emailLimpio : null,
    id_departamento: idDepartamento.value,
    id_rol: idRol.value,
  };

  if (props.usuarioEditar) {
    payload.is_activo = activoToggle.value;
  }

  emit('guardar', payload);
}
</script>

<style scoped lang="scss">
.dialog-card {
  width: 100vw;
  max-width: 720px;
}
</style>
