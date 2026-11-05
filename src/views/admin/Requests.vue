<template>
  <section class="requests-page">
    <header class="page-header">
      <div>
        <div class="breadcrumb"><span>Administración</span><span>/</span><span>Solicitudes</span></div>
        <h1>Solicitudes</h1>
      </div>
      <button class="create-request-button" type="button" @click="openNew">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14m-7-7h14" /></svg>
        Nueva solicitud
      </button>
    </header>

    <div class="requests-panel">
      <header class="panel-header">
        <div>
          <h2>Solicitudes</h2>
          <p>Revisa y gestiona los requerimientos del equipo.</p>
        </div>
        <div class="filter-control">
          <button
            class="filter-button"
            type="button"
            :aria-expanded="filterOpen"
            @click="filterOpen = !filterOpen"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z" /></svg>
            {{ selectedStatus === 'TODOS' ? 'Filtrar estado' : statusLabel(selectedStatus) }}
          </button>
          <div v-if="filterOpen" class="filter-menu">
            <button
              v-for="status in statuses"
              :key="status"
              type="button"
              :class="{ selected: selectedStatus === status }"
              @click="selectStatus(status)"
            >
              {{ status === 'TODOS' ? 'Todos los estados' : statusLabel(status) }}
            </button>
          </div>
        </div>
      </header>

      <p v-if="error" class="requests-error" role="alert">{{ error }}</p>
      <p v-if="productsError" class="requests-error" role="alert">{{ productsError }}</p>
      <p v-if="actionError" class="requests-error" role="alert">{{ actionError }}</p>

      <div class="requests-table-wrap">
        <table class="requests-table">
          <thead>
            <tr>
              <th>Solicitante</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredRequests" :key="request.id">
              <td>
                <div class="request-person">
                  <strong>{{ request.usuario?.nombre || 'Usuario no disponible' }}</strong>
                  <span>{{ request.usuario?.email || '—' }}</span>
                </div>
              </td>
              <td>
                <div class="request-product">
                  <strong>{{ request.producto?.nombre || 'Producto no disponible' }}</strong>
                  <span>{{ request.producto?.codigo || '—' }}</span>
                </div>
              </td>
              <td>{{ request.cantidad }} {{ request.producto?.unidad_medida || 'ud' }}</td>
              <td>{{ formatDate(request.fecha) }}</td>
              <td>
                <span class="request-status" :class="`status-${request.estado_solicitud.toLowerCase()}`">
                  {{ statusLabel(request.estado_solicitud) }}
                </span>
              </td>
              <td>
                <div v-if="request.estado_solicitud === 'PENDIENTE'" class="request-actions">
                  <button
                    class="decision-button approve-button"
                    type="button"
                    @click="aprobar(request)"
                    :disabled="actingId === request.id"
                    :aria-label="`Aprobar solicitud de ${request.usuario?.nombre || 'usuario'}`"
                    title="Aprobar solicitud"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                  </button>
                  <button
                    class="decision-button reject-button"
                    type="button"
                    @click="rechazar(request)"
                    :disabled="actingId === request.id"
                    :aria-label="`Rechazar solicitud de ${request.usuario?.nombre || 'usuario'}`"
                    title="Rechazar solicitud"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
                  </button>
                  <span v-if="actingId === request.id" class="action-progress">Guardando...</span>
                </div>
                <button v-else class="details-button" type="button" @click="openDetails(request)">
                  Ver detalle
                </button>
              </td>
            </tr>
            <tr v-if="loading && requests.length === 0">
              <td colspan="6" class="empty-row">Cargando solicitudes...</td>
            </tr>
            <tr v-else-if="!loading && filteredRequests.length === 0">
              <td colspan="6" class="empty-row">
                {{ requests.length ? 'No hay solicitudes con este estado.' : 'No hay solicitudes para mostrar.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="new-request-title">
        <h2 id="new-request-title" class="modal-title">Nueva solicitud</h2>
        <form class="request-form" @submit.prevent="onCreate">
          <label class="form-field">
            <span>Producto *</span>
            <select v-model.number="newReq.id_producto" required>
              <option :value="undefined" disabled>Seleccione un producto</option>
              <option v-for="product in products" :key="product.id" :value="product.id" :disabled="product.cantidad <= 0">
                {{ product.nombre }} (Disponibles: {{ product.cantidad }} {{ product.unidad_medida }})
              </option>
            </select>
          </label>
          <label class="form-field">
            <span>Cantidad *</span>
            <input type="number" min="1" :max="selectedProduct?.cantidad" step="1" v-model.number="newReq.cantidad" required />
            <small v-if="selectedProduct && newReq.cantidad > selectedProduct.cantidad" class="requests-error" role="alert">
              No puedes solicitar más de {{ selectedProduct.cantidad }} unidades.
            </small>
          </label>
          <label class="form-field">
            <span>Comentario (opcional)</span>
            <textarea rows="3" v-model.trim="newReq.comentario" placeholder="Ej.: Para proyecto X" />
          </label>
          <p v-if="formError" class="requests-error" role="alert">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" class="modal-cancel" @click="closeModal" :disabled="creating">Cancelar</button>
            <button
              type="submit"
              class="modal-submit"
              :disabled="creating
                || !selectedProduct
                || !Number.isInteger(newReq.cantidad)
                || newReq.cantidad < 1
                || newReq.cantidad > selectedProduct.cantidad"
            >
              {{ creating ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="detailsOpen && selectedRequest" class="modal-overlay" @click.self="closeDetails">
      <section class="modal details-modal" role="dialog" aria-modal="true" aria-labelledby="request-details-title">
        <h2 id="request-details-title" class="modal-title">Detalle de solicitud</h2>
        <dl class="request-details">
          <div><dt>Solicitante</dt><dd>{{ selectedRequest.usuario?.nombre || 'Usuario no disponible' }}</dd></div>
          <div><dt>Correo</dt><dd>{{ selectedRequest.usuario?.email || '—' }}</dd></div>
          <div><dt>Producto</dt><dd>{{ selectedRequest.producto?.nombre || 'Producto no disponible' }}</dd></div>
          <div><dt>Código</dt><dd>{{ selectedRequest.producto?.codigo || '—' }}</dd></div>
          <div><dt>Cantidad</dt><dd>{{ selectedRequest.cantidad }} {{ selectedRequest.producto?.unidad_medida || 'ud' }}</dd></div>
          <div><dt>Fecha</dt><dd>{{ formatDate(selectedRequest.fecha) }}</dd></div>
          <div><dt>Estado</dt><dd>{{ statusLabel(selectedRequest.estado_solicitud) }}</dd></div>
          <div><dt>Comentario</dt><dd>{{ selectedRequest.comentario || 'Sin comentario' }}</dd></div>
        </dl>
        <div class="modal-actions">
          <button type="button" class="modal-submit" @click="closeDetails">Cerrar</button>
        </div>
      </section>
    </div>

    <div v-if="decisionRequest" class="modal-overlay" @click.self="closeDecisionModal">
      <section class="modal decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-modal-title">
        <span class="decision-modal-icon" :class="decisionRequest.status === 'APROBADA' ? 'decision-icon-approve' : 'decision-icon-reject'" aria-hidden="true">
          <svg v-if="decisionRequest.status === 'APROBADA'" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4L19 6" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </span>
        <h2 id="decision-modal-title" class="modal-title">
          {{ decisionRequest.status === 'APROBADA' ? 'Aprobar solicitud' : 'Rechazar solicitud' }}
        </h2>
        <p class="decision-modal-message">
          ¿Confirmas que deseas {{ decisionRequest.status === 'APROBADA' ? 'aprobar' : 'rechazar' }} la solicitud de
          <strong>{{ decisionRequest.request.usuario?.nombre || `#${decisionRequest.request.id}` }}</strong>
          para <strong>{{ decisionRequest.request.cantidad }} {{ decisionRequest.request.producto?.unidad_medida || 'ud' }} de {{ decisionRequest.request.producto?.nombre || 'producto' }}</strong>?
        </p>
        <p v-if="actionError" class="requests-error decision-error" role="alert">{{ actionError }}</p>
        <div class="modal-actions">
          <button type="button" class="modal-cancel" @click="closeDecisionModal" :disabled="actingId !== null">
            Cancelar
          </button>
          <button
            type="button"
            class="modal-submit"
            :class="{ 'decision-submit-reject': decisionRequest.status === 'RECHAZADA' }"
            @click="confirmDecision"
            :disabled="actingId !== null"
          >
            {{ actingId !== null ? 'Guardando...' : decisionRequest.status === 'APROBADA' ? 'Sí, aprobar' : 'Sí, rechazar' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getProductos, type Producto } from '../../services/productsService'
import { getCurrentUser } from '../../services/authService'
import {
  getSolicitudes,
  createSolicitud,
  actualizarEstadoSolicitud,
  type SolicitudDTO,
  type NuevaSolicitud,
  type EstadoSolicitud
} from '../../services/requestsService'

const requests = ref<SolicitudDTO[]>([])
const products = ref<Producto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const productsError = ref<string | null>(null)
const actionError = ref<string | null>(null)
const actingId = ref<number | null>(null)
const filterOpen = ref(false)
const selectedStatus = ref<'TODOS' | EstadoSolicitud>('TODOS')
const statuses: Array<'TODOS' | EstadoSolicitud> = ['TODOS', 'PENDIENTE', 'APROBADA', 'RECHAZADA', 'EN_PROCESO']

const modalOpen = ref(false)
const creating = ref(false)
const formError = ref<string | null>(null)
const detailsOpen = ref(false)
const selectedRequest = ref<SolicitudDTO | null>(null)
const decisionRequest = ref<{ request: SolicitudDTO; status: 'APROBADA' | 'RECHAZADA' } | null>(null)
const newReq = ref<NuevaSolicitud>({
  id_usuario: 0,
  id_producto: 0,
  cantidad: 1,
  comentario: '',
  estado_solicitud: 'PENDIENTE'
})

const filteredRequests = computed(() => {
  if (selectedStatus.value === 'TODOS') return requests.value
  return requests.value.filter(request => request.estado_solicitud === selectedStatus.value)
})
const selectedProduct = computed(() => products.value.find(product => product.id === newReq.value.id_producto))

function statusLabel(status: 'TODOS' | EstadoSolicitud) {
  if (status === 'TODOS') return 'Todas'
  if (status === 'PENDIENTE') return 'Pendiente'
  if (status === 'APROBADA') return 'Aprobada'
  if (status === 'RECHAZADA') return 'Rechazada'
  return 'En proceso'
}

function selectStatus(status: 'TODOS' | EstadoSolicitud) {
  selectedStatus.value = status
  filterOpen.value = false
}

async function load() {
  try {
    loading.value = true
    error.value = null
    requests.value = await getSolicitudes()
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar solicitudes'
  } finally {
    loading.value = false
  }
}

async function loadProducts() {
  try {
    productsError.value = null
    products.value = await getProductos()
  } catch (e: any) {
    console.error(e)
    productsError.value = e?.message || 'Error al cargar productos'
  }
}

function openNew() {
  formError.value = null
  const user = getCurrentUser()
  newReq.value = {
    id_usuario: Number(user?.id || 0),
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
    const product = selectedProduct.value
    if (!product) {
      formError.value = 'Seleccione un producto'
      return
    }
    if (!Number.isInteger(newReq.value.cantidad) || newReq.value.cantidad < 1) {
      formError.value = 'La cantidad debe ser un número entero mayor que cero'
      return
    }
    if (newReq.value.cantidad > product.cantidad) {
      formError.value = 'La cantidad no puede superar las unidades disponibles'
      return
    }
    if (!Number.isInteger(newReq.value.id_usuario) || newReq.value.id_usuario <= 0) {
      formError.value = 'No se encontró el usuario autenticado'
      return
    }
    await createSolicitud(newReq.value)
    modalOpen.value = false
    await load()
  } catch (e: any) {
    console.error(e)
    formError.value = e?.message || 'No se pudo crear la solicitud'
  } finally {
    creating.value = false
  }
}

function setStatus(request: SolicitudDTO, status: 'APROBADA' | 'RECHAZADA') {
  actionError.value = null
  decisionRequest.value = { request, status }
}

function closeDecisionModal() {
  if (actingId.value !== null) return
  decisionRequest.value = null
  actionError.value = null
}

async function confirmDecision() {
  if (!decisionRequest.value || actingId.value !== null) return
  const { request, status } = decisionRequest.value
  const action = status === 'APROBADA' ? 'aprobar' : 'rechazar'
  try {
    actingId.value = request.id
    actionError.value = null
    await actualizarEstadoSolicitud(request.id, status)
    decisionRequest.value = null
    await load()
  } catch (e: any) {
    console.error(e)
    actionError.value = e?.message || `No se pudo ${action} la solicitud`
  } finally {
    actingId.value = null
  }
}

function aprobar(request: SolicitudDTO) {
  return setStatus(request, 'APROBADA')
}

function rechazar(request: SolicitudDTO) {
  return setStatus(request, 'RECHAZADA')
}

function openDetails(request: SolicitudDTO) {
  selectedRequest.value = request
  detailsOpen.value = true
}

function closeDetails() {
  detailsOpen.value = false
  selectedRequest.value = null
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

onMounted(async () => {
  await Promise.all([loadProducts(), load()])
})
</script>

<style scoped>
.requests-page { width: min(100%, 1120px); margin: 0 auto; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin: 12px 0 22px; }
.breadcrumb { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; color: #7183a4; font-size: 11px; }
.page-header h1 { margin: 0; color: #10234a; font-size: 20px; font-weight: 700; }
.create-request-button { display: inline-flex; min-height: 38px; flex: 0 0 auto; align-items: center; justify-content: center; gap: 7px; padding: 0 13px; border: 1px solid #d5e0f1; border-radius: 7px; color: #2860f5; background: #fff; cursor: pointer; font: inherit; font-size: 10px; font-weight: 650; }
.create-request-button:hover { border-color: #2860f5; background: #f6f8ff; }
.create-request-button svg { width: 14px; height: 14px; stroke: currentColor; stroke-linecap: round; stroke-width: 1.7; }
.requests-panel { padding: 24px; border: 1px solid #e0e8f4; border-radius: 10px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.panel-header h2 { margin: 0; color: #10234a; font-size: 15px; font-weight: 700; }
.panel-header p { margin: 7px 0 0; color: #7183a4; font-size: 11px; }
.filter-control { position: relative; }
.filter-button { display: inline-flex; min-height: 38px; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid #d5e0f1; border-radius: 7px; color: #334765; background: #fff; cursor: pointer; font: inherit; font-size: 10px; font-weight: 600; }
.filter-button:hover { border-color: #2860f5; color: #2860f5; }
.filter-button svg { width: 14px; height: 14px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.filter-menu { position: absolute; z-index: 5; top: calc(100% + 6px); right: 0; display: flex; width: 170px; flex-direction: column; padding: 5px; border: 1px solid #e0e8f4; border-radius: 8px; background: #fff; box-shadow: 0 10px 24px rgba(16, 35, 74, .12); }
.filter-menu button { padding: 9px 10px; border: 0; border-radius: 5px; color: #405574; background: transparent; cursor: pointer; font: inherit; font-size: 10px; text-align: left; }
.filter-menu button:hover, .filter-menu button.selected { color: #2860f5; background: #eef3ff; }
.requests-error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 7px; color: #b42318; background: #fff3f1; font-size: 12px; }
.requests-table-wrap { overflow-x: auto; }
.requests-table { width: 100%; min-width: 700px; border-collapse: collapse; text-align: left; }
.requests-table thead { border-bottom: 1px solid #e4ebf5; }
.requests-table th { height: 36px; padding: 0 10px; color: #7d8ca7; font-size: 9px; font-weight: 650; letter-spacing: .6px; text-transform: uppercase; white-space: nowrap; }
.requests-table td { height: 58px; padding: 8px 10px; border-bottom: 1px solid #e7edf6; color: #405574; font-size: 10px; }
.requests-table tbody tr { transition: background-color 120ms ease; }
.requests-table tbody tr:hover { background: #f7f9fe; }
.request-person, .request-product { display: flex; min-width: 130px; flex-direction: column; gap: 5px; }
.request-person strong, .request-product strong { color: #10234a; font-size: 10px; font-weight: 650; }
.request-person span, .request-product span { color: #7183a4; font-size: 9px; }
.request-status { display: inline-flex; min-height: 23px; align-items: center; padding: 0 10px; border-radius: 999px; font-size: 9px; font-weight: 650; white-space: nowrap; }
.status-pendiente { color: #a66a00; background: #fff0c7; }
.status-aprobada { color: #00966d; background: #dff8ee; }
.status-rechazada { color: #d83c50; background: #ffe4e8; }
.status-en_proceso { color: #2860f5; background: #eaf0ff; }
.request-actions { display: flex; align-items: center; gap: 7px; }
.decision-button { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid transparent; border-radius: 7px; cursor: pointer; }
.decision-button svg { width: 16px; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
.approve-button { color: #00966d; background: #dff8ee; }
.approve-button:hover:not(:disabled) { border-color: #89dfc3; background: #c8f3e5; }
.reject-button { color: #d83c50; background: #ffe4e8; }
.reject-button:hover:not(:disabled) { border-color: #f4aab4; background: #ffd3da; }
.decision-button:disabled { cursor: wait; opacity: .5; }
.action-progress { color: #7183a4; font-size: 9px; }
.details-button { padding: 4px 0; border: 0; color: #00a98b; background: transparent; cursor: pointer; font: inherit; font-size: 9px; font-weight: 650; white-space: nowrap; }
.details-button:hover { color: #007f6b; text-decoration: underline; }
.empty-row { height: 100px !important; color: #7183a4 !important; text-align: center; }
.modal-overlay { position: fixed; z-index: 100; display: grid; overflow-y: auto; padding: 24px; background: rgba(16, 35, 74, .42); inset: 0; place-items: center; }
.modal { width: min(100%, 520px); max-height: calc(100vh - 48px); overflow-y: auto; padding: 24px; border: 1px solid #e0e8f4; border-radius: 12px; background: #fff; box-shadow: 0 18px 55px rgba(16, 35, 74, .22); }
.modal-title { margin: 0 0 20px; color: #10234a; font-size: 18px; font-weight: 700; }
.decision-modal { width: min(100%, 440px); }
.decision-modal .modal-title { margin-bottom: 10px; }
.decision-modal-icon { display: grid; width: 42px; height: 42px; place-items: center; margin-bottom: 16px; border-radius: 12px; }
.decision-modal-icon svg { width: 21px; height: 21px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
.decision-icon-approve { color: #00966d; background: #dff8ee; }
.decision-icon-reject { color: #d83c50; background: #ffe4e8; }
.decision-modal-message { margin: 0; color: #536783; font-size: 13px; line-height: 1.65; }
.decision-modal-message strong { color: #10234a; font-weight: 650; }
.decision-error { margin: 14px 0 0; }
.decision-submit-reject { border-color: #d83c50; background: #d83c50; }
.decision-submit-reject:hover:not(:disabled) { border-color: #bd2c40; background: #bd2c40; }
.request-form { display: flex; flex-direction: column; gap: 15px; }
.form-field { display: flex; flex-direction: column; gap: 7px; color: #334765; font-size: 12px; font-weight: 600; }
.form-field input, .form-field select, .form-field textarea { width: 100%; min-height: 40px; padding: 9px 11px; border: 1px solid #d5e0f1; border-radius: 7px; outline: 0; color: #243858; background: #fff; font: inherit; font-size: 12px; }
.form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #2860f5; box-shadow: 0 0 0 3px rgba(40, 96, 245, .1); }
.modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 5px; }
.modal-cancel, .modal-submit { min-height: 38px; padding: 0 15px; border: 1px solid #d5e0f1; border-radius: 7px; color: #405574; background: #fff; cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.modal-submit { border-color: #2860f5; color: #fff; background: #2860f5; }
.modal-cancel:disabled, .modal-submit:disabled { cursor: wait; opacity: .6; }
.request-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; margin: 0; }
.request-details div { min-width: 0; }
.request-details dt { margin-bottom: 5px; color: #7183a4; font-size: 10px; }
.request-details dd { overflow-wrap: anywhere; margin: 0; color: #10234a; font-size: 12px; font-weight: 600; }
.details-modal .modal-actions { margin-top: 22px; }
@media (max-width: 620px) { .page-header { align-items: flex-start; flex-direction: column; } .create-request-button { align-self: stretch; } .requests-panel { padding: 18px 14px; } .panel-header { align-items: stretch; flex-direction: column; } .filter-control { align-self: flex-start; } .request-details { grid-template-columns: 1fr; } }
</style>
