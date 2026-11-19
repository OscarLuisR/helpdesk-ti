<template>
  <q-page class="q-pa-md q-pa-sm-lg dept-page">
    <!-- Encabezado de página -->
    <div class="row items-end justify-between q-gutter-y-md q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="apartment" size="14px" />
          Administración · Estructura
        </span>
        <h1 class="page-title">Departamentos</h1>
        <p class="page-subtitle">
          Gestión de áreas corporativas solicitantes y sub-gerencias técnicas de TI.
        </p>
      </div>

      <div class="col-12 col-sm-auto row items-center q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Nuevo Departamento"
          class="btn-nuevo"
          :class="{ 'full-width': $q.screen.xs }"
          @click="abrirModalCrear"
        />
      </div>
    </div>

    <!-- Bento Grid de métricas estructurales -->
    <div class="bento-grid q-mb-lg">
      <div
        v-for="metrica in metricasBento"
        :key="metrica.id"
        class="modern-card modern-card--interactive bento-card q-pa-md"
      >
        <div class="row items-center justify-between no-wrap q-mb-sm">
          <span class="bento-card__label">{{ metrica.etiqueta }}</span>
          <span class="soft-badge" :class="metrica.badgeClase">
            <span class="soft-badge__dot" />
            {{ metrica.tag }}
          </span>
        </div>
        <div class="row items-baseline justify-between no-wrap">
          <span class="bento-card__value tabular-nums">{{ metrica.valor }}</span>
          <span class="bento-card__hint">{{ metrica.detalle }}</span>
        </div>
      </div>
    </div>

    <!-- Contenedor principal de filtros y tabla -->
    <q-card flat bordered class="modern-card tabla-wrapper">
      <div class="toolbar-section q-pa-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-5">
            <q-input
              v-model="busqueda"
              debounce="300"
              dense
              outlined
              clearable
              placeholder="Buscar por código, nombre o responsable..."
            >
              <template #prepend>
                <q-icon name="search" size="18px" class="filter-icon" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <q-select
              v-model="filtroTipo"
              :options="opcionesFiltroTipo"
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
        :rows="departamentosFiltrados"
        :columns="COLUMNAS_DEPARTAMENTOS"
        row-key="id"
        :loading="cargando"
        :grid="$q.screen.lt.md"
        hide-pagination
        no-data-label="No se encontraron departamentos con los filtros seleccionados"
        class="modern-table"
      >
        <!-- Vista móvil en tarjetas Bento -->
        <template #item="props">
          <div class="col-12 col-sm-6 q-pa-xs">
            <q-card flat bordered class="modern-card q-pa-md full-height">
              <div class="row items-center justify-between no-wrap q-mb-sm">
                <span class="soft-badge soft-badge--slate">{{ props.row.codigo }}</span>
                <span
                  class="soft-badge"
                  :class="props.row.estado === 'Activo' ? 'soft-badge--ok' : 'soft-badge--bad'"
                >
                  <span class="soft-badge__dot" />
                  {{ props.row.estado }}
                </span>
              </div>

              <div class="dept-name q-mb-xs">{{ props.row.nombre }}</div>
              <div v-if="props.row.ubicacion" class="text-caption muted q-mb-sm">
                {{ props.row.ubicacion }}
              </div>

              <div class="row items-center justify-between q-mt-sm q-pt-sm mobile-card-divider">
                <div class="row items-center no-wrap">
                  <template v-if="props.row.responsable">
                    <q-avatar
                      size="26px"
                      class="q-mr-xs avatar-iniciales"
                      :style="avatarSolicitanteStyle(props.row.responsable)"
                    >
                      {{ inicialesSolicitante(props.row.responsable) }}
                    </q-avatar>
                    <span class="text-caption dept-resp">{{ props.row.responsable }}</span>
                  </template>
                  <span v-else class="text-caption muted">Sin responsable asignado</span>
                </div>

                <div class="row items-center q-gutter-xs">
                  <q-btn
                    flat
                    unelevated
                    no-caps
                    round
                    dense
                    icon="edit"
                    size="sm"
                    class="row-action-btn"
                    @click="abrirModalEditar(props.row)"
                  />
                  <q-btn
                    flat
                    unelevated
                    no-caps
                    round
                    dense
                    :icon="props.row.estado === 'Activo' ? 'block' : 'check_circle_outline'"
                    size="sm"
                    :class="props.row.estado === 'Activo' ? 'row-action-btn' : 'row-action-btn--ok'"
                    @click="alternarEstado(props.row)"
                  />
                </div>
              </div>

              <div class="row items-center justify-between q-mt-sm">
                <span class="text-caption muted tabular-nums">
                  <q-icon name="phone" size="14px" class="q-mr-xs" />
                  {{ props.row.telefono }}
                </span>
                <span
                  class="soft-badge"
                  :class="esDepartamentoTI(props.row) ? 'soft-badge--accent' : 'soft-badge--neutral'"
                >
                  {{ props.row.tipo_departamento }}
                </span>
              </div>
            </q-card>
          </div>
        </template>

        <template #body-cell-codigo="props">
          <q-td :props="props">
            <span class="soft-badge soft-badge--slate tabular-nums">
              {{ props.row.codigo }}
            </span>
          </q-td>
        </template>

        <template #body-cell-nombre="props">
          <q-td :props="props">
            <div class="column">
              <span class="dept-name">{{ props.row.nombre }}</span>
              <span v-if="props.row.ubicacion" class="text-caption muted">
                {{ props.row.ubicacion }}
              </span>
            </div>
          </q-td>
        </template>

        <template #body-cell-responsable="props">
          <q-td :props="props">
            <div v-if="props.row.responsable" class="row items-center no-wrap">
              <q-avatar
                size="28px"
                class="q-mr-sm avatar-iniciales"
                :style="avatarSolicitanteStyle(props.row.responsable)"
              >
                {{ inicialesSolicitante(props.row.responsable) }}
              </q-avatar>
              <span class="dept-resp">{{ props.row.responsable }}</span>
            </div>
            <span v-else class="text-caption muted">Sin asignar</span>
          </q-td>
        </template>

        <template #body-cell-telefono="props">
          <q-td :props="props">
            <span class="text-caption dept-phone tabular-nums">
              <q-icon name="phone" size="14px" class="filter-icon q-mr-xs" />
              {{ props.row.telefono }}
            </span>
          </q-td>
        </template>

        <template #body-cell-tipo="props">
          <q-td :props="props">
            <span
              class="soft-badge"
              :class="esDepartamentoTI(props.row) ? 'soft-badge--accent' : 'soft-badge--neutral'"
            >
              {{ props.row.tipo_departamento }}
            </span>
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props">
            <span
              class="soft-badge"
              :class="props.row.estado === 'Activo' ? 'soft-badge--ok' : 'soft-badge--bad'"
            >
              <span class="soft-badge__dot" />
              {{ props.row.estado }}
            </span>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" auto-width>
            <div class="row items-center justify-end no-wrap q-gutter-xs">
              <q-btn
                flat
                unelevated
                no-caps
                round
                dense
                icon="edit"
                size="sm"
                class="row-action-btn"
                aria-label="Editar departamento"
                @click="abrirModalEditar(props.row)"
              >
                <q-tooltip>Editar departamento</q-tooltip>
              </q-btn>
              <q-btn
                flat
                unelevated
                no-caps
                round
                dense
                :icon="props.row.estado === 'Activo' ? 'delete_outline' : 'restore'"
                size="sm"
                :class="props.row.estado === 'Activo' ? 'row-action-btn' : 'row-action-btn--ok'"
                :aria-label="props.row.estado === 'Activo' ? 'Desactivar' : 'Activar'"
                @click="alternarEstado(props.row)"
              >
                <q-tooltip>{{ props.row.estado === 'Activo' ? 'Desactivar' : 'Activar' }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>

      <div class="row items-center justify-between tabla-footer q-col-gutter-sm">
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
        <span class="text-caption muted tabular-nums">{{ textoMostrando }}</span>
      </div>
    </q-card>

    <DepartmentFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :departamento-editar="departamentoEditando"
      :tipos-departamento="tiposDepartamento"
      @guardar="guardarDepartamento"
    />
    <ConfirmarAccionDialog
      :abierto="confirmacionAbierta"
      v-bind="confirmacionOpciones"
      @responder="responderConfirmacion"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import DepartmentFormDialog from '@/components/admin/DepartmentFormDialog.vue';
import ConfirmarAccionDialog from '@/components/common/ConfirmarAccionDialog.vue';
import {
  COLUMNAS_DEPARTAMENTOS,
  OPCIONES_FILTRO_ESTADO,
  useDepartmentsView,
} from '@/composables/useDepartmentsView';
import { avatarSolicitanteStyle, inicialesSolicitante } from '@/composables/useTickets';
import { esDepartamentoTI, useDepartmentsStore } from '@/stores/useDepartmentsStore';

const $q = useQuasar();
const departmentsStore = useDepartmentsStore();

const {
  cargando,
  tiposDepartamento,
  opcionesFiltroTipo,
  busqueda,
  filtroTipo,
  filtroEstado,
  paginacion,
  paginaActual,
  totalPaginas,
  departamentosFiltrados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  departamentoEditando,
  confirmacionAbierta,
  confirmacionOpciones,
  responderConfirmacion,
  abrirModalCrear,
  abrirModalEditar,
  guardarDepartamento,
  alternarEstado,
} = useDepartmentsView();

const metricasBento = computed(() => {
  const todos = departmentsStore.departments;
  const total = todos.length;
  const activos = todos.filter((d) => d.is_activo).length;
  const inactivos = total - activos;
  const areasTi = todos.filter((d) => esDepartamentoTI(d)).length;
  const conResponsable = todos.filter((d) => Boolean(d.responsable)).length;
  const pctActivos = total > 0 ? Math.round((activos / total) * 100) : 0;

  return [
    {
      id: 'total',
      etiqueta: 'Total registrados',
      valor: total,
      tag: 'Estructura',
      badgeClase: 'soft-badge--primary',
      detalle: `${tiposDepartamento.value.length} tipos configurados`,
    },
    {
      id: 'activos',
      etiqueta: 'Departamentos activos',
      valor: activos,
      tag: `${pctActivos}%`,
      badgeClase: 'soft-badge--ok',
      detalle: `${inactivos} inactivo${inactivos === 1 ? '' : 's'}`,
    },
    {
      id: 'ti',
      etiqueta: 'Áreas técnicas TI',
      valor: areasTi,
      tag: 'Mesa & Soporte',
      badgeClase: 'soft-badge--accent',
      detalle: `${total - areasTi} áreas solicitantes`,
    },
    {
      id: 'responsable',
      etiqueta: 'Con responsable',
      valor: conResponsable,
      tag: 'Liderazgo',
      badgeClase: 'soft-badge--amber',
      detalle: `${total - conResponsable} sin asignar`,
    },
  ];
});
</script>

<style scoped lang="scss">
.dept-page {
  max-width: 1400px;
  margin: 0 auto;
}

.btn-nuevo {
  padding: 8px 16px;
}

.bento-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 98px;

  &__label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  &__value {
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: var(--text-primary);
  }

  &__hint {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
}

.tabla-wrapper {
  overflow: hidden;
}

.toolbar-section {
  border-bottom: 1px solid var(--border-subtle);
}

.filter-icon {
  color: var(--text-muted);
}

.dept-name {
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.dept-resp {
  font-weight: 500;
  color: var(--text-primary);
}

.dept-phone {
  color: var(--text-secondary);
}

.avatar-iniciales {
  font-size: 0.68rem;
  font-weight: 700;
}

.mobile-card-divider {
  border-top: 1px solid var(--border-subtle);
}

.row-action-btn {
  color: var(--text-muted);

  &:hover {
    color: var(--text-primary);
    background: var(--surface-subtle);
  }

  &--ok {
    color: var(--success);

    &:hover {
      background: rgba(21, 128, 61, 0.12);
    }
  }
}
</style>
