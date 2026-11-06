<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h1 class="page-title">Usuarios y Roles</h1>
        <p class="page-subtitle">
          Gestión de cuentas corporativas, departamentos y asignación de los 6 perfiles del sistema.
        </p>
      </div>
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Usuario"
        unelevated
        no-caps
        class="btn-nuevo"
        @click="abrirModalCrear"
      />
    </div>

    <q-card flat bordered class="card">
      <div class="row items-center q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-4">
          <q-input v-model="busqueda" dense outlined clearable placeholder="Buscar">
            <template #prepend>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>
        </div>
        <q-space />
        <div class="col-12 col-sm-3 col-md-2">
          <q-select
            v-model="filtroRol"
            :options="OPCIONES_FILTRO_ROL"
            option-value="valor"
            option-label="etiqueta"
            emit-value
            map-options
            dense
            outlined
            options-dense
          />
        </div>
        <div class="col-12 col-sm-2">
          <q-select v-model="filtroEstado" :options="OPCIONES_FILTRO_ESTADO" dense outlined options-dense />
        </div>
      </div>

      <q-table
        flat
        :rows="usuariosPaginados"
        :columns="COLUMNAS_USUARIOS"
        row-key="id"
        hide-pagination
        :pagination="{ rowsPerPage: filasPorPagina }"
        no-data-label="No se encontraron usuarios con los filtros seleccionados"
        class="tabla-pro-q"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar
                size="30px"
                class="q-mr-sm avatar-iniciales"
                :style="avatarSolicitanteStyle(props.row.nombre)"
              >
                {{ inicialesSolicitante(props.row.nombre) }}
              </q-avatar>
              <span class="text-weight-medium text-dark">{{ props.row.nombre }}</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-username="props">
          <q-td :props="props">
            <span class="muted">@{{ props.row.username }}</span>
          </q-td>
        </template>

        <template #body-cell-rol="props">
          <q-td :props="props">
            <span class="chip" :class="ROL_CHIP_CLASS[props.row.rol as RolUsuario]">
              {{ etiquetaRol(props.row.rol) }}
            </span>
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props">
            <span class="chip" :class="estadoChipClass(props.row.estado)">
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <q-btn flat round dense icon="edit" size="sm" color="grey-8" @click="abrirModalEditar(props.row)">
              <q-tooltip>Editar usuario</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="lock_reset" size="sm" color="primary" @click="abrirModalReset(props.row)">
              <q-tooltip>Restablecer contraseña</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete_outline"
              size="sm"
              :color="props.row.estado === 'Activo' ? 'grey-8' : 'positive'"
              @click="alternarEstado(props.row)"
            >
              <q-tooltip>
                {{ props.row.estado === 'Activo' ? 'Desactivar usuario' : 'Reactivar usuario' }}
              </q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>

      <div class="row items-center justify-between tabla-footer">
        <q-pagination
          v-model="paginaActual"
          :max="totalPaginas"
          :max-pages="5"
          direction-links
          active-design="unelevated"
          active-color="primary"
          color="grey-7"
          size="sm"
        />
        <span class="text-caption muted">{{ textoMostrando }}</span>
      </div>
    </q-card>

    <UserFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :usuario-editar="usuarioEditando"
      @guardar="guardarUsuario"
    />

    <ResetPasswordDialog
      v-model:abierto="modalResetAbierto"
      :guardando="guardandoReset"
      :error="errorReset"
      :usuario="usuarioReset"
      @confirmar="confirmarResetPassword"
    />
  </q-page>
</template>

<script setup lang="ts">
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog.vue';
import UserFormDialog from '@/components/admin/UserFormDialog.vue';
import { avatarSolicitanteStyle, inicialesSolicitante } from '@/composables/useTickets';
import {
  COLUMNAS_USUARIOS,
  OPCIONES_FILTRO_ESTADO,
  OPCIONES_FILTRO_ROL,
  ROL_CHIP_CLASS,
  estadoChipClass,
  etiquetaRol,
  useUsersView,
} from '@/composables/useUsersView';
import type { RolUsuario } from '@/models/types';

const {
  busqueda,
  filtroEstado,
  filtroRol,
  paginaActual,
  filasPorPagina,
  totalPaginas,
  usuariosPaginados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  usuarioEditando,
  modalResetAbierto,
  guardandoReset,
  errorReset,
  usuarioReset,
  abrirModalCrear,
  abrirModalEditar,
  guardarUsuario,
  alternarEstado,
  abrirModalReset,
  confirmarResetPassword,
} = useUsersView();
</script>

<style scoped lang="scss">
.btn-nuevo { border-radius: 8px; padding: 6px 16px; font-weight: 600; }
.avatar-iniciales { font-size: 11px; font-weight: 600; }
</style>
