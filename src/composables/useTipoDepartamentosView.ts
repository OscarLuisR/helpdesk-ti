import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useDepartmentsStore, type Department } from '@/stores/useDepartmentsStore';
import {
  useTipoDepartamentosStore,
  type TipoDepartamentoFormPayload,
  type TipoDepartamentoItem,
} from '@/stores/useTipoDepartamentosStore';

export const OPCIONES_FILAS_POR_PAGINA_TIPOS: number[] = [3, 6, 9, 12];

export function useTipoDepartamentosView() {
  const $q = useQuasar();
  const router = useRouter();
  const store = useTipoDepartamentosStore();
  const departmentsStore = useDepartmentsStore();

  const busqueda = ref('');
  const filasPorPagina = ref<number>(6);
  const paginaActual = ref<number>(1);

  const modalAbierto = ref(false);
  const guardando = ref(false);
  const errorFormulario = ref<string | null>(null);
  const tipoEditando = ref<TipoDepartamentoItem | null>(null);

  const cargando = computed(() => store.cargando);

  const mapaDepartamentosPorTipo = computed(() => {
    const mapa = new Map<number, Department[]>();
    for (const depto of departmentsStore.departments) {
      const lista = mapa.get(depto.id_tipo_departamento) ?? [];
      lista.push(depto);
      mapa.set(depto.id_tipo_departamento, lista);
    }
    return mapa;
  });

  function departamentosPorTipo(idTipo: number): Department[] {
    return mapaDepartamentosPorTipo.value.get(idTipo) ?? [];
  }

  const tiposFiltrados = computed(() => {
    const q = (busqueda.value ?? '').trim().toLowerCase();
    return store.tiposDepartamento.filter((t) => {
      if (!q) return true;
      const deptos = departamentosPorTipo(t.id);
      const camposDepto = deptos.flatMap((d) => [d.codigo, d.nombre]);
      return [t.nombre, t.descripcion, ...camposDepto].some((txt) =>
        txt.toLowerCase().includes(q),
      );
    });
  });

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(tiposFiltrados.value.length / filasPorPagina.value)),
  );

  const tiposPaginados = computed(() => {
    const inicio = (paginaActual.value - 1) * filasPorPagina.value;
    return tiposFiltrados.value.slice(inicio, inicio + filasPorPagina.value);
  });

  const textoMostrando = computed(() => {
    const total = tiposFiltrados.value.length;
    if (total === 0) return 'Mostrando 0 de 0 tipos de departamento';
    const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
    const fin = Math.min(paginaActual.value * filasPorPagina.value, total);
    return `Mostrando ${inicio}–${fin} de ${total} tipos de departamento`;
  });

  watch([busqueda, filasPorPagina], () => {
    paginaActual.value = 1;
  });

  watch(totalPaginas, (nuevoMax) => {
    if (paginaActual.value > nuevoMax) {
      paginaActual.value = nuevoMax;
    }
  });

  async function recargarTipos(): Promise<void> {
    try {
      await Promise.all([
        store.cargarTiposDepartamento(),
        departmentsStore.cargarDepartamentos(),
      ]);
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message:
          err instanceof Error ? err.message : 'No fue posible cargar los tipos de departamento.',
        timeout: 3000,
      });
    }
  }

  onMounted(() => {
    void recargarTipos();
  });

  function abrirModalCrear(): void {
    tipoEditando.value = null;
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function abrirModalEditar(tipo: TipoDepartamentoItem): void {
    tipoEditando.value = { ...tipo };
    errorFormulario.value = null;
    modalAbierto.value = true;
  }

  function irADepartamentos(idTipo: number, codigoDepto?: string): void {
    const query: Record<string, string> = { tipo: String(idTipo) };
    if (codigoDepto) {
      query.q = codigoDepto;
    }
    void router.push({ path: '/admin/departamentos', query });
  }

  async function guardarTipoDepartamento(
    payload: TipoDepartamentoFormPayload,
  ): Promise<boolean> {
    if (guardando.value) return false;
    guardando.value = true;
    errorFormulario.value = null;

    try {
      if (tipoEditando.value) {
        await store.actualizarTipoDepartamento(tipoEditando.value.id, payload);
        $q.notify({
          type: 'positive',
          message: 'Tipo de departamento actualizado con éxito.',
          timeout: 2500,
        });
      } else {
        await store.crearTipoDepartamento(payload);
        $q.notify({
          type: 'positive',
          message: 'Tipo de departamento creado con éxito.',
          timeout: 2500,
        });
      }
      modalAbierto.value = false;
      return true;
    } catch (err: unknown) {
      errorFormulario.value =
        err instanceof Error
          ? err.message
          : 'Error inesperado al guardar el tipo de departamento.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  return {
    cargando,
    busqueda,
    filasPorPagina,
    paginaActual,
    totalPaginas,
    tiposFiltrados,
    tiposPaginados,
    textoMostrando,
    modalAbierto,
    guardando,
    errorFormulario,
    tipoEditando,
    departamentosPorTipo,
    irADepartamentos,
    recargarTipos,
    abrirModalCrear,
    abrirModalEditar,
    guardarTipoDepartamento,
  };
}
