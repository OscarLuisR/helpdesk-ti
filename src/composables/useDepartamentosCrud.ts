import { computed, onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import type { DepartamentoMaestro, PayloadDepartamentoMaestro } from '@/models/catalogos';
import { useCatalogosStore } from '@/stores/catalogosStore';

export const COLUMNAS_DEPARTAMENTOS: QTableColumn<DepartamentoMaestro>[] = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
  { name: 'nombre', label: 'Departamento / Gerencia', field: 'nombre', align: 'left', sortable: true },
  { name: 'responsable', label: 'Responsable', field: 'responsable', align: 'left', sortable: true },
  { name: 'extensionTelefonica', label: 'Extensión', field: 'extensionTelefonica', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left', sortable: true },
  { name: 'acciones', label: '', field: 'id', align: 'right' },
];

export function useDepartamentosCrud() {
  const catalogosStore = useCatalogosStore();

  const busqueda = ref('');
  const soloActivos = ref(false);
  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const departamentoEditando = ref<DepartamentoMaestro | null>(null);

  onMounted(() => {
    void catalogosStore.cargarDepartamentos();
  });

  const departamentosFiltrados = computed<DepartamentoMaestro[]>(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return catalogosStore.departamentos.filter((d) => {
      const coincideEstado = !soloActivos.value || d.activo;
      const coincideTexto =
        !q ||
        [d.codigo, d.nombre, d.responsable, d.ubicacion, d.extensionTelefonica].some((v) =>
          v.toLowerCase().includes(q),
        );
      return coincideEstado && coincideTexto;
    });
  });

  function abrirModalCrear(): void {
    departamentoEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(depto: DepartamentoMaestro): void {
    departamentoEditando.value = { ...depto };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  async function guardarDepartamento(payload: PayloadDepartamentoMaestro): Promise<boolean> {
    if (guardando.value) return false;
    errorFormulario.value = null;
    guardando.value = true;

    try {
      if (departamentoEditando.value) {
        await catalogosStore.actualizarDepartamento(departamentoEditando.value.id, payload);
      } else {
        await catalogosStore.crearDepartamento(payload);
      }
      modalAbierto.value = false;
      return true;
    } catch (err) {
      errorFormulario.value =
        err instanceof Error ? err.message : 'No fue posible guardar el departamento.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  function cambiarEstado(depto: DepartamentoMaestro): void {
    void catalogosStore.alternarEstadoDepartamento(depto.id);
  }

  return {
    busqueda,
    soloActivos,
    modalAbierto,
    guardando,
    errorFormulario,
    departamentoEditando,
    departamentosFiltrados,
    abrirModalCrear,
    abrirModalEditar,
    guardarDepartamento,
    cambiarEstado,
  };
}

