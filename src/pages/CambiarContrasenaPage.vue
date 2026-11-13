<template>
  <q-page class="login">
    <LoginBrandPanel class="login-brand-panel" />

    <div class="login-right">
      <div class="login-card">
        <div class="security-badge q-mb-sm">
          <q-icon name="lock_reset" size="16px" />
          <span>Primer inicio de sesión</span>
        </div>

        <h1>Actualiza tu contraseña</h1>
        <p class="sub">
          Hola<template v-if="nombreMostrado">, <strong>{{ nombreMostrado }}</strong></template>.
          Por seguridad, debes reemplazar tu contraseña temporal antes de ingresar al sistema.
        </p>

        <q-banner v-if="errorCambio" dense rounded class="login-error q-mb-md" role="alert">
          <template #avatar>
            <q-icon name="error_outline" color="negative" size="20px" />
          </template>
          <span>{{ errorCambio }}</span>
        </q-banner>

        <q-form @submit.prevent="alEnviarCambio">
          <div class="field-group">
            <label class="field-label" for="campo-nueva-contrasena">Nueva contraseña</label>
            <q-input
              v-model="nuevaContrasena"
              for="campo-nueva-contrasena"
              :type="mostrarNueva ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres (distinta de 123456)"
              outlined
              dense
              maxlength="72"
              autocomplete="new-password"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              :disable="guardando"
              lazy-rules
              hide-bottom-space
              :rules="[validarNuevaContrasena]"
              class="clean-input"
              @update:model-value="limpiarError"
            >
              <template #append>
                <q-icon
                  :name="mostrarNueva ? 'visibility_off' : 'visibility'"
                  aria-label="Mostrar u ocultar nueva contraseña"
                  size="18px"
                  color="grey-6"
                  class="cursor-pointer"
                  @click="mostrarNueva = !mostrarNueva"
                />
              </template>
            </q-input>
          </div>

          <div class="field-group">
            <label class="field-label" for="campo-confirmar-contrasena">
              Confirmar nueva contraseña
            </label>
            <q-input
              v-model="confirmarContrasena"
              for="campo-confirmar-contrasena"
              :type="mostrarConfirmacion ? 'text' : 'password'"
              placeholder="Repite tu nueva contraseña"
              outlined
              dense
              maxlength="72"
              autocomplete="new-password"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              :disable="guardando"
              lazy-rules
              hide-bottom-space
              :rules="[validarConfirmacionContrasena]"
              class="clean-input"
              @update:model-value="limpiarError"
            >
              <template #append>
                <q-icon
                  :name="mostrarConfirmacion ? 'visibility_off' : 'visibility'"
                  aria-label="Mostrar u ocultar confirmación de contraseña"
                  size="18px"
                  color="grey-6"
                  class="cursor-pointer"
                  @click="mostrarConfirmacion = !mostrarConfirmacion"
                />
              </template>
            </q-input>
          </div>

          <q-btn
            type="submit"
            label="Guardar nueva contraseña"
            color="primary"
            unelevated
            no-caps
            :loading="guardando"
            :disable="guardando"
            class="full-width btn-signin q-mt-sm"
          >
            <template #loading>
              <q-spinner-oval size="18px" class="q-mr-sm" />
              <span>Actualizando...</span>
            </template>
          </q-btn>

          <q-btn
            type="button"
            flat
            no-caps
            color="secondary"
            label="Cancelar y volver al inicio de sesión"
            :disable="guardando"
            class="full-width btn-cancel q-mt-xs"
            @click="alCancelar"
          />
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import axios from 'axios';
import { Notify } from 'quasar';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import LoginBrandPanel from '@/components/auth/LoginBrandPanel.vue';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useTicketStore } from '@/stores/ticketStore';

const CLAVE_TEMPORAL_DEFECTO = '123456';

interface RespuestaApiError {
  message?: string;
}

const authStore = useAuthStore();
const ticketStore = useTicketStore();
const router = useRouter();

const nuevaContrasena = ref('');
const confirmarContrasena = ref('');
const mostrarNueva = ref(false);
const mostrarConfirmacion = ref(false);
const guardando = ref(false);
const errorCambio = ref<string | null>(null);

const nombreMostrado = computed(() => authStore.usuario?.nombre ?? '');

function limpiarError(): void {
  errorCambio.value = null;
}

function validarNuevaContrasena(valor: string): true | string {
  const actual = valor ?? '';
  if (!actual || actual.trim().length === 0) {
    return 'Ingresa tu nueva contraseña';
  }
  if (actual.length < 6 || actual.trim().length < 6) {
    return 'La nueva contraseña debe tener al menos 6 caracteres';
  }
  if (actual.length > 72) {
    return 'La nueva contraseña debe tener máximo 72 caracteres';
  }
  if (actual === CLAVE_TEMPORAL_DEFECTO || actual.trim() === CLAVE_TEMPORAL_DEFECTO) {
    return 'La nueva contraseña no puede ser igual a la clave temporal (123456)';
  }
  return true;
}

function validarConfirmacionContrasena(valor: string): true | string {
  if (!valor) {
    return 'Confirma tu nueva contraseña';
  }
  if (valor !== nuevaContrasena.value) {
    return 'Las contraseñas no coinciden';
  }
  return true;
}

function extraerMensajeError(err: unknown): string {
  if (axios.isAxiosError<RespuestaApiError>(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }
  return 'No fue posible actualizar la contraseña. Intenta nuevamente.';
}

async function alEnviarCambio(): Promise<void> {
  if (guardando.value) return;

  mostrarNueva.value = false;
  mostrarConfirmacion.value = false;
  errorCambio.value = null;

  const validacionNueva = validarNuevaContrasena(nuevaContrasena.value);
  if (validacionNueva !== true) {
    errorCambio.value = validacionNueva;
    return;
  }

  const validacionConfirmacion = validarConfirmacionContrasena(confirmarContrasena.value);
  if (validacionConfirmacion !== true) {
    errorCambio.value = validacionConfirmacion;
    return;
  }

  guardando.value = true;
  try {
    await api.patch('/auth/change-password', {
      password_nuevo: nuevaContrasena.value,
      confirmar_password: confirmarContrasena.value,
    });

    await authStore.cerrarSesion();
    ticketStore.limpiarTickets();

    Notify.create({
      type: 'positive',
      message: 'Contraseña actualizada con éxito. Inicia sesión con tu nueva clave.',
      position: 'top',
      timeout: 4500,
    });

    await router.replace('/');
  } catch (err: unknown) {
    errorCambio.value = extraerMensajeError(err);
    nuevaContrasena.value = '';
    confirmarContrasena.value = '';
  } finally {
    guardando.value = false;
  }
}

async function alCancelar(): Promise<void> {
  if (guardando.value) return;
  await authStore.cerrarSesion();
  ticketStore.limpiarTickets();
  await router.replace('/');
}
</script>

<style scoped lang="scss">
.login {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}
.login-right {
  display: grid;
  place-items: center;
  padding: 24px;
  background-color: #f4f7f9;
  background-image: radial-gradient(#dbe2ea 1px, transparent 1px);
  background-size: 16px 16px;
}
.login-card {
  width: 100%;
  max-width: 410px;
  background: #fff;
  border: 1px solid #e8eef3;
  border-radius: 14px;
  padding: 38px 36px;
  box-shadow:
    0 10px 30px rgba(15, 23, 42, 0.06),
    0 1px 3px rgba(15, 23, 42, 0.03);
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
  }
  .sub {
    color: #64748b;
    margin: 0 0 24px;
    font-size: 0.88rem;
    line-height: 1.45;
  }
}
.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  border: 1px solid rgba(15, 118, 110, 0.22);
  color: #0f766e;
  font-size: 0.76rem;
  font-weight: 600;
}
.field-group {
  margin-bottom: 18px;
}
.field-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}
.clean-input :deep(.q-field__control) {
  height: 42px;
  border-radius: 8px;
  background: #fff;
  &::before {
    border-color: #cbd5e1;
    transition: border-color 0.2s ease;
  }
}
.clean-input :deep(.q-field--focused .q-field__control),
.clean-input.q-field--focused :deep(.q-field__control) {
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.2);
}
.btn-signin {
  height: 42px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}
.btn-cancel {
  height: 38px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.84rem;
}
.login-error {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: var(--danger);
  font-size: 0.84rem;
}
@media (max-width: 900px) {
  .login {
    grid-template-columns: 1fr;
  }
  .login-brand-panel {
    display: none;
  }
}
</style>
