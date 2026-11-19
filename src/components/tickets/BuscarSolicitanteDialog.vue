<!-- 🛡️ [FASE 3.1 - SOLICITANTES] Modal responsivo de búsqueda y selección de solicitantes -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <q-card flat bordered class="solicitante-dialog-card">
      <q-card-section class="row items-center justify-between dialog-header q-pa-md">
        <div class="row items-center q-gutter-x-sm">
          <q-icon name="person_search" color="primary" size="22px" />
          <span class="text-subtitle1 text-weight-bold text-dark">Buscar Solicitante</span>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-7"
          aria-label="Cerrar buscador"
          @click="cerrarModal"
        />
      </q-card-section>

      <q-card-section class="q-pa-md q-gutter-y-md">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-sm">
            <q-input
              v-model="terminoBusqueda"
              outlined
              dense
              clearable
              autofocus
              debounce="250"
              placeholder="Buscar por nombre o teléfono..."
              @keyup.enter="consultarSolicitantes"
            >
              <template #prepend>
                <q-icon name="search" color="grey-6" />
              </template>
            </q-input>
          </div>
          <div v-if="idDepartamentoInicial" class="col-12 col-sm-auto">
            <q-btn
              :outline="!filtrarPorDepartamento"
              :unelevated="filtrarPorDepartamento"
              no-caps
              dense
              color="primary"
              class="full-width q-px-sm"
              style="height: 40px"
              :label="filtrarPorDepartamento ? 'Solo dpto. elegido' : 'Todos los dptos.'"
              @click="alternarFiltroDepartamento"
            />
          </div>
        </div>

        <div v-if="errorBusqueda" class="form-error q-pa-sm rounded-borders">
          {{ errorBusqueda }}
        </div>

        <q-table
          flat
          bordered
          class="modern-table tabla-solicitantes"
          :rows="resultados"
          :columns="columnas"
          row-key="id"
          :loading="cargando"
          :grid="$q.screen.lt.sm"
          :pagination="{ rowsPerPage: 6 }"
          rows-per-page-label="Por página"
          no-data-label="No se encontraron coincidencias"
        >
          <template #item="props">
            <div class="col-12 q-pa-xs">
              <q-card
                flat
                bordered
                class="q-pa-sm cursor-pointer solicitante-card-mobile"
                @click="seleccionarSolicitante(props.row)"
              >
                <div class="row items-center justify-between no-wrap q-gutter-x-sm">
                  <div class="col">
                    <div class="text-weight-bold text-dark">{{ props.row.nombre_completo }}</div>
                    <div class="text-caption muted">
                      {{ props.row.telefono }} · {{ props.row.departamento }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      unelevated
                      no-caps
                      dense
                      color="primary"
                      label="Seleccionar"
                      class="q-px-sm"
                      @click.stop="seleccionarSolicitante(props.row)"
                    />
                  </div>
                </div>
              </q-card>
            </div>
          </template>

          <template #body="props">
            <q-tr
              :props="props"
              class="cursor-pointer solicitante-row"
              @click="seleccionarSolicitante(props.row)"
            >
              <q-td key="nombre_completo" :props="props" class="text-weight-medium text-dark">
                {{ props.row.nombre_completo }}
              </q-td>
              <q-td key="telefono" :props="props" class="text-dark">
                {{ props.row.telefono }}
              </q-td>
              <q-td key="departamento" :props="props" class="muted">
                {{ props.row.departamento }}
              </q-td>
              <q-td key="accion" :props="props" class="text-right">
                <q-btn
                  unelevated
                  no-caps
                  dense
                  color="primary"
                  label="Seleccionar"
                  class="q-px-sm"
                  @click.stop="seleccionarSolicitante(props.row)"
                />
              </q-td>
            </q-tr>
          </template>

          <template #no-data>
            <div class="full-width text-center q-pa-md muted text-body2">
              <q-icon name="person_off" size="24px" class="q-mb-xs block q-mx-auto" />
              <template v-if="requiereMinimoCaracteresGlobal">
                Escribe al menos <strong>2 caracteres</strong> para buscar en todos los
                departamentos.
              </template>
              <template v-else>
                No se encontraron coincidencias. Cierra esta ventana y al registrar el ticket se
                guardará automáticamente con los datos escritos.
              </template>
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="between" class="q-px-md q-pb-md q-pt-none">
        <span class="text-caption muted">
          Si no existe coincidencia, cierra este modal y se registrará como nuevo solicitante.
        </span>
        <q-btn flat no-caps color="grey-7" label="Cerrar" @click="cerrarModal" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { QTableColumn } from 'quasar';
import type { SolicitanteItem } from '@/models/types';
import { useTicketStore } from '@/stores/ticketStore';

const props = defineProps<{
  modelValue: boolean;
  textoInicial?: string;
  idDepartamentoInicial?: number | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [val: boolean];
  seleccionar: [solicitante: SolicitanteItem];
}>();

const ticketStore = useTicketStore();

const terminoBusqueda = ref('');
const filtrarPorDepartamento = ref(true);
const resultados = ref<SolicitanteItem[]>([]);
const cargando = ref(false);
const errorBusqueda = ref<string | null>(null);

// 🛡️ [FASE 3.2 - SOLICITANTES] Evitar consultas globales pesadas sin texto mínimo
const requiereMinimoCaracteresGlobal = computed(
  () => !filtrarPorDepartamento.value && terminoBusqueda.value.trim().length < 2,
);

const columnas: QTableColumn<SolicitanteItem>[] = [
  {
    name: 'nombre_completo',
    label: 'Nombre Completo',
    field: 'nombre_completo',
    align: 'left',
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    field: 'telefono',
    align: 'left',
  },
  {
    name: 'departamento',
    label: 'Departamento',
    field: 'departamento',
    align: 'left',
  },
  {
    name: 'accion',
    label: '',
    field: 'id',
    align: 'right',
  },
];

async function consultarSolicitantes(): Promise<void> {
  if (requiereMinimoCaracteresGlobal.value) {
    resultados.value = [];
    errorBusqueda.value = null;
    return;
  }

  cargando.value = true;
  errorBusqueda.value = null;
  try {
    const idDpto =
      filtrarPorDepartamento.value && props.idDepartamentoInicial
        ? props.idDepartamentoInicial
        : undefined;
    resultados.value = await ticketStore.buscarSolicitantes(terminoBusqueda.value, idDpto);
  } catch (err: unknown) {
    resultados.value = [];
    errorBusqueda.value =
      err instanceof Error ? err.message : 'No fue posible buscar solicitantes.';
  } finally {
    cargando.value = false;
  }
}

function alternarFiltroDepartamento(): void {
  filtrarPorDepartamento.value = !filtrarPorDepartamento.value;
  void consultarSolicitantes();
}

function seleccionarSolicitante(solicitante: SolicitanteItem): void {
  emit('seleccionar', solicitante);
  emit('update:modelValue', false);
}

function cerrarModal(): void {
  emit('update:modelValue', false);
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      terminoBusqueda.value = props.textoInicial?.trim() ?? '';
      // 🛡️ [FASE 3.2 - SOLICITANTES] Iniciar filtrando estrictamente por el departamento seleccionado
      filtrarPorDepartamento.value = Boolean(props.idDepartamentoInicial);
      void consultarSolicitantes();
    }
  },
);

watch(terminoBusqueda, () => {
  if (props.modelValue) {
    void consultarSolicitantes();
  }
});
</script>

<style scoped lang="scss">
.solicitante-dialog-card {
  width: 100%;
  max-width: 680px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  overflow: hidden;
}

.tabla-solicitantes {
  border-color: var(--border-subtle);
  border-radius: var(--radius-sm);
}

.solicitante-row:hover {
  background: var(--surface-hover);
}

.solicitante-card-mobile:hover {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}
</style>
