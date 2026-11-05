<template>
  <div class="admin-dashboard">
    <section class="dashboard-metrics" aria-label="Resumen del inventario">
      <article class="metric-card">
        <span class="metric-icon metric-icon-blue" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></svg>
        </span>
        <p class="metric-label">Total de productos</p>
        <div class="metric-bottom"><strong>{{ loading ? '—' : productos.length }}</strong><span class="metric-note">Productos registrados</span></div>
      </article>

      <article class="metric-card">
        <span class="metric-icon metric-icon-amber" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M10.3 4.4 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></svg>
        </span>
        <p class="metric-label">Bajo stock</p>
        <div class="metric-bottom"><strong>{{ loading ? '—' : bajoStock.length }}</strong><span class="metric-note">Requieren revisión</span></div>
      </article>

      <article class="metric-card">
        <span class="metric-icon metric-icon-green" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M17 3 21 7l-4 4M3 7h18M7 21l-4-4 4-4m14 4H3" /></svg>
        </span>
        <p class="metric-label">Movimientos</p>
        <div class="metric-bottom"><strong>{{ loading ? '—' : movimientosTotales }}</strong><span class="metric-note">Movimientos registrados</span></div>
      </article>

      <article class="metric-card">
        <span class="metric-icon metric-icon-rose" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><path d="M7.5 7.5h.01" /></svg>
        </span>
        <p class="metric-label">Categorías</p>
        <div class="metric-bottom"><strong>{{ loading ? '—' : categoriasActivas }}</strong><span class="metric-note">Categorías activas</span></div>
      </article>
    </section>

    <p v-if="error" class="dashboard-error" role="alert">{{ error }}</p>

    <section class="dashboard-lower">
      <article class="activity-card">
        <header class="activity-header">
          <div>
            <h2>Actividad de inventario</h2>
            <p>Movimientos recientes registrados</p>
          </div>
          <span class="recent-count">5 recientes</span>
        </header>

        <div v-if="loading" class="activity-state">Cargando actividad...</div>
        <div v-else-if="movimientos.length === 0" class="activity-state">No hay movimientos recientes.</div>
        <ul v-else class="activity-list">
          <li v-for="movimiento in movimientos" :key="movimiento.id" class="activity-item">
            <span
              class="activity-icon"
              :class="movimiento.tipo === 'ENTRADA' ? 'activity-icon-in' : movimiento.tipo === 'SALIDA' ? 'activity-icon-out' : 'activity-icon-adjust'"
              aria-hidden="true"
            >
              <svg v-if="movimiento.tipo === 'ENTRADA'" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
              <svg v-else-if="movimiento.tipo === 'SALIDA'" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m6-6-6 6-6-6" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </span>
            <div class="activity-detail">
              <div class="activity-title">
                <strong>{{ movimiento.producto?.nombre || 'Producto' }}</strong>
                <span class="movement-badge" :class="`movement-${movimiento.tipo.toLowerCase()}`">{{ movimiento.tipo }}</span>
              </div>
              <p class="activity-meta">
                <span v-if="movimiento.producto?.codigo">{{ movimiento.producto.codigo }}</span>
                <span v-if="movimiento.producto?.codigo && movimiento.usuario?.nombre" class="meta-dot">·</span>
                <span>{{ movimiento.usuario?.nombre || 'Usuario' }}</span>
              </p>
              <p v-if="shouldShowMovementReason(movimiento.motivo)" class="activity-reason">{{ movimiento.motivo }}</p>
            </div>
            <div class="activity-quantity">
              <strong>{{ movimiento.cantidad }} {{ movimiento.cantidad === 1 ? 'unidad' : 'unidades' }}</strong>
              <time :datetime="movimiento.fecha">{{ formatDate(movimiento.fecha) }}</time>
            </div>
          </li>
        </ul>
      </article>

      <aside class="stock-alert-card">
        <div class="alert-kicker">ATENCIÓN REQUERIDA</div>
        <span class="metric-icon metric-icon-amber alert-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M10.3 4.4 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></svg>
        </span>
        <h2>Alertas de inventario</h2>
        <div class="alert-total">
          <strong>{{ loading ? '—' : bajoStock.length }}</strong>
          <span>productos con bajo stock</span>
        </div>
        <p>Revisa las existencias que requieren atención en tu inventario.</p>
        <RouterLink class="products-link" to="/admin/products">
          Ir a productos
          <span aria-hidden="true">→</span>
        </RouterLink>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getCategorias, type Categoria } from '../../services/categoriesService'
import { getMovimientos } from '../../services/movementsService'
import { getProductos, type Producto } from '../../services/productsService'
import { getRecentMovements, type MovimientoReciente } from '../../services/dashboardService'
import ReportsService from '../../services/ReportsService'
import './Dashboard.css'

function shouldShowMovementReason(reason?: string) {
  return Boolean(reason && !/^Solicitud aprobada id\s+\d+$/i.test(reason.trim()))
}

const productos = ref<Producto[]>([])
const categorias = ref<Categoria[]>([])
const bajoStock = ref<Producto[]>([])
const movimientosTotales = ref(0)
const movimientos = ref<MovimientoReciente[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const categoriasActivas = computed(() =>
  categorias.value.filter(categoria => !categoria.estado || categoria.estado === 'ACTIVO').length,
)

onMounted(loadDashboard)

async function loadDashboard() {
  try {
    error.value = null
    loading.value = true
    const [listaProductos, listaCategorias, listaBajoStock, listaMovimientos, actividad] = await Promise.all([
      getProductos(),
      getCategorias(),
      ReportsService.getLowStockReport(),
      getMovimientos(),
      getRecentMovements(5),
    ])
    productos.value = listaProductos
    categorias.value = listaCategorias
    bajoStock.value = listaBajoStock
    movimientosTotales.value = listaMovimientos.length
    movimientos.value = actividad
  } catch (cause) {
    console.error('No se pudo cargar el dashboard', cause)
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la información del dashboard.'
  } finally {
    loading.value = false
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida'
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(date)
}
</script>
