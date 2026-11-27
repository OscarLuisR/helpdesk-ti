<template>
  <q-page class="q-pa-md q-pa-sm-lg admin-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="manage_accounts" size="14px" />
          Administración · Cuentas
        </span>
        <h1 class="page-title">Usuarios</h1>
        <p class="page-subtitle">
          Gestión de cuentas corporativas, departamentos y asignación de perfiles del sistema.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Usuario"
          unelevated
          no-caps
          class="btn-nuevo"
          :class="{ 'full-width': $q.screen.xs }"
          @click="abrirModalCrear"
        />
      </div>
    </div>

    <q-card flat bordered class="modern-card overflow-hidden">
      <div class="toolbar-section q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-5">
            <q-input
              v-model="busqueda"
              debounce="300"
              dense
              outlined
              clearable
              placeholder="Buscar por nombre, usuario, correo o teléfono..."
            >
              <template #prepend><q-icon name="search" class="muted" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <q-select
              v-model="filtroRol"
              :options="opcionesFiltroRol"
              option-value="valor"
              option-label="etiqueta"
              emit-value
              map-options
              dense
              outlined
              options-dense
            />
          </div>
          <div class="col-12 col-sm-12 col-md-3">
            <q-select
              v-model="filtroEstado"
              :options="OPCIONES_FILTRO_ESTADO"
              dense
              outlined
              options-dense
            />
          </div>
        </div>
      </div>

      <q-table
        flat
        v-model:pagination="paginacion"
        :rows="usuariosFiltrados"
        :columns="COLUMNAS_USUARIOS"
        :rows-per-page-options="OPCIONES_FILAS_POR_PAGINA_USUARIOS"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron usuarios con los filtros seleccionados"
        class="modern-table tabla-usuarios"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height column justify-between">
              <div>
                <div class="row items-start justify-between no-wrap q-gutter-x-sm q-mb-xs">
                  <div class="row items-center no-wrap min-w-0 col">
                    <q-avatar
                      size="30px"
                      class="q-mr-sm avatar-iniciales shrink-0"
                      :style="avatarSolicitanteStyle(props.row.nombre_completo)"
                    >
                      {{ inicialesSolicitante(props.row.nombre_completo) }}
                    </q-avatar>
                    <div class="min-w-0 col">
                      <div class="text-weight-bold text-ink usuario-nombre-texto">
                        {{ props.row.nombre_completo }}
                      </div>
                      <div class="text-caption muted texto-break-anywhere">
                        {{ props.row.nick }} · #{{ props.row.id }}
                      </div>
                    </div>
                  </div>
                  <span class="chip shrink-0" :class="estadoChipClass(props.row.estado)">
                    <span class="chip__dot" />
                    {{ props.row.estado }}
                  </span>
                </div>
                <div v-if="props.row.email" class="text-caption muted usuario-email q-mb-xs">
                  {{ props.row.email }}
                </div>
                <div class="row items-center justify-between q-gutter-xs q-mt-sm q-mb-sm">
                  <RolBadge :codigo="props.row.codigo_rol" :etiqueta="props.row.rol" />
                  <span class="text-caption text-ink">{{ props.row.departamento }}</span>
                </div>
              </div>
              <div class="row items-center justify-between q-pt-sm card-item-footer">
                <span class="text-caption text-ink text-weight-medium tabular-nums telefono-lineal">
                  <q-icon name="phone" size="14px" class="muted q-mr-xs" />{{ props.row.telefono }}
                </span>
                <div class="row items-center q-gutter-xs no-wrap">
                  <q-btn
                    outline
                    unelevated
                    dense
                    color="secondary"
                    icon="edit"
                    size="sm"
                    aria-label="Editar usuario"
                    class="btn-accion-icono"
                    @click="abrirModalEditar(props.row)"
                  >
                    <q-tooltip>Editar usuario</q-tooltip>
                  </q-btn>
                  <q-btn
                    outline
                    unelevated
                    dense
                    icon="lock_reset"
                    size="sm"
                    aria-label="Restablecer contraseña"
                    class="btn-accion-icono btn-accion-reset"
                    @click="abrirModalReset(props.row)"
                  >
                    <q-tooltip>Restablecer contraseña</q-tooltip>
                  </q-btn>
                  <q-btn
                    outline
                    unelevated
                    dense
                    :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                    :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                    size="sm"
                    :aria-label="
                      props.row.estado === 'Activo' ? 'Desactivar usuario' : 'Activar usuario'
                    "
                    class="btn-accion-icono"
                    @click="alternarEstado(props.row)"
                  >
                    <q-tooltip>{{
                      props.row.estado === 'Activo' ? 'Desactivar' : 'Activar'
                    }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-id="props">
          <q-td :props="props">
            <span class="text-caption muted tabular-nums">{{ props.row.id }}</span>
          </q-td>
        </template>
        <template #body-cell-nombre="props">
          <q-td :props="props" class="celda-wrap">
            <div class="row items-start no-wrap">
              <q-avatar
                size="30px"
                class="q-mr-sm avatar-iniciales shrink-0"
                :style="avatarSolicitanteStyle(props.row.nombre_completo)"
              >
                {{ inicialesSolicitante(props.row.nombre_completo) }}
              </q-avatar>
              <div class="column min-w-0 col">
                <span class="text-weight-medium text-ink usuario-nombre-texto">{{
                  props.row.nombre_completo
                }}</span>
                <span v-if="props.row.email" class="text-caption muted usuario-email">{{
                  props.row.email
                }}</span>
              </div>
            </div>
          </q-td>
        </template>
        <template #body-cell-username="props">
          <q-td :props="props" class="celda-wrap">
            <span class="muted texto-break-anywhere">{{ props.row.nick }}</span>
          </q-td>
        </template>
        <template #body-cell-telefono="props">
          <q-td :props="props">
            <span class="text-caption text-ink text-weight-medium tabular-nums telefono-lineal">
              <q-icon name="phone" size="14px" class="muted q-mr-xs" />{{ props.row.telefono }}
            </span>
          </q-td>
        </template>
        <template #body-cell-departamento="props">
          <q-td :props="props" class="celda-wrap">
            <span class="text-caption text-weight-medium text-ink">{{
              props.row.departamento
            }}</span>
          </q-td>
        </template>
        <template #body-cell-rol="props">
          <q-td :props="props">
            <RolBadge :codigo="props.row.codigo_rol" :etiqueta="props.row.rol" />
          </q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <span class="chip" :class="estadoChipClass(props.row.estado)">
              <span class="chip__dot" />
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <div class="row items-center justify-end q-gutter-xs no-wrap">
              <q-btn
                outline
                unelevated
                dense
                color="secondary"
                icon="edit"
                size="sm"
                aria-label="Editar usuario"
                class="btn-accion-icono"
                @click="abrirModalEditar(props.row)"
              >
                <q-tooltip>Editar usuario</q-tooltip>
              </q-btn>
              <q-btn
                outline
                unelevated
                dense
                icon="lock_reset"
                size="sm"
                aria-label="Restablecer contraseña"
                class="btn-accion-icono btn-accion-reset"
                @click="abrirModalReset(props.row)"
              >
                <q-tooltip>Restablecer contraseña</q-tooltip>
              </q-btn>
              <q-btn
                outline
                unelevated
                dense
                :color="props.row.estado === 'Activo' ? 'negative' : 'positive'"
                :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                size="sm"
                :aria-label="
                  props.row.estado === 'Activo' ? 'Desactivar usuario' : 'Activar usuario'
                "
                class="btn-accion-icono"
                @click="alternarEstado(props.row)"
              >
                <q-tooltip>{{
                  props.row.estado === 'Activo' ? 'Desactivar' : 'Activar'
                }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>

      <!-- 🛡️ [FASE 3 - UI USUARIOS] Pie de paginación en 3 zonas consistente con Configuraciones -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_POR_PAGINA_USUARIOS"
            dense
            outlined
            options-dense
            hide-bottom-space
            aria-label="Registros por página"
            class="select-filas-pagina"
          />
          <span class="text-caption muted">por página</span>
        </div>

        <div class="footer-zona-centro">
          <q-pagination
            v-model="paginaActual"
            :max="totalPaginas"
            :max-pages="$q.screen.lt.sm ? 3 : 5"
            direction-links
            active-design="unelevated"
            active-color="primary"
            color="grey-7"
            size="sm"
          />
        </div>

        <div class="footer-zona-der text-caption muted tabular-nums">
          {{ textoMostrando }}
        </div>
      </div>
    </q-card>

    <UserFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :usuario-editar="usuarioEditando"
      :roles="rolesCatalogo"
      :departamentos="departamentosCatalogo"
      @guardar="guardarUsuario"
    />
    <ResetPasswordDialog
      v-model:abierto="modalResetAbierto"
      :guardando="guardandoReset"
      :error="errorReset"
      :usuario="usuarioReset"
      @confirmar="confirmarResetPassword"
    />
    <ConfirmarAccionDialog
      :abierto="confirmacionAbierta"
      v-bind="confirmacionOpciones"
      @responder="responderConfirmacion"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog.vue';
import UserFormDialog from '@/components/admin/UserFormDialog.vue';
import ConfirmarAccionDialog from '@/components/common/ConfirmarAccionDialog.vue';
import RolBadge from '@/components/common/RolBadge.vue';
import { avatarSolicitanteStyle, inicialesSolicitante } from '@/composables/useTickets';
import {
  COLUMNAS_USUARIOS,
  OPCIONES_FILAS_POR_PAGINA_USUARIOS,
  OPCIONES_FILTRO_ESTADO,
  estadoChipClass,
  useUsersView,
} from '@/composables/useUsersView';

const $q = useQuasar();
const {
  cargando,
  rolesCatalogo,
  departamentosCatalogo,
  opcionesFiltroRol,
  busqueda,
  filtroEstado,
  filtroRol,
  paginacion,
  filasPorPagina,
  paginaActual,
  totalPaginas,
  usuariosFiltrados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  usuarioEditando,
  modalResetAbierto,
  guardandoReset,
  errorReset,
  usuarioReset,
  confirmacionAbierta,
  confirmacionOpciones,
  responderConfirmacion,
  abrirModalCrear,
  abrirModalEditar,
  guardarUsuario,
  alternarEstado,
  abrirModalReset,
  confirmarResetPassword,
} = useUsersView();
</script>

<style scoped lang="scss">
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
}
.toolbar-section {
  border-bottom: 1px solid var(--border-subtle);
}
.btn-nuevo {
  padding: 8px 16px;
}
.avatar-iniciales {
  font-size: 11px;
  font-weight: 700;
}

// 🛡️ [FASE 3 - UI USUARIOS] Tabla fija sin scroll horizontal y celdas adaptables
.tabla-usuarios {
  :deep(.q-table__middle) {
    overflow-x: hidden;
  }

  :deep(table.q-table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(thead tr th) {
    white-space: normal;
    line-height: 1.25;
    padding: 11px 10px;
  }

  :deep(tbody td) {
    height: auto;
    white-space: normal;
    word-break: break-word;
    padding: 12px 10px;
  }
}

.celda-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.min-w-0 {
  min-width: 0;
}

.shrink-0 {
  flex-shrink: 0;
}

.usuario-nombre-texto {
  line-height: 1.35;
}

.usuario-email,
.texto-break-anywhere {
  overflow-wrap: anywhere;
  line-height: 1.3;
}

.telefono-lineal {
  white-space: nowrap;
}

.btn-accion-icono {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: var(--radius-sm);
}

.card-item-footer {
  border-top: 1px solid var(--border-subtle);
}

// Pie de tabla de 3 zonas consistente con Configuraciones, Catálogo y SLAs
.tabla-footer-3zonas {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--border-subtle);
  padding: 12px 16px;
}

.footer-zona-izq {
  justify-self: start;
}

.footer-zona-centro {
  justify-self: center;
}

.footer-zona-der {
  justify-self: end;
}

.select-filas-pagina {
  width: 68px;

  :deep(.q-field__control) {
    min-height: 30px;
    height: 30px;
  }

  :deep(.q-field__native),
  :deep(.q-field__marginal) {
    min-height: 30px;
    height: 30px;
    font-size: 0.78rem;
  }
}

@media (max-width: 639px) {
  .tabla-footer-3zonas {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .footer-zona-izq,
  .footer-zona-centro,
  .footer-zona-der {
    justify-self: center;
  }
}
</style>
