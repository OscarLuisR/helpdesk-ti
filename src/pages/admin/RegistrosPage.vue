<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-lg">
      <h1 class="text-h4 q-ma-none">Registros</h1>
      <q-btn color="primary" icon="add" label="Nuevo" unelevated no-caps />
    </div>

    <q-card flat bordered class="card">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-4">
          <q-input v-model="filter" dense outlined placeholder="Buscar">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <q-space />
        <div class="col-12 col-sm-2">
          <q-select v-model="status" :options="['Todos', 'Activo', 'Pendiente', 'Rechazado']" dense outlined />
        </div>
      </div>

      <q-table
        flat
        :rows="filtered"
        :columns="columns"
        row-key="id"
        :pagination="{ rowsPerPage: 8 }"
        class="table-pro"
      >
        <template #body-cell-estado="props">
          <q-td :props="props">
            <span class="chip" :class="chipClass(props.value)">{{ props.value }}</span>
          </q-td>
        </template>
        <template #body-cell-acciones>
          <q-td auto-width>
            <q-btn flat round dense icon="edit" size="sm" color="grey-7" />
            <q-btn flat round dense icon="delete_outline" size="sm" color="grey-7" />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { QTableColumn } from 'quasar';

const filter = ref('');
const status = ref('Todos');

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'fecha', label: 'Fecha', field: 'fecha', align: 'left', sortable: true },
  { name: 'monto', label: 'Monto', field: 'monto', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'id', align: 'left' },
];

const rows = [
  { id: 1, nombre: 'Jorian Namlen', email: 'jorian@mail.com', fecha: '09/10/2022', monto: '$150.00', estado: 'Activo' },
  { id: 2, nombre: 'Amam Bullan', email: 'amam@mail.com', fecha: '09/10/2022', monto: '$160.00', estado: 'Pendiente' },
  { id: 3, nombre: 'Maria Lopez', email: 'maria@mail.com', fecha: '09/10/2022', monto: '$100.00', estado: 'Pendiente' },
  { id: 4, nombre: 'Ameer Bullan', email: 'ameer@mail.com', fecha: '09/10/2022', monto: '$160.00', estado: 'Pendiente' },
  { id: 5, nombre: 'Ranah Honto', email: 'ranah@mail.com', fecha: '09/10/2022', monto: '$210.00', estado: 'Rechazado' },
  { id: 6, nombre: 'Jose Perez', email: 'jose@mail.com', fecha: '09/10/2022', monto: '$100.00', estado: 'Rechazado' },
  { id: 7, nombre: 'Ana Ruiz', email: 'ana@mail.com', fecha: '09/10/2022', monto: '$200.00', estado: 'Rechazado' },
  { id: 8, nombre: 'Luis Hamlen', email: 'luis@mail.com', fecha: '09/10/2022', monto: '$160.00', estado: 'Activo' },
];

const filtered = computed(() =>
  rows.filter(
    (r) =>
      (status.value === 'Todos' || r.estado === status.value) &&
      (r.nombre + r.email).toLowerCase().includes(filter.value.toLowerCase()),
  ),
);

function chipClass(estado: string) {
  return { Activo: 'ok', Pendiente: 'warn', Rechazado: 'bad' }[estado] ?? '';
}
</script>
