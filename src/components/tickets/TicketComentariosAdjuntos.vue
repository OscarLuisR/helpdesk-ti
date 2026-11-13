<!-- 🛡️ [FASE 2.4 - TICKETS] Chat de comentarios (públicos vs notas internas TI) y gestión de adjuntos -->
<template>
  <div>
    <div v-if="errorSeccion" class="form-error q-pa-sm rounded-borders q-mb-sm">
      {{ errorSeccion }}
    </div>

    <!-- SECCIÓN COMENTARIOS -->
    <template v-if="seccion === 'comentarios'">
      <div class="row items-center justify-between q-mb-sm">
        <span class="text-caption text-weight-bold text-uppercase muted">
          Conversación y Notas del Ticket
        </span>
        <q-spinner v-if="cargando" color="primary" size="18px" />
      </div>

      <div v-if="!cargando && !comentarios.length" class="info-vacio q-pa-md q-mb-md muted">
        Aún no hay comentarios registrados en este ticket.
      </div>

      <div v-else class="chat-lista q-gutter-y-sm q-mb-md">
        <div
          v-for="item in comentarios"
          :key="item.id"
          class="chat-burbuja q-pa-sm"
          :class="item.es_interno ? 'nota-interna' : 'nota-publica'"
        >
          <div class="row items-center justify-between q-gutter-x-sm q-mb-xs">
            <div class="row items-center q-gutter-xs">
              <span class="text-weight-bold text-dark">{{ item.usuario_autor }}</span>
              <span class="text-caption muted">({{ item.rol_autor }})</span>
              <span v-if="item.es_interno" class="chip warn">
                <q-icon name="lock" size="12px" />
                Nota Interna TI
              </span>
            </div>
            <span class="text-caption muted">{{ formatearFecha(item.fecha_creacion) }}</span>
          </div>
          <div class="text-body2 text-dark whitespace-preline">{{ item.mensaje }}</div>
        </div>
      </div>

      <div v-if="estaCerrado" class="info-vacio q-pa-sm muted">
        Este ticket se encuentra <strong>Cerrado</strong>; el chat es de solo lectura.
      </div>

      <q-form v-else class="composer-box q-pa-sm q-gutter-y-sm" @submit.prevent="enviarComentario">
        <q-input
          v-model="mensajeNuevo"
          outlined
          dense
          type="textarea"
          rows="2"
          maxlength="2000"
          counter
          placeholder="Escribe una actualización, consulta o nota técnica..."
        />
        <div class="row items-center justify-between">
          <div>
            <q-toggle
              v-if="puedeCrearNotaInterna"
              v-model="esNotaInterna"
              dense
              color="warning"
              label="Nota interna (solo visible para personal TI)"
            />
          </div>
          <q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            icon="send"
            label="Enviar comentario"
            :loading="ticketStore.guardando"
            :disable="!mensajeNuevo.trim()"
          />
        </div>
      </q-form>
    </template>

    <!-- SECCIÓN ADJUNTOS -->
    <template v-else>
      <div class="row items-center justify-between q-mb-sm">
        <span class="text-caption text-weight-bold text-uppercase muted">
          Evidencias y Archivos Adjuntos
        </span>
        <q-spinner v-if="cargando" color="primary" size="18px" />
      </div>

      <div v-if="!estaCerrado" class="composer-box q-pa-sm q-mb-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-sm">
            <q-file
              v-model="archivoSeleccionado"
              outlined
              dense
              clearable
              accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
              :max-file-size="5242880"
              label="Seleccionar captura o archivo (PNG, JPG, WEBP, PDF, TXT · máx. 5 MB)"
              @rejected="onArchivoRechazado"
            >
              <template #prepend>
                <q-icon name="attach_file" color="grey-7" />
              </template>
            </q-file>
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="cloud_upload"
              label="Subir Evidencia"
              class="full-width"
              :loading="ticketStore.guardando"
              :disable="!archivoSeleccionado"
              @click="subirArchivo"
            />
          </div>
        </div>
      </div>

      <div v-else class="info-vacio q-pa-sm q-mb-md muted">
        Este ticket se encuentra <strong>Cerrado</strong>; no admite nuevos adjuntos.
      </div>

      <div v-if="!cargando && !adjuntos.length" class="info-vacio q-pa-md muted">
        No hay evidencias adjuntas en este ticket.
      </div>

      <q-list v-else bordered separator class="rounded-borders">
        <q-item v-for="adj in adjuntos" :key="adj.id" class="q-py-sm">
          <q-item-section avatar>
            <q-icon :name="iconoArchivo(adj.nombre_archivo)" color="primary" size="26px" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium text-dark">
              {{ adj.nombre_archivo }}
            </q-item-label>
            <q-item-label caption>
              {{ adj.peso_kb ?? 0 }} KB · Subido por {{ adj.usuario_sube }} ·
              {{ formatearFecha(adj.fecha_subida) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-xs">
              <q-btn
                v-if="esImagen(adj.nombre_archivo)"
                flat
                dense
                no-caps
                color="primary"
                icon="visibility"
                label="Ver"
                :loading="descargandoId === adj.id"
                @click="verImagen(adj)"
              />
              <q-btn
                flat
                dense
                no-caps
                color="secondary"
                icon="download"
                label="Descargar"
                :loading="descargandoId === adj.id"
                @click="descargarArchivo(adj)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Visor modal autenticado para capturas -->
      <q-dialog v-model="previewAbierto" @hide="cerrarPreview">
        <q-card class="preview-card">
          <q-card-section class="row items-center justify-between dialog-header q-pa-sm">
            <span class="text-subtitle2 text-weight-bold text-dark">{{ previewNombre }}</span>
            <q-btn flat round dense icon="close" color="grey-7" @click="previewAbierto = false" />
          </q-card-section>
          <q-card-section class="q-pa-md flex flex-center">
            <img v-if="previewUrl" :src="previewUrl" :alt="previewNombre" class="preview-img" />
          </q-card-section>
        </q-card>
      </q-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useQuasar, type QRejectedEntry } from 'quasar';
import type { EstadoTicket, TicketAdjuntoItem, TicketComentarioItem } from '@/models/types';
import { useAuthStore } from '@/stores/authStore';
import { useTicketStore } from '@/stores/ticketStore';

const props = defineProps<{
  ticketId: number;
  ticketEstado: EstadoTicket;
  seccion: 'comentarios' | 'adjuntos';
}>();

const $q = useQuasar();
const authStore = useAuthStore();
const ticketStore = useTicketStore();

const cargando = ref(false);
const errorSeccion = ref<string | null>(null);

const comentarios = ref<TicketComentarioItem[]>([]);
const mensajeNuevo = ref('');
const esNotaInterna = ref(false);

const adjuntos = ref<TicketAdjuntoItem[]>([]);
const archivoSeleccionado = ref<File | null>(null);
const descargandoId = ref<number | null>(null);

const previewAbierto = ref(false);
const previewUrl = ref<string | null>(null);
const previewNombre = ref('');

const estaCerrado = computed(() => props.ticketEstado === 'Cerrado');
const puedeCrearNotaInterna = computed(() => authStore.role !== 'USUARIO');

async function cargarContenido(): Promise<void> {
  if (!props.ticketId) return;
  cargando.value = true;
  errorSeccion.value = null;

  try {
    if (props.seccion === 'comentarios') {
      comentarios.value = await ticketStore.cargarComentarios(props.ticketId);
    } else {
      adjuntos.value = await ticketStore.cargarAdjuntos(props.ticketId);
    }
  } catch (err: unknown) {
    errorSeccion.value =
      err instanceof Error ? err.message : 'No fue posible cargar la información.';
  } finally {
    cargando.value = false;
  }
}

watch(
  () => [props.ticketId, props.seccion] as const,
  () => {
    void cargarContenido();
  },
  { immediate: true },
);

async function enviarComentario(): Promise<void> {
  const texto = mensajeNuevo.value.trim();
  if (!texto) return;

  errorSeccion.value = null;
  try {
    await ticketStore.crearComentario(props.ticketId, {
      mensaje: texto,
      es_interno: puedeCrearNotaInterna.value ? esNotaInterna.value : false,
    });
    mensajeNuevo.value = '';
    esNotaInterna.value = false;
    await cargarContenido();
  } catch (err: unknown) {
    errorSeccion.value =
      err instanceof Error ? err.message : 'No fue posible registrar el comentario.';
  }
}

function onArchivoRechazado(entradas: QRejectedEntry[]): void {
  const motivo = entradas[0]?.failedPropValidation;
  const mensaje =
    motivo === 'max-file-size'
      ? 'El archivo supera el límite máximo de 5 MB.'
      : 'Formato no permitido. Usa PNG, JPG, WEBP, PDF o TXT.';

  $q.notify({
    type: 'warning',
    message: mensaje,
    position: 'top-right',
  });
}

async function subirArchivo(): Promise<void> {
  if (!archivoSeleccionado.value) return;
  errorSeccion.value = null;

  try {
    await ticketStore.subirAdjunto(props.ticketId, archivoSeleccionado.value);
    archivoSeleccionado.value = null;
    $q.notify({
      type: 'positive',
      message: 'Evidencia adjuntada correctamente.',
      position: 'top-right',
    });
    await cargarContenido();
  } catch (err: unknown) {
    errorSeccion.value =
      err instanceof Error ? err.message : 'No fue posible subir el archivo adjunto.';
  }
}

function esImagen(nombre: string): boolean {
  return /\.(png|jpe?g|webp)$/i.test(nombre);
}

function iconoArchivo(nombre: string): string {
  if (esImagen(nombre)) return 'image';
  if (/\.pdf$/i.test(nombre)) return 'picture_as_pdf';
  return 'description';
}

function cerrarPreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
}

async function verImagen(adj: TicketAdjuntoItem): Promise<void> {
  descargandoId.value = adj.id;
  errorSeccion.value = null;
  try {
    const blob = await ticketStore.obtenerBlobAdjunto(props.ticketId, adj.id);
    cerrarPreview();
    previewUrl.value = URL.createObjectURL(blob);
    previewNombre.value = adj.nombre_archivo;
    previewAbierto.value = true;
  } catch (err: unknown) {
    errorSeccion.value =
      err instanceof Error ? err.message : 'No fue posible cargar la vista previa.';
  } finally {
    descargandoId.value = null;
  }
}

async function descargarArchivo(adj: TicketAdjuntoItem): Promise<void> {
  descargandoId.value = adj.id;
  errorSeccion.value = null;
  try {
    const blob = await ticketStore.obtenerBlobAdjunto(props.ticketId, adj.id);
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = adj.nombre_archivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  } catch (err: unknown) {
    errorSeccion.value =
      err instanceof Error ? err.message : 'No fue posible descargar el archivo.';
  } finally {
    descargandoId.value = null;
  }
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
}

onUnmounted(() => {
  cerrarPreview();
});
</script>

<style scoped lang="scss">
.info-vacio {
  background: var(--bg);
  border: 1px dashed var(--border);
  border-radius: 8px;
  font-size: 0.86rem;
}

.chat-lista {
  max-height: 290px;
  overflow-y: auto;
}

.chat-burbuja {
  border-radius: 8px;
  border: 1px solid var(--border);
}

.nota-publica {
  background: var(--surface);
}

.nota-interna {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(217, 119, 6, 0.35);
}

.composer-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.whitespace-preline {
  white-space: pre-line;
}

.preview-card {
  width: 100%;
  max-width: 720px;
  border-radius: var(--radius);
}

.preview-img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 6px;
}
</style>
