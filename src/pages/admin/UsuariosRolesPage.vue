<template>
  <q-page class="q-pa-md q-pa-sm-lg admin-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="manage_accounts" size="14px" />
          Administración · Cuentas
        </span>
        <h1 class="page-title">Usuarios</h1>
        <p class="page-subtitle">Gestión de cuentas corporativas, departamentos y asignación de perfiles del sistema.</p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn color="primary" icon="add" label="Nuevo Usuario" unelevated no-caps class="btn-nuevo" :class="{ 'full-width': $q.screen.xs }" @click="abrirModalCrear" />
      </div>
    </div>

    <q-card flat bordered class="modern-card overflow-hidden">
      <div class="toolbar-section q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-5">
            <q-input v-model="busqueda" debounce="300" dense outlined clearable placeholder="Buscar por nombre, usuario, correo o teléfono...">
              <template #prepend><q-icon name="search" class="muted" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <q-select v-model="filtroRol" :options="opcionesFiltroRol" option-value="valor" option-label="etiqueta" emit-value map-options dense outlined options-dense />
          </div>
          <div class="col-12 col-sm-12 col-md-3">
            <q-select v-model="filtroEstado" :options="OPCIONES_FILTRO_ESTADO" dense outlined options-dense />
          </div>
        </div>
      </div>

      <q-table
        flat
        v-model:pagination="paginacion"
        :rows="usuariosFiltrados"
        :columns="COLUMNAS_USUARIOS"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron usuarios con los filtros seleccionados"
        class="modern-table"
      >
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height">
              <div class="row items-start justify-between no-wrap q-mb-xs">
                <div class="row items-center no-wrap">
                  <q-avatar size="28px" class="q-mr-xs avatar-iniciales" :style="avatarSolicitanteStyle(props.row.nombre_completo)">
                    {{ inicialesSolicitante(props.row.nombre_completo) }}
                  </q-avatar>
                  <div>
                    <div class="text-weight-bold text-ink">{{ props.row.nombre_completo }}</div>
                    <div class="text-caption muted">{{ props.row.nick }}</div>
                  </div>
                </div>
                <span class="chip" :class="estadoChipClass(props.row.estado)">
                  <span class="chip__dot" />
                  {{ props.row.estado }}
                </span>
              </div>
              <div v-if="props.row.email" class="text-caption muted q-mb-xs">{{ props.row.email }}</div>
              <div class="row items-center justify-between q-mt-sm">
                <span class="chip" :class="claseChipRol(props.row.codigo_rol)">{{ props.row.rol }}</span>
                <span class="text-caption text-ink">{{ props.row.departamento }}</span>
              </div>
              <div class="row items-center justify-between q-mt-xs">
                <span class="text-caption text-ink tabular-nums"><q-icon name="phone" size="14px" class="muted q-mr-xs" />{{ props.row.telefono }}</span>
                <div class="row items-center q-gutter-xs">
                  <q-btn flat unelevated no-caps round dense icon="edit" size="sm" class="row-action-btn" @click="abrirModalEditar(props.row)"><q-tooltip>Editar usuario</q-tooltip></q-btn>
                  <q-btn flat unelevated no-caps round dense icon="lock_reset" size="sm" color="primary" @click="abrirModalReset(props.row)"><q-tooltip>Restablecer contraseña</q-tooltip></q-btn>
                  <q-btn flat unelevated no-caps round dense icon="delete_outline" size="sm" :class="props.row.estado === 'Activo' ? 'row-action-btn' : 'row-action-btn--ok'" @click="alternarEstado(props.row)"><q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip></q-btn>
                </div>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar size="30px" class="q-mr-sm avatar-iniciales" :style="avatarSolicitanteStyle(props.row.nombre_completo)">{{ inicialesSolicitante(props.row.nombre_completo) }}</q-avatar>
              <div class="column">
                <span class="text-weight-medium text-ink">{{ props.row.nombre_completo }}</span>
                <span v-if="props.row.email" class="text-caption muted">{{ props.row.email }}</span>
              </div>
            </div>
          </q-td>
        </template>
        <template #body-cell-username="props">
          <q-td :props="props"><span class="muted">{{ props.row.nick }}</span></q-td>
        </template>
        <template #body-cell-telefono="props">
          <q-td :props="props"><span class="text-caption text-ink text-weight-medium tabular-nums"><q-icon name="phone" size="14px" class="muted q-mr-xs" />{{ props.row.telefono }}</span></q-td>
        </template>
        <template #body-cell-rol="props">
          <q-td :props="props"><span class="chip" :class="claseChipRol(props.row.codigo_rol)">{{ props.row.rol }}</span></q-td>
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
          <q-td :props="props" auto-width>
            <q-btn flat unelevated no-caps round dense icon="edit" size="sm" class="row-action-btn" @click="abrirModalEditar(props.row)"><q-tooltip>Editar usuario</q-tooltip></q-btn>
            <q-btn flat unelevated no-caps round dense icon="lock_reset" size="sm" color="primary" @click="abrirModalReset(props.row)"><q-tooltip>Restablecer contraseña</q-tooltip></q-btn>
            <q-btn flat unelevated no-caps round dense icon="delete_outline" size="sm" :class="props.row.estado === 'Activo' ? 'row-action-btn' : 'row-action-btn--ok'" @click="alternarEstado(props.row)"><q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip></q-btn>
          </q-td>
        </template>
      </q-table>

      <div class="row items-center justify-between tabla-footer q-col-gutter-sm">
        <q-pagination v-model="paginaActual" :max="totalPaginas" :max-pages="$q.screen.lt.sm ? 3 : 5" direction-links active-design="unelevated" active-color="primary" color="grey-7" size="sm" />
        <span class="text-caption muted tabular-nums">{{ textoMostrando }}</span>
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
import { avatarSolicitanteStyle, inicialesSolicitante } from '@/composables/useTickets';
import {
  COLUMNAS_USUARIOS,
  OPCIONES_FILTRO_ESTADO,
  claseChipRol,
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
.admin-page { max-width: 1400px; margin: 0 auto; }
.toolbar-section { border-bottom: 1px solid var(--border-subtle); }
.btn-nuevo { padding: 8px 16px; }
.avatar-iniciales { font-size: 11px; font-weight: 700; }
</style>
