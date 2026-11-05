<template>
  <div class="user-dashboard">
    <section class="user-metrics" aria-label="Resumen de usuario">
      <article class="user-metric-card">
        <span class="user-metric-icon metric-blue" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></svg>
        </span>
        <p>Productos disponibles</p>
        <div class="user-metric-value"><strong>{{ loading ? '—' : availableProducts.length }}</strong><RouterLink to="/dashboard/products">Ver catálogo ›</RouterLink></div>
      </article>

      <article class="user-metric-card">
        <span class="user-metric-icon metric-green" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 8h15l-3-3m3 3-3 3M20 16H5l3 3m-3-3 3-3" /></svg>
        </span>
        <p>Unidades disponibles</p>
        <div class="user-metric-value"><strong>{{ loading ? '—' : totalUnits }}</strong><span>En inventario</span></div>
      </article>

      <article class="user-metric-card">
        <span class="user-metric-icon metric-purple" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8m-8 4h8" /></svg>
        </span>
        <p>Mis solicitudes</p>
        <div class="user-metric-value"><strong>{{ loading ? '—' : myRequests.length }}</strong><RouterLink to="/dashboard/requests">{{ pendingRequests }} pendientes ›</RouterLink></div>
      </article>

      <article class="user-metric-card">
        <span class="user-metric-icon metric-amber" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></svg>
        </span>
        <p>Productos agotados</p>
        <div class="user-metric-value"><strong>{{ loading ? '—' : exhaustedProducts.length }}</strong><RouterLink to="/dashboard/products">Ver productos ›</RouterLink></div>
      </article>
    </section>

    <p v-if="error" class="dashboard-error" role="alert">{{ error }}</p>

    <section class="user-dashboard-columns">
      <article id="activity" class="user-activity-card">
        <header class="user-card-header">
          <div>
            <h2>Actividad de inventario</h2>
            <p>Movimientos recientes registrados</p>
          </div>
          <RouterLink to="/dashboard#activity">Ver actividad</RouterLink>
        </header>

        <div v-if="loading" class="dashboard-empty">Cargando actividad...</div>
        <div v-else-if="movements.length === 0" class="dashboard-empty">No hay movimientos recientes.</div>
        <ul v-else class="user-activity-list">
          <li v-for="movement in movements" :key="movement.id" class="user-activity-item">
            <span class="activity-type-icon" :class="`activity-${movement.tipo.toLowerCase()}`" aria-hidden="true">
              <svg v-if="movement.tipo === 'ENTRADA'" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
              <svg v-else-if="movement.tipo === 'SALIDA'" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m6-6-6 6-6-6" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </span>
            <div class="activity-description">
              <strong>{{ movement.producto?.nombre || 'Producto' }}</strong>
              <span>{{ movement.tipo }}<template v-if="movement.producto?.codigo"> · {{ movement.producto.codigo }}</template></span>
            </div>
            <div class="activity-quantity">
              <strong>{{ movement.tipo === 'ENTRADA' && movement.cantidad > 0 ? '+' : '' }}{{ movement.cantidad }}</strong>
              <time :datetime="movement.fecha">{{ shortDate(movement.fecha) }}</time>
            </div>
          </li>
        </ul>
      </article>

      <article class="user-products-card">
        <header class="user-card-header">
          <div>
            <h2>Productos disponibles</h2>
            <p>Solicita los artículos que necesitas.</p>
          </div>
          <RouterLink to="/dashboard/products">Ver todos</RouterLink>
        </header>

        <div v-if="loading" class="dashboard-empty">Cargando productos...</div>
        <div v-else-if="availableProducts.length === 0" class="dashboard-empty">No hay productos disponibles.</div>
        <ul v-else class="available-product-list">
          <li v-for="product in availableProducts.slice(0, 4)" :key="product.id" class="available-product">
            <span class="available-product-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></svg>
            </span>
            <div class="available-product-copy">
              <strong>{{ product.nombre }}</strong>
              <span>{{ product.cantidad }} disponibles</span>
            </div>
            <button class="request-product-button" type="button" @click="openRequest(product)">Solicitar</button>
          </li>
        </ul>
      </article>
    </section>

    <div v-if="requestOpen" class="request-modal-overlay" @click.self="closeRequest">
      <section class="request-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-request-title">
        <h2 id="dashboard-request-title">Solicitar: {{ selectedProduct?.nombre }}</h2>
        <form @submit.prevent="submitRequest">
          <label class="request-field">
            <span>Cantidad</span>
            <input
              v-model.number="requestAmount"
              type="number"
              min="1"
              step="1"
              :max="selectedProduct?.cantidad"
              required
            />
            <small>Disponibles: {{ selectedProduct?.cantidad }} {{ selectedProduct?.unidad_medida }}</small>
            <small
              v-if="selectedProduct && requestAmount > selectedProduct.cantidad"
              class="dashboard-error"
              role="alert"
            >
              No puedes solicitar más de {{ selectedProduct.cantidad }} unidades.
            </small>
          </label>
          <label class="request-field">
            <span>Comentario (opcional)</span>
            <textarea v-model.trim="requestComment" rows="3" placeholder="Indica para qué necesitas el producto"></textarea>
          </label>
          <p v-if="requestError" class="dashboard-error" role="alert">{{ requestError }}</p>
          <div class="request-modal-actions">
            <button type="button" class="request-cancel-button" :disabled="requestSubmitting" @click="closeRequest">Cancelar</button>
            <button
              type="submit"
              class="request-submit-button"
              :disabled="requestSubmitting
                || !selectedProduct
                || !Number.isInteger(requestAmount)
                || requestAmount < 1
                || requestAmount > selectedProduct.cantidad"
            >
              {{ requestSubmitting ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getCurrentUser } from '../../services/authService'
import { getRecentMovements, type MovimientoReciente } from '../../services/dashboardService'
import { getProductos, type Producto } from '../../services/productsService'
import { createSolicitud, getSolicitudes, type SolicitudDTO } from '../../services/requestsService'

const products = ref<Producto[]>([])
const movements = ref<MovimientoReciente[]>([])
const requests = ref<SolicitudDTO[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentUserId = Number(getCurrentUser()?.id || 0)
const requestOpen = ref(false)
const selectedProduct = ref<Producto | null>(null)
const requestAmount = ref(1)
const requestComment = ref('')
const requestError = ref<string | null>(null)
const requestSubmitting = ref(false)

const availableProducts = computed(() => products.value.filter(product =>
  product.estado !== 'INACTIVO' && product.cantidad > 0
))
const exhaustedProducts = computed(() => products.value.filter(product =>
  product.estado !== 'INACTIVO' && product.cantidad <= 0
))
const totalUnits = computed(() => availableProducts.value.reduce((sum, product) => sum + product.cantidad, 0))
const myRequests = computed(() => requests.value.filter(request => request.id_usuario === currentUserId))
const pendingRequests = computed(() => myRequests.value.filter(request => request.estado_solicitud === 'PENDIENTE').length)

onMounted(loadDashboard)

async function loadDashboard() {
  try {
    loading.value = true
    error.value = null
    const [productResult, movementResult, requestResult] = await Promise.allSettled([
      getProductos(),
      getRecentMovements(5),
      getSolicitudes(),
    ])
    const failures: string[] = []

    if (productResult.status === 'fulfilled') products.value = productResult.value
    else failures.push('productos')

    if (movementResult.status === 'fulfilled') movements.value = movementResult.value
    else failures.push('actividad')

    if (requestResult.status === 'fulfilled') requests.value = requestResult.value
    else failures.push('solicitudes')

    if (failures.length) {
      error.value = `No se pudieron cargar ${failures.join(', ')}. Actualiza la página para volver a intentarlo.`
      console.error('Error al cargar el dashboard del usuario:', {
        products: productResult.status === 'rejected' ? productResult.reason : undefined,
        movements: movementResult.status === 'rejected' ? movementResult.reason : undefined,
        requests: requestResult.status === 'rejected' ? requestResult.reason : undefined,
      })
    }
  } finally {
    loading.value = false
  }
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function openRequest(product: Producto) {
  selectedProduct.value = product
  requestAmount.value = 1
  requestComment.value = ''
  requestError.value = null
  requestOpen.value = true
}

function closeRequest() {
  if (!requestSubmitting.value) requestOpen.value = false
}

async function submitRequest() {
  if (!selectedProduct.value || !currentUserId) {
    requestError.value = 'No se pudo identificar el usuario o el producto.'
    return
  }
  if (!Number.isInteger(requestAmount.value)
    || requestAmount.value < 1
    || requestAmount.value > selectedProduct.value.cantidad) {
    requestError.value = 'La cantidad debe estar entre 1 y las unidades disponibles.'
    return
  }

  try {
    requestSubmitting.value = true
    requestError.value = null
    await createSolicitud({
      id_usuario: currentUserId,
      id_producto: selectedProduct.value.id,
      cantidad: requestAmount.value,
      comentario: requestComment.value,
      estado_solicitud: 'PENDIENTE',
    })
    requestOpen.value = false
    await loadDashboard()
  } catch (e: any) {
    console.error(e)
    requestError.value = e?.response?.data?.message || e?.message || 'No se pudo enviar la solicitud.'
  } finally {
    requestSubmitting.value = false
  }
}
</script>

<style scoped>
.user-dashboard { width: 100%; max-width: 1120px; min-width: 0; margin: 0 auto; }
.user-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
.user-metric-card, .user-activity-card, .user-products-card { min-width: 0; border: 1px solid #e0e8f4; border-radius: 9px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.user-metric-card { min-height: 150px; padding: 20px; }
.user-metric-icon { display: grid; width: 38px; height: 38px; place-items: center; margin-bottom: 17px; border-radius: 9px; }
.user-metric-icon svg, .activity-type-icon svg, .available-product-icon svg { width: 20px; height: 20px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.metric-blue { color: #2860f5; background: #e7efff; }
.metric-green { color: #00a98b; background: #dcf8ef; }
.metric-purple { color: #8055ee; background: #eee8ff; }
.metric-amber { color: #e49a00; background: #fff1cf; }
.user-metric-card > p { margin: 0 0 7px; color: #7183a4; font-size: 12px; }
.user-metric-value { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.user-metric-value strong { color: #10234a; font-size: 25px; line-height: 1.1; }
.user-metric-value a, .user-metric-value span { color: #00a98b; font-size: 9px; font-weight: 700; text-decoration: none; white-space: nowrap; }
.user-dashboard-columns { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr); align-items: start; gap: 18px; }
.user-activity-card, .user-products-card { padding: 22px; }
.user-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid #edf1f7; }
.user-card-header h2 { margin: 0; color: #10234a; font-size: 15px; font-weight: 700; }
.user-card-header p { margin: 7px 0 0; color: #7183a4; font-size: 11px; }
.user-card-header > a { color: #00a98b; font-size: 10px; font-weight: 700; text-decoration: none; white-space: nowrap; }
.user-activity-list, .available-product-list { margin: 0; padding: 0; list-style: none; }
.user-activity-item { display: flex; min-height: 64px; align-items: center; gap: 13px; border-bottom: 1px solid #edf1f7; }
.user-activity-item:last-child, .available-product:last-child { border-bottom: 0; }
.activity-type-icon, .available-product-icon { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border-radius: 9px; }
.activity-entrada { color: #00a276; background: #dff8ee; }
.activity-salida { color: #ef5260; background: #ffe4e8; }
.activity-ajuste { color: #a66a00; background: #fff0c7; }
.activity-description, .activity-quantity, .available-product-copy { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.activity-description { flex: 1; }
.activity-description strong, .available-product-copy strong { overflow: hidden; color: #10234a; font-size: 11px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.activity-description > span, .available-product-copy > span { overflow: hidden; color: #7183a4; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.activity-quantity { align-items: flex-end; gap: 6px; }
.activity-quantity strong { color: #10234a; font-size: 10px; }
.activity-quantity time { color: #7183a4; font-size: 9px; white-space: nowrap; }
.available-product { display: flex; min-height: 64px; align-items: center; gap: 12px; border-bottom: 1px solid #edf1f7; }
.available-product-icon { color: #2860f5; background: #e7efff; }
.available-product-copy { flex: 1; }
.request-product-button { padding: 7px 10px; border: 1px solid #d5e0f1; border-radius: 5px; color: #2860f5; font-size: 10px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.request-product-button { background: #fff; cursor: pointer; font-family: inherit; }
.request-product-button:hover { border-color: #2860f5; background: #f5f8ff; }
.dashboard-empty { padding: 28px 8px; color: #7183a4; font-size: 12px; text-align: center; }
.dashboard-error { margin: 0 0 18px; padding: 11px 13px; border: 1px solid #fecaca; border-radius: 7px; color: #b42318; background: #fff3f1; font-size: 12px; }
.request-modal-overlay { position: fixed; z-index: 50; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(16, 35, 74, .45); }
.request-modal { width: min(100%, 440px); padding: 24px; border-radius: 12px; background: #fff; box-shadow: 0 18px 48px rgba(16, 35, 74, .22); }
.request-modal h2 { margin: 0 0 22px; color: #10234a; font-size: 18px; }
.request-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 17px; color: #405574; font-size: 12px; font-weight: 600; }
.request-field input, .request-field textarea { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 1px solid #d5e0f1; border-radius: 7px; color: #354969; background: #fff; font: inherit; font-size: 12px; }
.request-field small { color: #7183a4; font-size: 10px; font-weight: 400; }
.request-modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 22px; }
.request-modal-actions button { min-height: 37px; padding: 0 13px; border: 1px solid #d5e0f1; border-radius: 6px; cursor: pointer; font: inherit; font-size: 11px; font-weight: 600; }
.request-cancel-button { color: #536783; background: #fff; }
.request-submit-button { border-color: #2860f5 !important; color: #fff; background: #2860f5; }
.request-modal-actions button:disabled { cursor: wait; opacity: .6; }
@media (max-width: 1050px) {
  .user-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .user-dashboard-columns { grid-template-columns: minmax(0, 1.2fr) minmax(270px, 1fr); }
}
@media (max-width: 760px) {
  .user-dashboard-columns { grid-template-columns: 1fr; }
}
@media (max-width: 500px) {
  .user-metrics { gap: 10px; }
  .user-metric-card { min-height: 135px; padding: 14px; }
  .user-metric-value { align-items: flex-start; flex-direction: column; gap: 5px; }
  .user-metric-value strong { font-size: 22px; }
  .user-activity-card, .user-products-card { padding: 16px; }
  .user-dashboard-columns { gap: 12px; }
}
</style>
