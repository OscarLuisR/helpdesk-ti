<template>
  <q-page class="q-pa-md q-pa-sm-lg admin-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm-auto">
        <span class="page-eyebrow">
          <q-icon name="account_tree" size="14px" />
          Administración · Clasificación
        </span>
        <h1 class="page-title">Tipo Departamentos</h1>
        <p class="page-subtitle">
          Clasificación organizacional de gerencias de TI, sub-gerencias técnicas y áreas usuarias.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Tipo"
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
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="col-12 col-sm-8 col-md-6">
            <q-input
              v-model="busqueda"
              debounce="300"
              dense
              outlined
              clearable
              placeholder="Buscar por nombre, descripción o departamento vinculado..."
            >
              <template #prepend><q-icon name="search" class="muted" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-auto text-caption muted">
            Haz clic en un departamento o en «Ver departamentos» para filtrar la estructura.
          </div>
        </div>
      </div>

      <!-- Estado de carga -->
      <div v-if="cargando && tiposPaginados.length === 0" class="tipos-grid q-pa-md">
        <div v-for="n in 3" :key="n" class="tipo-card tipo-card--skeleton">
          <q-skeleton type="rect" height="38px" class="q-mb-sm" />
          <q-skeleton type="text" class="q-mb-xs" />
          <q-skeleton type="text" width="75%" class="q-mb-md" />
          <q-skeleton type="rect" height="26px" />
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else-if="tiposPaginados.length === 0" class="q-pa-xl text-center">
        <q-icon name="account_tree" size="36px" class="muted q-mb-sm" />
        <div class="text-subtitle2 text-ink">
          No se encontraron tipos de departamento registrados
        </div>
        <div class="text-caption muted q-mt-xs">
          Prueba con otro término de búsqueda o crea un nuevo tipo de departamento.
        </div>
      </div>

      <!-- 🛡️ [FASE 3 - UI TIPO DEPARTAMENTOS] Opción 3: Tarjetas estructurales con Paleta A Mineral (sin borde coloreado ni ID) -->
      <div v-else class="tipos-grid q-pa-md">
        <article
          v-for="tipo in tiposPaginados"
          :key="tipo.id"
          class="tipo-card"
          :class="estiloDe(tipo).claseTono"
        >
          <div class="tipo-card__body">
            <div class="row items-start justify-between no-wrap q-gutter-x-sm">
              <div class="row items-center no-wrap q-gutter-x-sm min-w-0">
                <div class="tipo-card__icon-box" aria-hidden="true">
                  <TipoDepartamentoIcono :tono="estiloDe(tipo).tono" :size="17" />
                </div>
                <div class="min-w-0">
                  <h2 class="tipo-card__title text-ink">{{ tipo.nombre }}</h2>
                  <div class="q-mt-xs">
                    <TipoDepartamentoBadge
                      :nombre="tipo.nombre"
                      :id-tipo="tipo.id"
                      :etiqueta="estiloDe(tipo).alcance"
                      compacto
                      sin-icono
                    />
                  </div>
                </div>
              </div>

              <q-btn
                outline
                unelevated
                dense
                color="secondary"
                icon="edit"
                size="sm"
                aria-label="Editar tipo de departamento"
                class="btn-accion-icono shrink-0"
                @click="abrirModalEditar(tipo)"
              >
                <q-tooltip>Editar tipo de departamento</q-tooltip>
              </q-btn>
            </div>

            <p v-if="tipo.descripcion" class="tipo-card__desc q-mt-md q-mb-none">
              {{ tipo.descripcion }}
            </p>
            <p v-else class="tipo-card__desc tipo-card__desc--vacia q-mt-md q-mb-none">
              Sin descripción registrada. Edita este tipo para documentar su alcance operativo.
            </p>
          </div>

          <div class="tipo-card__footer">
            <div class="tipo-card__section-label tabular-nums">
              Departamentos vinculados ({{ departamentosPorTipo(tipo.id).length }})
            </div>

            <div
              v-if="departamentosPorTipo(tipo.id).length > 0"
              class="tipo-card__chips q-mt-xs"
            >
              <button
                v-for="depto in departamentosPorTipo(tipo.id)"
                :key="depto.id"
                type="button"
                class="depto-chip"
                @click="irADepartamentos(tipo.id, depto.codigo)"
              >
                <span class="depto-chip__code tabular-nums">{{ depto.codigo }}</span>
                <span class="depto-chip__sep">·</span>
                <span class="depto-chip__name">{{ depto.nombre }}</span>
                <q-tooltip>Ver {{ depto.nombre }} en Departamentos</q-tooltip>
              </button>
            </div>
            <div v-else class="text-caption muted q-mt-xs">
              Aún no hay departamentos asignados a este tipo.
            </div>

            <div class="row items-center justify-end q-mt-sm">
              <button
                type="button"
                class="tipo-card__link"
                @click="irADepartamentos(tipo.id)"
              >
                <span>Ver departamentos</span>
                <q-icon name="arrow_forward" size="14px" />
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Pie de paginación en 3 zonas consistente con el estándar aprobado -->
      <div class="tabla-footer-3zonas">
        <div class="footer-zona-izq row items-center q-gutter-x-xs">
          <span class="text-caption muted">Mostrar</span>
          <q-select
            v-model="filasPorPagina"
            :options="OPCIONES_FILAS_POR_PAGINA_TIPOS"
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

    <TipoDepartamentoFormDialog
      v-model:abierto="modalAbierto"
      :guardando="guardando"
      :error="errorFormulario"
      :tipo-editar="tipoEditando"
      @guardar="guardarTipoDepartamento"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import TipoDepartamentoFormDialog from '@/components/admin/TipoDepartamentoFormDialog.vue';
import TipoDepartamentoBadge from '@/components/common/TipoDepartamentoBadge.vue';
import TipoDepartamentoIcono from '@/components/common/TipoDepartamentoIcono.vue';
import {
  OPCIONES_FILAS_POR_PAGINA_TIPOS,
  useTipoDepartamentosView,
} from '@/composables/useTipoDepartamentosView';
import type { TipoDepartamentoItem } from '@/stores/useTipoDepartamentosStore';
import { resolverEstiloTipoDepartamento } from '@/utils/tipoDepartamentoEstilo';

const $q = useQuasar();
const {
  cargando,
  busqueda,
  filasPorPagina,
  paginaActual,
  totalPaginas,
  tiposPaginados,
  textoMostrando,
  modalAbierto,
  guardando,
  errorFormulario,
  tipoEditando,
  departamentosPorTipo,
  irADepartamentos,
  abrirModalCrear,
  abrirModalEditar,
  guardarTipoDepartamento,
} = useTipoDepartamentosView();

function estiloDe(tipo: TipoDepartamentoItem) {
  return resolverEstiloTipoDepartamento(tipo.nombre, tipo.id);
}
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

.tipos-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.tipo-card {
  background: var(--td-card-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:hover {
    border-color: var(--border-strong);
  }

  &--skeleton {
    background: var(--surface-subtle);
  }

  &__icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--td-tag-bg);
    border: 1px solid var(--td-border);
    color: var(--td-ink);
  }

  &__title {
    margin: 0;
    font-size: 0.94rem;
    font-weight: 700;
    line-height: 1.3;
    word-break: break-word;
  }

  &__desc {
    font-size: 0.8rem;
    line-height: 1.55;
    color: var(--text-secondary);
    word-break: break-word;

    &--vacia {
      color: var(--text-muted);
      font-style: italic;
    }
  }

  &__footer {
    border-top: 1px solid var(--border-subtle);
    padding-top: 12px;
  }

  &__section-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--td-ink);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 140ms ease;

    &:hover {
      background: var(--td-tag-bg);
    }
  }
}

.depto-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  font-size: 0.71rem;
  font-weight: 600;
  background: var(--surface-card);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: border-color 140ms ease, color 140ms ease, background-color 140ms ease;

  &:hover {
    border-color: var(--td-border);
    background: var(--td-tag-bg);
    color: var(--td-ink);
  }

  &__code {
    opacity: 0.75;
    flex-shrink: 0;
  }

  &__sep {
    opacity: 0.5;
    flex-shrink: 0;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.min-w-0 {
  min-width: 0;
}

.shrink-0 {
  flex-shrink: 0;
}

.btn-accion-icono {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-card);
}

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

@media (max-width: 1079px) {
  .tipos-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .tipos-grid {
    grid-template-columns: 1fr;
  }

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
