<template>
  <q-page class="login">
    <LoginBrandPanel class="login-brand-panel" />

    <div class="login-right">
      <div class="login-card">
        <h1>Bienvenido de nuevo</h1>
        <p class="sub">Por favor, inicia sesión en tu cuenta para continuar.</p>

        <q-banner v-if="errorAuth" dense rounded class="login-error q-mb-md" role="alert">
          <template #avatar>
            <q-icon
              :name="estaBloqueado ? 'lock_clock' : 'error_outline'"
              color="negative"
              size="20px"
            />
          </template>
          <span>{{ errorAuth }}</span>
          <span v-if="estaBloqueado" class="text-weight-bold q-ml-xs">
            ({{ tiempoBloqueoTexto }})
          </span>
        </q-banner>

        <q-form @submit.prevent="alEnviarFormulario">
          <div class="field-group">
            <label class="field-label" for="campo-usuario">Nombre de usuario</label>
            <q-input
              v-model="nombreUsuario"
              for="campo-usuario"
              type="text"
              outlined
              dense
              maxlength="25"
              autocomplete="username"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              :disable="cargando || estaBloqueado"
              lazy-rules
              hide-bottom-space
              :rules="[validarUsuario]"
              class="clean-input"
              @update:model-value="limpiarError"
            />
          </div>

          <div class="field-group">
            <label class="field-label" for="campo-contrasena">Contraseña</label>
            <q-input
              v-model="contrasena"
              for="campo-contrasena"
              :type="mostrarContrasena ? 'text' : 'password'"
              outlined
              dense
              maxlength="72"
              autocomplete="current-password"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              :disable="cargando || estaBloqueado"
              lazy-rules
              hide-bottom-space
              :rules="[(v: string) => !!v || 'Ingresa tu contraseña']"
              class="clean-input"
              @update:model-value="limpiarError"
            >
              <template #append>
                <q-icon
                  :name="mostrarContrasena ? 'visibility_off' : 'visibility'"
                  aria-label="Mostrar u ocultar contraseña"
                  size="18px"
                  color="grey-6"
                  class="cursor-pointer"
                  @click="mostrarContrasena = !mostrarContrasena"
                />
              </template>
            </q-input>
          </div>

          <q-btn
            type="submit"
            :label="estaBloqueado ? `Bloqueado (${tiempoBloqueoTexto})` : 'Iniciar sesión'"
            color="primary"
            unelevated
            no-caps
            :loading="cargando"
            :disable="cargando || estaBloqueado"
            class="full-width btn-signin q-mt-sm"
          >
            <template #loading>
              <q-spinner-oval size="18px" class="q-mr-sm" />
              <span>Verificando...</span>
            </template>
          </q-btn>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LoginBrandPanel from '@/components/auth/LoginBrandPanel.vue';
import { PATRON_NOMBRE_USUARIO, useAuth } from '@/composables/useAuth';

const {
  iniciarSesion,
  limpiarError,
  cargando,
  errorAuth,
  estaBloqueado,
  tiempoBloqueoTexto,
} = useAuth();

const nombreUsuario = ref('');
const contrasena = ref('');
const mostrarContrasena = ref(false);

function validarUsuario(valor: string): true | string {
  const limpio = (valor ?? '').trim();
  if (!limpio) return 'Ingresa tu nombre de usuario';
  if (!PATRON_NOMBRE_USUARIO.test(limpio)) {
    return 'Formato de usuario inválido (solo letras, números, punto o guion)';
  }
  return true;
}

async function alEnviarFormulario() {
  if (cargando.value || estaBloqueado.value) return;

  // Oculta inmediatamente la contraseña para prevenir exposición visual en pantalla
  mostrarContrasena.value = false;

  const exito = await iniciarSesion({
    username: nombreUsuario.value,
    password: contrasena.value,
  });

  if (!exito) {
    contrasena.value = '';
  }
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
    margin: 0 0 26px;
    font-size: 0.88rem;
  }
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
