<template>
  <section class="requests-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Espacio de usuario</p>
        <h1>Mis solicitudes</h1>
        <p class="page-description">Consulta el estado de tus requerimientos de productos.</p>
      </div>
      <button class="create-request-button" type="button" @click="openNew">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14m-7-7h14" /></svg>
        Nueva solicitud
      </button>
    </header>

    <section class="status-overview" aria-label="Resumen de solicitudes">
      <button
        v-for="item in statusSummary"
        :key="item.status"
        class="status-card"
        :class="[{ selected: selectedStatus === item.status }, `card-${item.status.toLowerCase()}`]"
        type="button"
        :aria-pressed="selectedStatus === item.status"
        @click="selectStatus(item.status)"
      >
        <span class="status-card-label">{{ item.label }}</span>
        <span class="status-card-value">{{ item.count }}</span>
        <span class="status-card-indicator" aria-hidden="true"></span>
      </button>
    </section>

    <section class="requests-panel" aria-labelledby="requests-title">
      <header class="panel-header">
        <div>
          <h2 id="requests-title">Historial de solicitudes</h2>
          <p>{{ filteredCountLabel }}</p>
        </div>
        <div class="panel-controls">
          <button class="refresh-button" type="button" @click="loadRequests" :disabled="loading">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5m-4.1-2a7 7 0 0 1 12-3L20 12M4 12l3.1 5a7 7 0 0 0 12-3" /></svg>
            {{ loading ? 'Actualizando...' : 'Actualizar' }}
          </button>
        </div>
      </header>

      <p v-if="error" class="requests-error" role="alert">{{ error }}</p>

      <div class="requests-table-wrap">
        <table class="requests-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Fecha de solicitud</th>
              <th>Estado</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredRequests" :key="request.id">
              <td>
                <div class="request-product">
                  <span class="product-mark" aria-hidden="true">{{ request.producto?.nombre?.charAt(0) || 'P' }}</span>
                  <strong>{{ request.producto?.nombre || 'Producto no disponible' }}</strong>
                  <small>{{ request.producto?.codigo || 'Sin código' }}</small>
                </div>
              </td>
              <td><span class="quantity-pill">{{ request.cantidad }} {{ request.producto?.unidad_medida || 'ud' }}</span></td>
              <td>{{ formatDate(request.fecha) }}</td>
              <td>
                <span class="request-status" :class="`status-${request.estado_solicitud.toLowerCase()}`">
                  {{ statusLabel(request.estado_solicitud) }}
                </span>
              </td>
              <td class="comment-cell" :title="request.comentario || undefined">{{ request.comentario || 'Sin comentario' }}</td>
            </tr>
            <tr v-if="loading && mine.length === 0">
              <td colspan="5" class="empty-row">
                <span class="loading-indicator" aria-hidden="true"></span>
                <span>Cargando tus solicitudes...</span>
              </td>
            </tr>
            <tr v-else-if="!loading && !error && filteredRequests.length === 0">
              <td colspan="5" class="empty-row">
                <span class="empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 13h6m-6 4h6" /></svg>
                </span>
                <strong>{{ mine.length ? 'No hay resultados para este estado' : 'Aún no tienes solicitudes' }}</strong>
                <span>{{ mine.length ? 'Prueba seleccionando otro estado.' : 'Crea tu primera solicitud y aquí podrás seguir su avance.' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="new-request-title">
        <h2 id="new-request-title" class="modal-title">Nueva solicitud</h2>
        <p class="modal-description">Selecciona el producto y la cantidad que necesitas.</p>
        <form class="request-form" @submit.prevent="onCreate">
          <label class="form-field">
            <span>Producto *</span>
            <select v-model.number="newRequest.id_producto" required :disabled="productsLoading">
              <option :value="0" disabled>
                {{ productsLoading ? 'Cargando productos...' : 'Selecciona un producto' }}
              </option>
              <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                {{ product.nombre }} ({{ product.cantidad }} {{ product.unidad_medida }} disponibles)
              </option>
            </select>
            <small v-if="!productsLoading && availableProducts.length === 0" class="field-hint">
              No hay productos disponibles para solicitar.
            </small>
          </label>
          <label class="form-field">
            <span>Cantidad *</span>
            <input
              v-model.number="newRequest.cantidad"
              type="number"
              min="1"
              step="1"
              :max="selectedProduct?.cantidad"
              required
              :disabled="!selectedProduct"
            />
            <small v-if="selectedProduct" class="field-hint">
              Disponibles: {{ selectedProduct.cantidad }} {{ selectedProduct.unidad_medida }}
            </small>
            <small
              v-if="selectedProduct && newRequest.cantidad > selectedProduct.cantidad"
              class="requests-error"
              role="alert"
            >
              No puedes solicitar más de {{ selectedProduct.cantidad }} unidades.
            </small>
          </label>
          <label class="form-field">
            <span>Comentario <span class="optional-label">(opcional)</span></span>
            <textarea v-model.trim="newRequest.comentario" rows="3" placeholder="Cuéntanos para qué necesitas el producto." />
          </label>
          <p v-if="productsError" class="requests-error" role="alert">{{ productsError }}</p>
          <p v-if="formError" class="requests-error" role="alert">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" class="modal-cancel" @click="closeModal" :disabled="creating">Cancelar</button>
            <button
              type="submit"
              class="modal-submit"
              :disabled="creating
                || productsLoading
                || !selectedProduct
                || !Number.isInteger(newRequest.cantidad)
                || newRequest.cantidad < 1
                || newRequest.cantidad > selectedProduct.cantidad"
            >
              {{ creating ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getCurrentUser } from '../../services/authService'
import { getProductos, type Producto } from '../../services/productsService'
import {
  createSolicitud,
  getSolicitudes,
  type EstadoSolicitud,
  type NuevaSolicitud,
  type SolicitudDTO
} from '../../services/requestsService'

type EstadoFiltro = 'TODOS' | EstadoSolicitud

const currentUserId = Number(getCurrentUser()?.id || 0)
const requests = ref<SolicitudDTO[]>([])
const products = ref<Producto[]>([])
const loading = ref(false)
const productsLoading = ref(false)
const error = ref<string | null>(null)
const productsError = ref<string | null>(null)
const formError = ref<string | null>(null)
const selectedStatus = ref<EstadoFiltro>('TODOS')
const modalOpen = ref(false)
const creating = ref(false)
const newRequest = ref<NuevaSolicitud>({
  id_usuario: currentUserId,
  id_producto: 0,
  cantidad: 1,
  comentario: '',
  estado_solicitud: 'PENDIENTE'
})

const mine = computed(() => requests.value.filter(request => request.id_usuario === currentUserId))
const filteredRequests = computed(() => {
  if (selectedStatus.value === 'TODOS') return mine.value
  return mine.value.filter(request => request.estado_solicitud === selectedStatus.value)
})
const availableProducts = computed(() => products.value.filter(product => product.cantidad > 0))
const selectedProduct = computed(() =>
  availableProducts.value.find(product => product.id === newRequest.value.id_producto) ?? null
)
const requestCountLabel = computed(() => {
  const count = mine.value.length
  return `${count} ${count === 1 ? 'solicitud registrada' : 'solicitudes registradas'}`
})
const filteredCountLabel = computed(() => {
  const count = filteredRequests.value.length
  const noun = count === 1 ? 'solicitud' : 'solicitudes'
  return selectedStatus.value === 'TODOS'
    ? `${requestCountLabel.value} en total`
    : `${count} ${noun} · ${statusLabel(selectedStatus.value).toLowerCase()}`
})
const statusSummary = computed(() => [
  { status: 'TODOS' as const, label: 'Total de solicitudes', count: mine.value.length },
  { status: 'PENDIENTE' as const, label: 'Pendientes', count: mine.value.filter(item => item.estado_solicitud === 'PENDIENTE').length },
  { status: 'EN_PROCESO' as const, label: 'En proceso', count: mine.value.filter(item => item.estado_solicitud === 'EN_PROCESO').length },
  { status: 'APROBADA' as const, label: 'Aprobadas', count: mine.value.filter(item => item.estado_solicitud === 'APROBADA').length },
  { status: 'RECHAZADA' as const, label: 'Rechazadas', count: mine.value.filter(item => item.estado_solicitud === 'RECHAZADA').length }
])

function statusLabel(status: EstadoFiltro) {
  if (status === 'TODOS') return 'Todas'
  if (status === 'PENDIENTE') return 'Pendiente'
  if (status === 'APROBADA') return 'Aprobada'
  if (status === 'RECHAZADA') return 'Rechazada'
  return 'En proceso'
}

function selectStatus(status: EstadoFiltro) {
  selectedStatus.value = status
}

async function loadRequests() {
  try {
    loading.value = true
    error.value = null
    requests.value = await getSolicitudes()
  } catch (cause: unknown) {
    console.error(cause)
    error.value = cause instanceof Error ? cause.message : 'Error al cargar tus solicitudes'
  } finally {
    loading.value = false
  }
}

async function loadProducts() {
  try {
    productsLoading.value = true
    productsError.value = null
    products.value = await getProductos()
  } catch (cause: unknown) {
    console.error(cause)
    productsError.value = cause instanceof Error ? cause.message : 'Error al cargar los productos'
  } finally {
    productsLoading.value = false
  }
}

function openNew() {
  formError.value = null
  newRequest.value = {
    id_usuario: currentUserId,
    id_producto: 0,
    cantidad: 1,
    comentario: '',
    estado_solicitud: 'PENDIENTE'
  }
  modalOpen.value = true
}

function closeModal() {
  if (creating.value) return
  modalOpen.value = false
}

async function onCreate() {
  try {
    creating.value = true
    formError.value = null

    if (!currentUserId) {
      formError.value = 'No se encontró el usuario autenticado'
      return
    }
    if (!selectedProduct.value) {
      formError.value = 'Selecciona un producto disponible'
      return
    }
    if (!Number.isInteger(newRequest.value.cantidad)
      || newRequest.value.cantidad < 1
      || newRequest.value.cantidad > selectedProduct.value.cantidad) {
      formError.value = 'La cantidad debe estar entre 1 y las unidades disponibles'
      return
    }

    await createSolicitud(newRequest.value)
    modalOpen.value = false
    selectedStatus.value = 'TODOS'
    await loadRequests()
  } catch (cause: unknown) {
    console.error(cause)
    formError.value = cause instanceof Error ? cause.message : 'No se pudo crear la solicitud'
  } finally {
    creating.value = false
  }
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

onMounted(() => {
  void Promise.all([loadRequests(), loadProducts()])
})
</script>

<style scoped>
.requests-page { width: min(100%, 1120px); margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin: 5px 0 20px; padding: 23px 26px; overflow: hidden; border: 1px solid #dce7fb; border-radius: 14px; background: radial-gradient(ellipse at 90% 0%, rgba(117, 157, 255, .16), transparent 42%), linear-gradient(115deg, #fff 0%, #f7f9ff 100%); }
.eyebrow { margin: 0 0 7px; color: #2860f5; font-size: 10px; font-weight: 700; letter-spacing: 1.15px; text-transform: uppercase; }
.page-header h1 { margin: 0; color: #10234a; font-size: 25px; font-weight: 750; letter-spacing: -.5px; }
.page-description { margin: 7px 0 0; color: #647694; font-size: 12px; }
.create-request-button { display: inline-flex; min-height: 41px; flex: 0 0 auto; align-items: center; justify-content: center; gap: 8px; padding: 0 15px; border: 1px solid #2860f5; border-radius: 8px; color: #fff; background: #2860f5; box-shadow: 0 4px 10px rgba(40, 96, 245, .14); cursor: pointer; font: inherit; font-size: 12px; font-weight: 650; transition: background-color 150ms ease, box-shadow 150ms ease, transform 150ms ease; }
.create-request-button:hover { transform: translateY(-1px); background: #174fe0; box-shadow: 0 6px 14px rgba(40, 96, 245, .2); }
.create-request-button:focus-visible, .status-card:focus-visible, .refresh-button:focus-visible, .modal-cancel:focus-visible, .modal-submit:focus-visible { outline: 3px solid rgba(40, 96, 245, .3); outline-offset: 2px; }
.create-request-button svg { width: 16px; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-width: 1.8; }
.status-overview { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
.status-card { position: relative; display: flex; min-height: 94px; flex-direction: column; align-items: flex-start; justify-content: center; gap: 9px; padding: 15px 17px; overflow: hidden; border: 1px solid #e3eaf5; border-radius: 10px; color: #50627f; background: #fff; box-shadow: 0 3px 10px rgba(24, 48, 91, .025); cursor: pointer; text-align: left; transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease; }
.status-card:hover { transform: translateY(-2px); border-color: #c8d7f4; box-shadow: 0 7px 16px rgba(24, 48, 91, .07); }
.status-card.selected { border-color: #b8cbfa; box-shadow: 0 0 0 2px rgba(40, 96, 245, .08), 0 5px 14px rgba(24, 48, 91, .05); }
.status-card-label { color: #7183a4; font-size: 10px; font-weight: 600; }
.status-card-value { color: #10234a; font-size: 23px; font-weight: 750; letter-spacing: -.6px; line-height: 1; }
.status-card-indicator { position: absolute; top: 15px; right: 15px; width: 8px; height: 8px; border-radius: 50%; background: #2860f5; box-shadow: 0 0 0 4px #edf3ff; }
.card-pendiente .status-card-indicator { background: #e4a020; box-shadow: 0 0 0 4px #fff5df; }
.card-en_proceso .status-card-indicator { background: #657fe7; box-shadow: 0 0 0 4px #eef1ff; }
.card-aprobada .status-card-indicator { background: #24a47b; box-shadow: 0 0 0 4px #e7f7f1; }
.card-rechazada .status-card-indicator { background: #dc596b; box-shadow: 0 0 0 4px #fff0f2; }
.requests-panel { padding: 20px 22px 8px; border: 1px solid #e0e8f4; border-radius: 12px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 14px; }
.panel-header h2 { margin: 0; color: #10234a; font-size: 15px; font-weight: 700; }
.panel-header p { margin: 5px 0 0; color: #8290a8; font-size: 11px; }
.panel-controls { display: flex; align-items: center; gap: 8px; }
.refresh-button { display: inline-flex; min-height: 35px; align-items: center; justify-content: center; gap: 7px; padding: 0 11px; border: 1px solid #dce5f1; border-radius: 7px; color: #526784; background: #fff; cursor: pointer; font: inherit; font-size: 11px; font-weight: 600; white-space: nowrap; transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease; }
.refresh-button:hover:not(:disabled) { border-color: #2860f5; color: #2860f5; background: #f8faff; }
.refresh-button:disabled { cursor: wait; opacity: .65; }
.refresh-button svg { width: 15px; height: 15px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.requests-error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 7px; color: #b42318; background: #fff3f1; font-size: 12px; }
.requests-table-wrap { overflow-x: auto; }
.requests-table { width: 100%; min-width: 670px; border-collapse: collapse; text-align: left; }
.requests-table thead { border-bottom: 1px solid #e4ebf5; }
.requests-table th { height: 39px; padding: 0 12px; color: #8a98ae; font-size: 9px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; white-space: nowrap; }
.requests-table td { height: 68px; padding: 10px 12px; border-bottom: 1px solid #edf1f7; color: #405574; font-size: 11px; }
.requests-table tbody tr { transition: background-color 120ms ease; }
.requests-table tbody tr:not(:last-child):hover { background: #f8faff; }
.requests-table tbody tr:last-child td { border-bottom: 0; }
.request-product { display: grid; min-width: 145px; grid-template-columns: 34px minmax(0, 1fr); grid-template-rows: auto auto; align-items: center; column-gap: 10px; }
.product-mark { display: grid; width: 34px; height: 34px; grid-row: 1 / 3; place-items: center; border-radius: 9px; color: #2860f5; background: #eef3ff; font-size: 13px; font-weight: 700; text-transform: uppercase; }
.request-product strong { overflow: hidden; color: #10234a; font-size: 11px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.request-product small { margin-top: 3px; color: #8290a8; font-size: 9px; }
.quantity-pill { display: inline-flex; min-height: 25px; align-items: center; padding: 0 9px; border: 1px solid #e8edf5; border-radius: 6px; color: #405574; background: #f7f9fc; font-size: 10px; font-weight: 600; white-space: nowrap; }
.comment-cell { max-width: 220px; overflow: hidden; color: #7183a4 !important; text-overflow: ellipsis; white-space: nowrap; }
.request-status { display: inline-flex; min-height: 24px; align-items: center; gap: 6px; padding: 0 9px; border-radius: 999px; font-size: 9px; font-weight: 700; white-space: nowrap; }
.request-status::before { width: 5px; height: 5px; border-radius: 50%; background: currentColor; content: ""; }
.status-pendiente { color: #a66a00; background: #fff0c7; }
.status-aprobada { color: #00966d; background: #dff8ee; }
.status-rechazada { color: #d83c50; background: #ffe4e8; }
.status-en_proceso { color: #2860f5; background: #eaf0ff; }
.empty-row { height: 180px !important; color: #7183a4 !important; text-align: center; }
.empty-row > * { display: block; margin: 0 auto; }
.empty-row strong { margin-top: 9px; color: #334765; font-size: 12px; font-weight: 650; }
.empty-row > span:last-child { margin-top: 5px; color: #8290a8; font-size: 11px; }
.empty-icon { display: grid !important; width: 40px; height: 40px; place-items: center; border-radius: 12px; color: #6284db; background: #eef3ff; }
.empty-icon svg { width: 21px; height: 21px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.loading-indicator { width: 20px; height: 20px; margin-bottom: 9px !important; border: 2px solid #dce6fb; border-top-color: #2860f5; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .status-card, .create-request-button, .refresh-button { transition: none; }
  .status-card:hover, .create-request-button:hover { transform: none; }
  .loading-indicator { animation-duration: 1.8s; }
}
.modal-overlay { position: fixed; z-index: 50; inset: 0; display: grid; place-items: center; overflow-y: auto; padding: 20px; background: rgba(16, 35, 74, .42); }
.modal { width: min(100%, 480px); padding: 24px; border: 1px solid #e0e8f4; border-radius: 12px; background: #fff; box-shadow: 0 20px 55px rgba(16, 35, 74, .2); }
.modal-title { margin: 0; color: #10234a; font-size: 18px; font-weight: 700; }
.modal-description { margin: 7px 0 20px; color: #7183a4; font-size: 12px; }
.request-form { display: flex; flex-direction: column; gap: 15px; }
.form-field { display: flex; flex-direction: column; gap: 7px; color: #334765; font-size: 12px; font-weight: 600; }
.optional-label, .field-hint { color: #8190a8; font-size: 11px; font-weight: 400; }
.form-field input, .form-field select, .form-field textarea { width: 100%; min-height: 40px; padding: 9px 11px; border: 1px solid #d5e0f1; border-radius: 7px; outline: none; color: #334765; background: #fff; font: inherit; font-size: 12px; }
.form-field textarea { min-height: 82px; resize: vertical; }
.form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #2860f5; box-shadow: 0 0 0 3px rgba(40, 96, 245, .1); }
.form-field :disabled { color: #8190a8; background: #f5f7fb; cursor: not-allowed; }
.modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 5px; }
.modal-cancel, .modal-submit { min-height: 38px; padding: 0 14px; border: 1px solid #d5e0f1; border-radius: 7px; cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.modal-cancel { color: #526784; background: #fff; }
.modal-cancel:hover:not(:disabled) { background: #f5f7fb; }
.modal-submit { border-color: #2860f5; color: #fff; background: #2860f5; }
.modal-submit:hover:not(:disabled) { background: #174fe0; }
.modal-cancel:disabled, .modal-submit:disabled { cursor: not-allowed; opacity: .6; }

@media (max-width: 700px) {
  .page-header { align-items: flex-start; padding: 19px; }
  .page-header h1 { font-size: 22px; }
  .page-description { max-width: 38ch; line-height: 1.5; }
  .create-request-button { min-height: 38px; padding: 0 11px; font-size: 11px; }
  .status-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .status-card { min-height: 82px; padding: 12px 14px; }
  .status-card:last-child { grid-column: 1 / -1; }
  .requests-panel { padding: 17px 14px 6px; }
  .panel-header { align-items: flex-start; gap: 13px; }
  .panel-controls { width: 100%; justify-content: space-between; }
  .requests-table { min-width: 670px; }
}

@media (max-width: 420px) {
  .page-header { flex-direction: column; }
  .create-request-button { align-self: flex-start; }
  .panel-header { align-items: flex-start; flex-direction: column; }
  .panel-controls { width: auto; }
}
</style>
