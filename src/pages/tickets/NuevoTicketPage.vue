<!-- 🛡️ [FASE 2.3 - TICKETS] Formulario de creación de tickets con auto-cálculo dinámico de prioridad y área TI -->
<template>
  <q-page class="q-pa-md q-pa-sm-lg nuevo-ticket-page">
    <div class="row items-end justify-between q-gutter-y-sm q-mb-lg">
      <div class="col-12 col-sm min-w-0">
        <span class="page-eyebrow">
          <q-icon name="add_box" size="14px" />
          Operación · Registro
        </span>
        <h1 class="page-title">Registrar Nuevo Ticket</h1>
        <p class="page-subtitle">
          Registro de incidencias con cálculo automático de prioridad SLA y área TI.
        </p>
      </div>
      <div class="col-12 col-sm-auto row items-center q-gutter-sm shrink-0">
        <q-btn
          outline
          unelevated
          no-caps
          color="secondary"
          icon="inbox"
          label="Ir a Recepción"
          :class="{ 'col-grow': $q.screen.xs }"
          to="/tickets/recepcion"
        />
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Formulario principal -->
      <div class="col-12 col-lg-8">
        <q-card flat bordered class="card">
          <h2 class="card-title">Datos de la Incidencia</h2>

          <div v-if="errorFormulario" class="form-error q-pa-sm rounded-borders q-mb-md">
            {{ errorFormulario }}
          </div>

          <q-banner
            v-if="advertenciaAdjuntos"
            dense
            rounded
            class="form-warning q-mb-md"
            role="alert"
          >
            <template #avatar>
              <q-icon name="warning_amber" color="warning" size="24px" />
            </template>
            <div class="text-weight-bold text-dark">
              Ticket {{ advertenciaAdjuntos.folio }} creado con advertencia en adjuntos
            </div>
            <div class="text-caption text-dark q-mt-xs">
              El ticket se registró correctamente
              <template v-if="advertenciaAdjuntos.exitosas > 0">
                ({{ advertenciaAdjuntos.exitosas }} de {{ advertenciaAdjuntos.totalIntentadas }}
                imágenes subidas),
              </template>
              pero no se {{ advertenciaAdjuntos.fallidas.length === 1 ? 'pudo subir la imagen' : 'pudieron subir las imágenes' }}:
            </div>
            <ul class="q-my-xs q-pl-md text-caption text-dark">
              <li v-for="errImg in advertenciaAdjuntos.fallidas" :key="errImg.nombre">
                <strong>{{ errImg.nombre }}:</strong> {{ errImg.motivo }}
              </li>
            </ul>
            <div class="text-caption text-dark">
              Puedes cargar {{ advertenciaAdjuntos.fallidas.length === 1 ? 'la imagen pendiente' : 'las imágenes pendientes' }} desde el módulo de <strong>Adjuntos</strong> del ticket.
            </div>
            <template #action>
              <q-btn
                flat
                no-caps
                color="primary"
                icon="attach_file"
                label="Ir a Adjuntos del ticket"
                :to="{
                  path: '/tickets/recepcion',
                  query: { folio: advertenciaAdjuntos.folio, tab: 'adjuntos' },
                }"
              />
              <q-btn
                flat
                round
                dense
                icon="close"
                color="grey-7"
                aria-label="Cerrar advertencia"
                @click="advertenciaAdjuntos = null"
              />
            </template>
          </q-banner>

          <q-form
            ref="formRef"
            class="q-gutter-y-md"
            @submit.prevent="enviarFormulario"
            @paste="alPegarImagen"
          >
            <div>
              <label class="field-label">Departamento Solicitante *</label>
              <q-select
                v-model="form.id_departamento_solicitante"
                :options="opcionesDepartamentosFiltradas"
                option-value="id"
                option-label="nombre"
                emit-value
                map-options
                use-input
                input-debounce="150"
                outlined
                dense
                clearable
                :loading="departmentsStore.cargando"
                placeholder="Buscar departamento solicitante..."
                :rules="[(v) => (v !== null && v > 0) || 'Selecciona el departamento solicitante.']"
                @filter="filtrarDepartamentos"
                @update:model-value="alCambiarDepartamentoSolicitante"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No se encontraron departamentos activos
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- 🛡️ [FASE 3.1 / 3.2 - SOLICITANTES] Fila adaptada con botón de búsqueda habilitado solo tras elegir departamento -->
            <div class="row q-col-gutter-md items-start">
              <div class="col-12 col-sm-6">
                <label class="field-label">Nombre del Solicitante *</label>
                <q-input
                  v-model="form.solicitante_nombre"
                  outlined
                  dense
                  maxlength="100"
                  placeholder="Ej. Ana Valencia"
                  :rules="[
                    (v: string) =>
                      (v?.trim().length ?? 0) >= 3 ||
                      'Ingresa el nombre del solicitante (mín. 3 caracteres).',
                    (v: string) => (v?.trim().length ?? 0) <= 100 || 'Máximo 100 caracteres.',
                  ]"
                />
              </div>
              <div class="col-12 col-sm-auto">
                <label class="field-label gt-xs">&nbsp;</label>
                <q-btn
                  outline
                  no-caps
                  color="primary"
                  icon="search"
                  label="Buscar"
                  class="full-width btn-buscar-solicitante"
                  :disable="!form.id_departamento_solicitante"
                  @click="buscadorSolicitanteAbierto = true"
                >
                  <q-tooltip>
                    {{
                      form.id_departamento_solicitante
                        ? 'Buscar solicitante registrado en este departamento'
                        : 'Selecciona primero un departamento solicitante'
                    }}
                  </q-tooltip>
                </q-btn>
              </div>
              <div class="col-12 col-sm">
                <label class="field-label">Teléfono de Contacto *</label>
                <q-input
                  v-model="form.solicitante_telefono"
                  outlined
                  dense
                  mask="####-#######"
                  placeholder="0412-1234567"
                  :rules="[validarTelefonoUsuario]"
                />
              </div>
            </div>

            <div>
              <label class="field-label">Incidencia del Catálogo *</label>
              <q-select
                v-model="form.id_catalogo"
                :options="opcionesCatalogoFiltradas"
                option-value="id"
                :option-label="(c) => `${c.nombre} (${c.departamento} · ${c.prioridad})`"
                emit-value
                map-options
                use-input
                input-debounce="150"
                outlined
                dense
                clearable
                :loading="catalogStore.cargando"
                placeholder="Buscar falla o requerimiento en el catálogo..."
                :rules="[(v) => (v !== null && v > 0) || 'Selecciona una incidencia del catálogo.']"
                @filter="filtrarCatalogo"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No se encontraron incidencias activas
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div>
              <label class="field-label">Descripción Detallada de la Incidencia *</label>
              <q-input
                v-model="form.descripcion_incidencia"
                outlined
                type="textarea"
                rows="5"
                maxlength="2000"
                counter
                placeholder="Describe el síntoma reportado, ubicación y mensajes de error observados..."
                :rules="[
                  (v) => (v && v.trim().length >= 10) || 'Ingresa al menos 10 caracteres.',
                  (v) => (v && v.trim().length <= 2000) || 'Máximo 2000 caracteres.',
                ]"
              />
            </div>

            <!-- 🛡️ [FASE 3.3 - TICKETS] Switch de Cierre Directo Nivel 1 en llamada inicial -->
            <div class="n1-panel q-pa-md">
              <div class="row items-center justify-between q-gutter-y-xs">
                <div>
                  <q-toggle
                    v-model="form.cierre_directo_n1"
                    color="positive"
                    label="Resuelto en Nivel 1 (Cierre Directo)"
                    class="text-weight-bold text-dark"
                    @update:model-value="alAlternarCierreDirectoN1"
                  />
                  <div class="text-caption muted q-pl-sm">
                    Activa esta opción si el caso se resolvió en la misma llamada inicial. El ticket se creará directamente en estado <strong>Cerrado</strong>.
                  </div>
                </div>
                <span v-if="form.cierre_directo_n1" class="chip ok">Cierre Atómico N1</span>
              </div>

              <div v-if="form.cierre_directo_n1" class="q-mt-md q-gutter-y-sm">
                <div>
                  <label class="field-label">Causa Raíz *</label>
                  <q-input
                    v-model="form.causa_raiz"
                    outlined
                    dense
                    type="textarea"
                    rows="2"
                    maxlength="2000"
                    counter
                    placeholder="Ej. Contraseña bloqueada por intentos fallidos o cable de video desconectado."
                    :rules="[
                      (v) =>
                        !form.cierre_directo_n1 ||
                        (v && v.trim().length >= 5) ||
                        'Ingresa la causa raíz (mín. 5 caracteres).',
                    ]"
                  />
                </div>
                <div>
                  <label class="field-label">Solución Aplicada *</label>
                  <q-input
                    v-model="form.solucion_aplicada"
                    outlined
                    dense
                    type="textarea"
                    rows="3"
                    maxlength="2000"
                    counter
                    placeholder="Ej. Se restableció contraseña en directorio activo y el usuario ingresó correctamente."
                    :rules="[
                      (v) =>
                        !form.cierre_directo_n1 ||
                        (v && v.trim().length >= 5) ||
                        'Documenta la solución aplicada (mín. 5 caracteres).',
                    ]"
                  />
                </div>
                <div>
                  <label class="field-label">Observación para bitácora (opcional)</label>
                  <q-input
                    v-model="form.comentario"
                    outlined
                    dense
                    maxlength="1000"
                    placeholder="Detalle adicional de la llamada (opcional)"
                  />
                </div>
                <q-checkbox
                  v-model="form.conformidad_usuario"
                  dense
                  color="positive"
                  label="El solicitante confirmó conformidad durante la llamada"
                />
              </div>
            </div>

            <!-- 🛡️ [FASE 3 - EVIDENCIAS EN APERTURA] Hasta 3 imágenes con validación de formato, peso y Magic Bytes -->
            <div v-if="!form.cierre_directo_n1">
              <div class="row items-center justify-between q-mb-xs">
                <label class="field-label q-mb-none">
                  Imágenes de Evidencia (Opcional · {{ imagenesAdjuntas.length }}/{{ maxImagenesPermitidas }})
                </label>
                <span class="text-caption muted">
                  PNG, JPG o WEBP · máx. {{ configuracionesStore.tamanoMaxAdjuntoMb }} MB c/u
                </span>
              </div>

              <input
                ref="inputImagenesRef"
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                class="hidden"
                @change="alSeleccionarArchivos"
              />

              <div
                class="dropzone-evidencia q-pa-md"
                :class="{
                  'dropzone-evidencia--activa': arrastrandoImagen,
                  'dropzone-evidencia--llena': imagenesAdjuntas.length >= maxImagenesPermitidas,
                }"
                @dragover.prevent="arrastrandoImagen = true"
                @dragleave.prevent="arrastrandoImagen = false"
                @drop.prevent="alSoltarArchivos"
              >
                <div class="row items-center justify-between q-col-gutter-sm">
                  <div class="col-12 col-sm row items-center no-wrap q-gutter-x-sm">
                    <q-icon name="add_photo_alternate" size="28px" color="primary" />
                    <div>
                      <div class="text-body2 text-weight-medium text-dark">
                        Arrastra imágenes aquí, selecciona archivos o pega una captura (Ctrl+V)
                      </div>
                      <div class="text-caption muted">
                        Útil para capturas enviadas por correo o WhatsApp al reportar la falla.
                      </div>
                    </div>
                  </div>
                  <div class="col-12 col-sm-auto">
                    <q-btn
                      outline
                      no-caps
                      color="primary"
                      icon="upload_file"
                      label="Seleccionar imágenes"
                      :disable="enviando || validandoImagenes || imagenesAdjuntas.length >= maxImagenesPermitidas"
                      :loading="validandoImagenes"
                      @click="abrirSelectorImagenes"
                    />
                  </div>
                </div>

                <div v-if="imagenesAdjuntas.length" class="row q-col-gutter-sm q-mt-sm">
                  <div
                    v-for="item in imagenesAdjuntas"
                    :key="item.idLocal"
                    class="col-12 col-sm-4"
                  >
                    <div class="preview-card-item">
                      <img :src="item.previewUrl" :alt="item.file.name" class="preview-thumb" />
                      <div class="preview-meta q-pa-xs">
                        <div class="text-caption text-weight-medium text-dark ellipsis">
                          {{ item.file.name }}
                          <q-tooltip>{{ item.file.name }}</q-tooltip>
                        </div>
                        <div class="row items-center justify-between q-mt-xs">
                          <span class="text-caption muted">
                            {{ formatearTamanoArchivo(item.file.size) }}
                          </span>
                          <span
                            class="chip"
                            :class="
                              item.estado === 'subiendo'
                                ? 'info'
                                : item.estado === 'subido'
                                  ? 'ok'
                                  : 'neutral'
                            "
                          >
                            {{
                              item.estado === 'subiendo'
                                ? 'Subiendo...'
                                : item.estado === 'subido'
                                  ? 'Subida'
                                  : 'Verificada'
                            }}
                          </span>
                        </div>
                      </div>
                      <q-btn
                        round
                        dense
                        unelevated
                        size="xs"
                        icon="close"
                        color="dark"
                        class="preview-remove-btn"
                        :disable="enviando"
                        aria-label="Quitar imagen"
                        @click="eliminarImagen(item.idLocal)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="row items-center justify-end q-gutter-sm q-pt-sm">
              <span v-if="textoProgresoSubida" class="text-caption muted q-mr-sm">
                {{ textoProgresoSubida }}
              </span>
              <q-btn
                flat
                no-caps
                color="grey-7"
                label="Limpiar"
                :disable="enviando || ticketStore.guardando"
                @click="limpiarFormulario"
              />
              <q-btn
                type="submit"
                unelevated
                no-caps
                :color="form.cierre_directo_n1 ? 'positive' : 'primary'"
                :icon="form.cierre_directo_n1 ? 'verified' : 'confirmation_number'"
                :label="form.cierre_directo_n1 ? 'Registrar y Cerrar en Nivel 1' : 'Registrar Ticket'"
                :loading="enviando || ticketStore.guardando"
                :disable="validandoImagenes"
              />
            </div>
          </q-form>
        </q-card>
      </div>

      <!-- Tarjeta lateral de cálculo automático SLA y Área TI -->
      <div class="col-12 col-lg-4">
        <q-card flat bordered class="card sla-card">
          <h2 class="card-title">Clasificación Automática (SLA)</h2>

          <div v-if="!incidenciaSeleccionada" class="text-body2 muted">
            Al elegir una incidencia del catálogo, el sistema calculará automáticamente su
            <strong>prioridad SLA</strong>, tiempos meta y <strong>área TI responsable</strong>.
          </div>

          <div v-else class="q-gutter-y-md">
            <div class="sla-row q-pa-sm">
              <div class="text-caption muted text-uppercase">Área TI Destino</div>
              <div class="row items-center q-gutter-x-xs q-mt-xs">
                <span v-if="incidenciaSeleccionada.codigo_departamento" class="chip brand">
                  {{ incidenciaSeleccionada.codigo_departamento }}
                </span>
                <span class="text-weight-bold text-dark">
                  {{ incidenciaSeleccionada.departamento }}
                </span>
              </div>
            </div>

            <div class="sla-row q-pa-sm">
              <div class="text-caption muted text-uppercase">Prioridad Calculada</div>
              <div class="q-mt-xs">
                <PrioridadBadge :prioridad="incidenciaSeleccionada.prioridad" />
              </div>
            </div>

            <div v-if="prioridadCalculada" class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="sla-row q-pa-sm">
                  <div class="text-caption muted">Máx. Asignación</div>
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ prioridadCalculada.tiempo_max_asignacion_minutos }} min
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="sla-row q-pa-sm">
                  <div class="text-caption muted">Meta Resolución</div>
                  <div class="text-subtitle1 text-weight-bold text-dark">
                    {{ prioridadCalculada.tiempo_meta_resolucion_horas }} h
                  </div>
                </div>
              </div>
            </div>

            <div v-if="prioridadCalculada?.descripcion_criterio" class="text-caption muted">
              <strong>Criterio:</strong> {{ prioridadCalculada.descripcion_criterio }}
            </div>
          </div>

          <q-separator v-if="ultimoFolioCreado" class="q-my-md" />

          <div v-if="ultimoFolioCreado" class="folio-creado q-pa-sm">
            <div class="text-caption text-positive text-weight-bold text-uppercase">
              Último Ticket Generado
            </div>
            <div class="row items-center justify-between q-mt-xs">
              <div class="text-h6 text-weight-bold text-dark">
                {{ ultimoFolioCreado }}
              </div>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                color="primary"
                icon="attach_file"
                label="Ver / Adjuntos"
                :to="{
                  path: '/tickets/recepcion',
                  query: { folio: ultimoFolioCreado, tab: 'adjuntos' },
                }"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>
    <BuscarSolicitanteDialog
      v-model="buscadorSolicitanteAbierto"
      :texto-inicial="form.solicitante_nombre"
      :id-departamento-inicial="form.id_departamento_solicitante"
      @seleccionar="alSeleccionarSolicitante"
    />

    <!-- 🛡️ [FASE 3.2 - SOLICITANTES] Confirmación explícita al modificar o coincidir en el mismo departamento -->
    <q-dialog v-model="confirmarSolicitanteAbierto" persistent>
      <q-card class="confirmar-solicitante-card">
        <q-card-section class="row items-center justify-between dialog-header q-pa-sm">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="manage_accounts" color="primary" size="20px" />
            <span class="text-subtitle2 text-weight-bold text-dark">
              Confirmar datos del solicitante
            </span>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="grey-7"
            :disable="enviando"
            @click="confirmarSolicitanteAbierto = false"
          />
        </q-card-section>

        <q-card-section v-if="candidatoSolicitante" class="q-pa-md q-gutter-y-sm text-body2">
          <div class="text-dark">
            Existe un solicitante registrado en
            <strong>{{ candidatoSolicitante.departamento }}</strong> con datos coincidentes:
          </div>
          <div class="sla-row q-pa-sm">
            <div class="text-caption muted text-uppercase">Registro actual en BD</div>
            <div class="text-weight-bold text-dark">
              {{ candidatoSolicitante.nombre_completo }} · {{ candidatoSolicitante.telefono }}
            </div>
          </div>
          <div class="sla-row q-pa-sm">
            <div class="text-caption muted text-uppercase">Nuevos datos ingresados</div>
            <div class="text-weight-bold text-primary">
              {{ form.solicitante_nombre.trim() }} ·
              {{ formatearTelefonoMask(form.solicitante_telefono) }}
            </div>
          </div>
          <div class="text-caption muted">
            ¿Deseas actualizar ese registro existente o guardarlo como un solicitante nuevo?
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-sm q-gutter-xs">
          <q-btn
            flat
            no-caps
            color="grey-7"
            label="Cancelar"
            :disable="enviando"
            @click="confirmarSolicitanteAbierto = false"
          />
          <q-btn
            outline
            no-caps
            color="secondary"
            label="Crear nuevo"
            :disable="enviando"
            @click="confirmarAccionSolicitante('nuevo')"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Actualizar existente"
            :loading="enviando"
            @click="confirmarAccionSolicitante('actualizar')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useQuasar, type QForm } from 'quasar';
import PrioridadBadge from '@/components/common/PrioridadBadge.vue';
import BuscarSolicitanteDialog from '@/components/tickets/BuscarSolicitanteDialog.vue';
import type { SolicitanteItem } from '@/models/types';
import { formatearTelefonoMask, validarTelefonoUsuario } from '@/composables/useUsersView';
import { useCatalogStore, type ServiceCatalog } from '@/stores/useCatalogStore';
import { useConfiguracionesStore } from '@/stores/useConfiguracionesStore';
import { useDepartmentsStore, type Department } from '@/stores/useDepartmentsStore';
import { usePrioridadesStore } from '@/stores/usePrioridadesStore';
import { useTicketStore } from '@/stores/ticketStore';
import {
  formatearTamanoArchivo,
  validarArchivoImagenSeguro,
} from '@/utils/adjuntos';

interface ImagenAdjuntaLocal {
  idLocal: string;
  file: File;
  previewUrl: string;
  estado: 'listo' | 'subiendo' | 'subido';
}

interface AdvertenciaAdjuntos {
  folio: string;
  totalIntentadas: number;
  exitosas: number;
  fallidas: Array<{ nombre: string; motivo: string }>;
}

const $q = useQuasar();
const departmentsStore = useDepartmentsStore();
const catalogStore = useCatalogStore();
const configuracionesStore = useConfiguracionesStore();
const prioridadesStore = usePrioridadesStore();
const ticketStore = useTicketStore();

const formRef = ref<QForm | null>(null);
const inputImagenesRef = ref<HTMLInputElement | null>(null);
const form = reactive({
  id_solicitante: null as number | null,
  id_departamento_solicitante: null as number | null,
  solicitante_nombre: '',
  solicitante_telefono: '',
  id_catalogo: null as number | null,
  descripcion_incidencia: '',
  // 🛡️ [FASE 3.3 - TICKETS] Campos para Cierre Directo Nivel 1
  cierre_directo_n1: false,
  causa_raiz: '',
  solucion_aplicada: '',
  conformidad_usuario: true,
  comentario: '',
});

const buscadorSolicitanteAbierto = ref(false);
// 🛡️ [FASE 3.2 - SOLICITANTES] Control de edición vs inserción en el mismo departamento
const solicitanteOriginal = ref<SolicitanteItem | null>(null);
const candidatoSolicitante = ref<SolicitanteItem | null>(null);
const confirmarSolicitanteAbierto = ref(false);

const errorFormulario = ref<string | null>(null);
const advertenciaAdjuntos = ref<AdvertenciaAdjuntos | null>(null);
const ultimoFolioCreado = ref<string | null>(null);
const filtroDepartamentoTexto = ref('');
const filtroCatalogoTexto = ref('');

const imagenesAdjuntas = ref<ImagenAdjuntaLocal[]>([]);
const arrastrandoImagen = ref(false);
const validandoImagenes = ref(false);
const enviando = ref(false);
const textoProgresoSubida = ref<string | null>(null);

const departamentosActivos = computed(() => departmentsStore.departamentosActivos);
const catalogoActivo = computed(() => catalogStore.serviciosActivos);
const maxImagenesPermitidas = computed(() =>
  Math.max(
    1,
    Math.min(
      configuracionesStore.maxImagenesNuevoTicket,
      configuracionesStore.maxAdjuntosPorTicket,
    ),
  ),
);

const opcionesDepartamentosFiltradas = computed<Department[]>(() => {
  const q = filtroDepartamentoTexto.value.trim().toLowerCase();
  if (!q) return departamentosActivos.value;
  return departamentosActivos.value.filter((d) =>
    [d.nombre, d.codigo, d.tipo_departamento].some((v) => v.toLowerCase().includes(q)),
  );
});

const opcionesCatalogoFiltradas = computed<ServiceCatalog[]>(() => {
  const q = filtroCatalogoTexto.value.trim().toLowerCase();
  if (!q) return catalogoActivo.value;
  return catalogoActivo.value.filter((c) =>
    [c.nombre, c.departamento, c.prioridad].some((v) => v.toLowerCase().includes(q)),
  );
});

const incidenciaSeleccionada = computed<ServiceCatalog | null>(() => {
  if (!form.id_catalogo) return null;
  return catalogoActivo.value.find((c) => c.id === form.id_catalogo) ?? null;
});

const prioridadCalculada = computed(() => {
  if (!incidenciaSeleccionada.value) return null;
  return (
    prioridadesStore.prioridades.find(
      (p) => p.id === incidenciaSeleccionada.value?.id_prioridad,
    ) ?? null
  );
});

function filtrarDepartamentos(val: string, update: (fn: () => void) => void): void {
  update(() => {
    filtroDepartamentoTexto.value = val;
  });
}

function filtrarCatalogo(val: string, update: (fn: () => void) => void): void {
  update(() => {
    filtroCatalogoTexto.value = val;
  });
}

function abrirSelectorImagenes(): void {
  inputImagenesRef.value?.click();
}

function liberarPreviewsImagenes(): void {
  for (const item of imagenesAdjuntas.value) {
    URL.revokeObjectURL(item.previewUrl);
  }
  imagenesAdjuntas.value = [];
}

function eliminarImagen(idLocal: string): void {
  const idx = imagenesAdjuntas.value.findIndex((i) => i.idLocal === idLocal);
  if (idx < 0) return;
  const [removido] = imagenesAdjuntas.value.splice(idx, 1);
  if (removido) {
    URL.revokeObjectURL(removido.previewUrl);
  }
}

async function agregarArchivos(lista: File[]): Promise<void> {
  if (!lista.length || enviando.value) return;

  validandoImagenes.value = true;
  try {
    for (const file of lista) {
      if (imagenesAdjuntas.value.length >= maxImagenesPermitidas.value) {
        $q.notify({
          type: 'warning',
          message: `Límite alcanzado: máximo ${maxImagenesPermitidas.value} ${maxImagenesPermitidas.value === 1 ? 'imagen' : 'imágenes'} al registrar según la política vigente.`,
          position: 'top-right',
          timeout: 3500,
        });
        break;
      }

      const duplicado = imagenesAdjuntas.value.some(
        (i) =>
          i.file.name === file.name &&
          i.file.size === file.size &&
          i.file.lastModified === file.lastModified,
      );
      if (duplicado) {
        $q.notify({
          type: 'info',
          message: `La imagen "${file.name}" ya está agregada.`,
          position: 'top-right',
          timeout: 2200,
        });
        continue;
      }

      const validacion = await validarArchivoImagenSeguro(
        file,
        configuracionesStore.tamanoMaxAdjuntoMb,
      );
      if (!validacion.valido) {
        $q.notify({
          type: 'negative',
          message: validacion.motivo ?? 'Archivo de imagen inválido.',
          position: 'top-right',
          timeout: 4000,
        });
        continue;
      }

      imagenesAdjuntas.value.push({
        idLocal: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        estado: 'listo',
      });
    }
  } finally {
    validandoImagenes.value = false;
  }
}

function alSeleccionarArchivos(ev: Event): void {
  const input = ev.target as HTMLInputElement;
  const archivos = input.files ? Array.from(input.files) : [];
  input.value = '';
  void agregarArchivos(archivos);
}

function alSoltarArchivos(ev: DragEvent): void {
  arrastrandoImagen.value = false;
  const archivos = ev.dataTransfer?.files ? Array.from(ev.dataTransfer.files) : [];
  void agregarArchivos(archivos);
}

function alPegarImagen(ev: ClipboardEvent): void {
  if (form.cierre_directo_n1) return;
  const items = ev.clipboardData?.items;
  if (!items) return;

  const archivosPegados: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
    const blob = item.getAsFile();
    if (!blob) continue;
    const ext =
      item.type === 'image/jpeg'
        ? 'jpg'
        : item.type === 'image/webp'
          ? 'webp'
          : item.type === 'image/png'
            ? 'png'
            : 'png';
    const nombreFinal =
      blob.name && blob.name !== 'image.png'
        ? blob.name
        : `captura-${Date.now()}-${archivosPegados.length + 1}.${ext}`;
    archivosPegados.push(new File([blob], nombreFinal, { type: item.type }));
  }

  if (archivosPegados.length > 0) {
    ev.preventDefault();
    void agregarArchivos(archivosPegados);
  }
}

function alSeleccionarSolicitante(solicitante: SolicitanteItem): void {
  solicitanteOriginal.value = { ...solicitante };
  form.id_solicitante = solicitante.id;
  form.id_departamento_solicitante = solicitante.id_departamento;
  form.solicitante_nombre = solicitante.nombre_completo;
  form.solicitante_telefono = formatearTelefonoMask(solicitante.telefono);
}

function alCambiarDepartamentoSolicitante(): void {
  // Si se cambia a otro departamento distinto al del solicitante elegido, será una inserción nueva
  if (
    solicitanteOriginal.value &&
    form.id_departamento_solicitante !== solicitanteOriginal.value.id_departamento
  ) {
    form.id_solicitante = null;
    solicitanteOriginal.value = null;
  }
}

function alAlternarCierreDirectoN1(activo: boolean): void {
  if (activo && imagenesAdjuntas.value.length > 0) {
    liberarPreviewsImagenes();
    $q.notify({
      type: 'info',
      message: 'Las imágenes en espera se descartaron porque un ticket cerrado en Nivel 1 queda en estado terminal.',
      position: 'top-right',
      timeout: 3500,
    });
  }
}

function limpiarCamposTexto(): void {
  solicitanteOriginal.value = null;
  candidatoSolicitante.value = null;
  confirmarSolicitanteAbierto.value = false;
  form.id_solicitante = null;
  form.id_departamento_solicitante = null;
  form.solicitante_nombre = '';
  form.solicitante_telefono = '';
  form.id_catalogo = null;
  form.descripcion_incidencia = '';
  form.cierre_directo_n1 = false;
  form.causa_raiz = '';
  form.solucion_aplicada = '';
  form.conformidad_usuario = true;
  form.comentario = '';
  errorFormulario.value = null;
  liberarPreviewsImagenes();
  void nextTick(() => formRef.value?.resetValidation());
}

function limpiarFormulario(): void {
  advertenciaAdjuntos.value = null;
  limpiarCamposTexto();
}

function buscarCoincidenciaCercana(
  lista: SolicitanteItem[],
  nombreIngresado: string,
  telefonoIngresado: string,
): { exacto: SolicitanteItem | null; cercano: SolicitanteItem | null } {
  const nombreNorm = nombreIngresado.trim().toLowerCase();
  const exacto =
    lista.find((s) => s.nombre_completo.trim().toLowerCase() === nombreNorm) ?? null;
  if (exacto) {
    return { exacto, cercano: null };
  }

  const cercano =
    lista.find((s) => {
      const sNombre = s.nombre_completo.trim().toLowerCase();
      const sTel = formatearTelefonoMask(s.telefono);
      const coincideNombreParcial =
        nombreNorm.length >= 4 && (sNombre.includes(nombreNorm) || nombreNorm.includes(sNombre));
      const coincideTelefono = sTel === telefonoIngresado;
      return coincideNombreParcial || coincideTelefono;
    }) ?? null;

  return { exacto: null, cercano };
}

async function confirmarAccionSolicitante(modo: 'actualizar' | 'nuevo'): Promise<void> {
  const idTarget = modo === 'actualizar' ? candidatoSolicitante.value?.id : undefined;
  confirmarSolicitanteAbierto.value = false;
  await ejecutarRegistroTicket({ modo, ...(idTarget ? { idSolicitante: idTarget } : {}) });
}

async function enviarFormulario(): Promise<void> {
  if (enviando.value || ticketStore.guardando || validandoImagenes.value) return;

  errorFormulario.value = null;
  advertenciaAdjuntos.value = null;
  const telefonoArmado = formatearTelefonoMask(form.solicitante_telefono);
  if (
    !form.id_departamento_solicitante ||
    form.solicitante_nombre.trim().length < 3 ||
    validarTelefonoUsuario(telefonoArmado) !== true ||
    !form.id_catalogo
  ) {
    errorFormulario.value =
      'Completa el departamento solicitante, nombre y teléfono de contacto, e incidencia del catálogo.';
    return;
  }

  if (form.cierre_directo_n1) {
    if (form.causa_raiz.trim().length < 5 || form.solucion_aplicada.trim().length < 5) {
      errorFormulario.value =
        'Para el Cierre Directo Nivel 1 debes ingresar la causa raíz y la solución aplicada (mín. 5 caracteres cada una).';
      return;
    }
  }

  const nombreIngresado = form.solicitante_nombre.trim();

  // Caso 1: Seleccionó un solicitante en el mismo departamento y modificó nombre o teléfono
  if (
    solicitanteOriginal.value &&
    form.id_departamento_solicitante === solicitanteOriginal.value.id_departamento
  ) {
    const cambioNombre =
      nombreIngresado.toLowerCase() !==
      solicitanteOriginal.value.nombre_completo.trim().toLowerCase();
    const cambioTelefono =
      telefonoArmado !== formatearTelefonoMask(solicitanteOriginal.value.telefono);

    if (cambioNombre || cambioTelefono) {
      candidatoSolicitante.value = solicitanteOriginal.value;
      confirmarSolicitanteAbierto.value = true;
      return;
    }

    await ejecutarRegistroTicket({
      modo: 'vincular',
      idSolicitante: solicitanteOriginal.value.id,
    });
    return;
  }

  // Caso 2: Escritura manual (o cambio de departamento) -> verificar coincidencias en el departamento destino
  try {
    const existentesDpto = await ticketStore.buscarSolicitantes(
      undefined,
      form.id_departamento_solicitante,
    );
    const { exacto, cercano } = buscarCoincidenciaCercana(
      existentesDpto,
      nombreIngresado,
      telefonoArmado,
    );

    if (exacto) {
      const telExacto = formatearTelefonoMask(exacto.telefono);
      if (telExacto !== telefonoArmado) {
        candidatoSolicitante.value = exacto;
        confirmarSolicitanteAbierto.value = true;
        return;
      }
      await ejecutarRegistroTicket({ modo: 'vincular', idSolicitante: exacto.id });
      return;
    }

    if (cercano) {
      candidatoSolicitante.value = cercano;
      confirmarSolicitanteAbierto.value = true;
      return;
    }
  } catch {
    // Si falla la preconsulta no bloquea el registro normal
  }

  await ejecutarRegistroTicket({ modo: 'nuevo' });
}

async function ejecutarRegistroTicket(opciones: {
  modo: 'vincular' | 'actualizar' | 'nuevo';
  idSolicitante?: number;
}): Promise<void> {
  if (!form.id_departamento_solicitante || !form.id_catalogo) return;

  const telefonoArmado = formatearTelefonoMask(form.solicitante_telefono);
  enviando.value = true;
  textoProgresoSubida.value = null;

  try {
    // 1. Registrar el ticket principal con la acción elegida sobre public.solicitantes
    const camposN1 = form.cierre_directo_n1
      ? {
          cierre_directo_n1: true,
          causa_raiz: form.causa_raiz.trim(),
          solucion_aplicada: form.solucion_aplicada.trim(),
          conformidad_usuario: form.conformidad_usuario,
          ...(form.comentario.trim() ? { comentario: form.comentario.trim() } : {}),
        }
      : {};

    const payloadTicket =
      opciones.modo === 'nuevo' || !opciones.idSolicitante
        ? {
            id_departamento_solicitante: form.id_departamento_solicitante,
            solicitante_nombre: form.solicitante_nombre.trim(),
            solicitante_telefono: telefonoArmado,
            id_catalogo: form.id_catalogo,
            descripcion_incidencia: form.descripcion_incidencia.trim(),
            ...camposN1,
          }
        : {
            id_solicitante: opciones.idSolicitante,
            actualizar_solicitante: opciones.modo === 'actualizar',
            ...(opciones.modo === 'actualizar'
              ? { solicitante_nombre: form.solicitante_nombre.trim() }
              : {}),
            solicitante_telefono: telefonoArmado,
            id_catalogo: form.id_catalogo,
            descripcion_incidencia: form.descripcion_incidencia.trim(),
            ...camposN1,
          };

    const creado = await ticketStore.crearTicket(payloadTicket);

    ultimoFolioCreado.value = creado.folio;

    // 2. Subir secuencialmente las imágenes validadas (si hay y no es cierre directo N1)
    const totalImagenes = form.cierre_directo_n1 ? 0 : imagenesAdjuntas.value.length;
    let exitosas = 0;
    const fallidas: Array<{ nombre: string; motivo: string }> = [];

    if (!form.cierre_directo_n1) {
      for (const [idx, item] of imagenesAdjuntas.value.entries()) {
        item.estado = 'subiendo';
        textoProgresoSubida.value = `Subiendo imagen ${idx + 1} de ${totalImagenes}...`;
        try {
          await ticketStore.subirAdjunto(creado.id, item.file);
          item.estado = 'subido';
          exitosas += 1;
        } catch (errImg: unknown) {
          fallidas.push({
            nombre: item.file.name,
            motivo:
              errImg instanceof Error ? errImg.message : 'Error inesperado al subir la imagen.',
          });
        }
      }
    }

    const fueCierreDirecto = form.cierre_directo_n1;
    // Limpiar el formulario tras crear el ticket para evitar envíos duplicados
    limpiarCamposTexto();

    if (fallidas.length === 0) {
      const detalleImg =
        exitosas > 0
          ? ` con ${exitosas} ${exitosas === 1 ? 'imagen adjunta' : 'imágenes adjuntas'}`
          : '';
      $q.notify({
        type: 'positive',
        message: fueCierreDirecto
          ? `Ticket ${creado.folio} registrado y cerrado en Nivel 1 correctamente.`
          : `Ticket ${creado.folio} registrado correctamente${detalleImg}.`,
        position: 'top-right',
        timeout: 4000,
      });
    } else {
      advertenciaAdjuntos.value = {
        folio: creado.folio,
        totalIntentadas: totalImagenes,
        exitosas,
        fallidas,
      };
      $q.notify({
        type: 'warning',
        message: `Ticket ${creado.folio} creado, pero ${fallidas.length} ${fallidas.length === 1 ? 'imagen falló' : 'imágenes fallaron'}. Puedes subirla desde Adjuntos.`,
        position: 'top-right',
        timeout: 5500,
      });
    }
  } catch (err: unknown) {
    errorFormulario.value =
      err instanceof Error ? err.message : 'No fue posible registrar el ticket.';
  } finally {
    enviando.value = false;
    textoProgresoSubida.value = null;
  }
}

onBeforeUnmount(() => {
  liberarPreviewsImagenes();
});

onMounted(async () => {
  try {
    await Promise.all([
      departmentsStore.cargarDepartamentos(),
      catalogStore.cargarCatalogo(),
      prioridadesStore.cargarPrioridades(),
      configuracionesStore.cargarOperativas(),
    ]);
  } catch (err: unknown) {
    errorFormulario.value =
      err instanceof Error
        ? err.message
        : 'No fue posible cargar los catálogos iniciales para el formulario.';
  }
});
</script>

<style scoped lang="scss">
.field-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.btn-buscar-solicitante {
  height: 40px;
}

.confirmar-solicitante-card {
  width: 100%;
  max-width: 480px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  overflow: hidden;
}

.sla-row {
  background: var(--surface-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.folio-creado {
  background: var(--success-soft);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.form-warning {
  background: var(--warning-soft);
  border: 1px solid var(--border-subtle);
}

.n1-panel {
  background: var(--surface-bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.dropzone-evidencia {
  background: var(--surface-bg);
  border: 1.5px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-ui),
    background-color var(--transition-ui);

  &--activa {
    border-color: var(--brand-ink);
    background: var(--brand-primary-soft);
  }

  &--llena {
    border-style: solid;
  }
}

.preview-card-item {
  position: relative;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  overflow: hidden;
}

.preview-thumb {
  display: block;
  width: 100%;
  height: 112px;
  object-fit: cover;
  background: var(--surface-subtle);
}

.preview-remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0.9;
}

.nuevo-ticket-page {
  max-width: 1400px;
  margin: 0 auto;
}

.min-w-0 {
  min-width: 0;
}

.shrink-0 {
  flex-shrink: 0;
}
</style>
