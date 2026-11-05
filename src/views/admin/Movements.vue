<template>
  <section class="movement-page">
    <h1 class="page-title">Movimientos</h1>

    <div class="movement-panel">
      <header class="panel-header">
        <div>
          <h2>Historial de movimientos</h2>
          <p>Registro completo de operaciones del inventario.</p>
        </div>
        <button
          class="filter-button"
          type="button"
          :aria-expanded="filtersOpen"
          @click="filtersOpen = !filtersOpen"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z" /></svg>
          {{ filtersOpen ? 'Ocultar filtros' : 'Filtrar movimientos' }}
        </button>
      </header>

      <form v-if="filtersOpen" class="movement-filters" @submit.prevent="buscar">
        <label class="filter-field">
          <span>Desde</span>
          <input type="date" v-model="fechaInicio" />
        </label>
        <label class="filter-field">
          <span>Hasta</span>
          <input type="date" v-model="fechaFin" />
        </label>
        <label class="filter-field">
          <span>Tipo</span>
          <select v-model="tipo">
            <option value="TODOS">Todos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </label>
        <label class="filter-field">
          <span>Producto</span>
          <select v-model.number="idProducto">
            <option :value="undefined">Todos</option>
            <option v-for="product in products" :key="product.id" :value="product.id">{{ product.nombre }}</option>
          </select>
        </label>
        <div class="filter-actions">
          <button class="filter-submit" type="submit" :disabled="loading">
            {{ loading ? 'Buscando...' : 'Aplicar filtros' }}
          </button>
          <button class="filter-reset" type="button" @click="limpiar" :disabled="loading">Limpiar</button>
        </div>
      </form>

      <p v-if="error" class="movement-error" role="alert">{{ error }}</p>
      <p v-if="productsError" class="movement-error" role="alert">{{ productsError }}</p>

      <div class="movement-table-wrap">
        <table class="movement-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Detalle</th>
              <th>Responsable</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="movement in data" :key="movement.id">
              <td>
                <span class="movement-badge" :class="`badge-${movement.tipo.toLowerCase()}`">
                  <svg v-if="movement.tipo === 'ENTRADA'" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14m-7-7 7 7 7-7" /></svg>
                  <svg v-else-if="movement.tipo === 'SALIDA'" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m-7 7 7-7 7 7" /></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7h11l-3-3m3 3-3 3M17 17H6l3 3m-3-3 3-3" /></svg>
                  {{ tipoLabel(movement.tipo) }}
                </span>
              </td>
              <td>
                <div class="movement-product">
                  <strong>{{ movement.producto?.nombre || 'Producto no disponible' }}</strong>
                  <span>{{ movement.producto?.codigo || '—' }}</span>
                </div>
              </td>
              <td>
                <div class="movement-detail">
                  <strong :class="quantityClass(movement)">
                    {{ quantityPrefix(movement) }}{{ movement.cantidad }}
                  </strong>
                  <span>{{ movement.motivo || 'Sin descripción' }}</span>
                </div>
              </td>
              <td>{{ movement.usuario?.nombre || '—' }}</td>
              <td>{{ formatDate(movement.fecha) }}</td>
              <td>
                <button
                  class="adjust-button"
                  type="button"
                  @click="openAdjust(movement)"
                  :disabled="saving"
                  :aria-label="`Ajustar movimiento de ${movement.producto?.nombre || 'producto'}`"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m16 4 4 4M4 20l4-.8L19.5 7.7a2.12 2.12 0 0 0-3-3L5.2 16 4 20Z" /></svg>
                  Ajustar
                </button>
              </td>
            </tr>
            <tr v-if="loading && data.length === 0">
              <td colspan="6" class="empty-row">Cargando movimientos...</td>
            </tr>
            <tr v-else-if="!loading && data.length === 0">
              <td colspan="6" class="empty-row">No hay movimientos para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="adjustModalOpen" class="modal-overlay" @click.self="closeAdjust">
      <section class="adjust-modal" role="dialog" aria-modal="true" aria-labelledby="adjust-title">
        <h2 id="adjust-title" class="modal-title">Ajustar movimiento</h2>
        <p class="modal-subtitle">
          {{ selectedMovement?.producto?.nombre }} · {{ tipoLabel(selectedMovement?.tipo || 'AJUSTE') }}
        </p>
        <form class="adjust-form" @submit.prevent="saveAdjustment">
          <label class="adjust-field">
            <span>Cantidad *</span>
            <input v-model.number="adjustmentForm.cantidad" type="number" min="1" step="1" required />
          </label>
          <label class="adjust-field">
            <span>Descripción *</span>
            <textarea v-model.trim="adjustmentForm.motivo" rows="4" required maxlength="500" placeholder="Describe el motivo del ajuste" />
          </label>
          <p v-if="adjustError" class="movement-error" role="alert">{{ adjustError }}</p>
          <div class="modal-actions">
            <button class="modal-cancel" type="button" @click="closeAdjust" :disabled="saving">Cancelar</button>
            <button class="modal-save" type="submit" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar ajuste' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ReportsService, { type MovimientoReporte } from '../../services/ReportsService'
import { getProductos, type Producto } from '../../services/productsService'
import { updateMovimiento, type TipoMovimiento } from '../../services/movementsService'

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const productsError = ref<string | null>(null)
const adjustError = ref<string | null>(null)
const filtersOpen = ref(false)
const adjustModalOpen = ref(false)
const selectedMovement = ref<MovimientoReporte | null>(null)

const fechaInicio = ref<string | undefined>()
const fechaFin = ref<string | undefined>()
const tipo = ref<'TODOS' | TipoMovimiento>('TODOS')
const idProducto = ref<number | undefined>()
const products = ref<Producto[]>([])
const data = ref<MovimientoReporte[]>([])
const adjustmentForm = ref({ cantidad: 1, motivo: '' })

onMounted(async () => {
  await Promise.all([loadProducts(), buscar()])
})

async function loadProducts() {
  try {
    productsError.value = null
    products.value = await getProductos()
  } catch (e: any) {
    console.error(e)
    productsError.value = e?.message || 'Error al cargar productos para los filtros'
  }
}

async function buscar() {
  error.value = null
  if (fechaInicio.value && fechaFin.value && fechaInicio.value > fechaFin.value) {
    error.value = 'La fecha de inicio no puede ser posterior a la fecha final'
    return
  }

  try {
    loading.value = true
    data.value = await ReportsService.getMovementReport({
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFin.value,
      tipoMovimiento: tipo.value === 'TODOS' ? undefined : tipo.value,
      idProducto: idProducto.value,
    })
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar movimientos'
  } finally {
    loading.value = false
  }
}

async function limpiar() {
  fechaInicio.value = undefined
  fechaFin.value = undefined
  tipo.value = 'TODOS'
  idProducto.value = undefined
  await buscar()
}

function openAdjust(movement: MovimientoReporte) {
  selectedMovement.value = movement
  adjustmentForm.value = {
    cantidad: movement.cantidad,
    motivo: movement.motivo || ''
  }
  adjustError.value = null
  adjustModalOpen.value = true
}

function closeAdjust() {
  if (saving.value) return
  adjustModalOpen.value = false
  selectedMovement.value = null
  adjustError.value = null
}

async function saveAdjustment() {
  if (!selectedMovement.value) {
    adjustError.value = 'No hay un movimiento seleccionado'
    return
  }
  if (!Number.isInteger(adjustmentForm.value.cantidad) || adjustmentForm.value.cantidad < 1) {
    adjustError.value = 'La cantidad debe ser un número entero mayor que cero'
    return
  }
  if (!adjustmentForm.value.motivo.trim()) {
    adjustError.value = 'Escribe una descripción para el ajuste'
    return
  }

  try {
    saving.value = true
    adjustError.value = null
    await updateMovimiento(selectedMovement.value.id, {
      cantidad: adjustmentForm.value.cantidad,
      motivo: adjustmentForm.value.motivo.trim()
    })
    adjustModalOpen.value = false
    selectedMovement.value = null
    await buscar()
  } catch (e: any) {
    console.error(e)
    adjustError.value = e?.message || 'No se pudo actualizar el movimiento'
  } finally {
    saving.value = false
  }
}

function tipoLabel(value: TipoMovimiento) {
  if (value === 'ENTRADA') return 'Entrada'
  if (value === 'SALIDA') return 'Salida'
  return 'Ajuste'
}

function quantityPrefix(movement: MovimientoReporte) {
  if (movement.tipo === 'ENTRADA') return '+'
  if (movement.tipo === 'SALIDA') return '-'
  return ''
}

function quantityClass(movement: MovimientoReporte) {
  if (movement.tipo === 'ENTRADA') return 'quantity-in'
  if (movement.tipo === 'SALIDA') return 'quantity-out'
  return 'quantity-adjust'
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<style scoped>
.movement-page { width: min(100%, 1120px); margin: 0 auto; }
.page-title { margin: 8px 0 20px; color: #10234a; font-size: 20px; font-weight: 700; }
.movement-panel { padding: 24px; border: 1px solid #e0e8f4; border-radius: 10px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.panel-header h2 { margin: 0; color: #10234a; font-size: 15px; font-weight: 700; }
.panel-header p { margin: 7px 0 0; color: #7183a4; font-size: 11px; }
.filter-button { display: inline-flex; min-height: 38px; flex: 0 0 auto; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid #d5e0f1; border-radius: 7px; color: #334765; background: #fff; cursor: pointer; font: inherit; font-size: 10px; font-weight: 600; }
.filter-button:hover, .filter-reset:hover { border-color: #2860f5; color: #2860f5; }
.filter-button svg { width: 14px; height: 14px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.movement-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; align-items: end; gap: 10px; margin-bottom: 18px; padding: 14px; border: 1px solid #e4ebf5; border-radius: 8px; background: #f8faff; }
.filter-field { display: flex; min-width: 0; flex-direction: column; gap: 6px; color: #536783; font-size: 10px; font-weight: 600; }
.filter-field input, .filter-field select { width: 100%; min-height: 36px; padding: 7px 9px; border: 1px solid #d5e0f1; border-radius: 6px; color: #354969; background: #fff; font: inherit; font-size: 10px; }
.filter-actions { display: flex; gap: 7px; }
.filter-submit, .filter-reset { min-height: 36px; padding: 0 10px; border: 1px solid #2860f5; border-radius: 6px; color: #fff; background: #2860f5; cursor: pointer; font: inherit; font-size: 10px; font-weight: 600; white-space: nowrap; }
.filter-reset { color: #2860f5; background: #fff; }
.filter-submit:disabled, .filter-reset:disabled { cursor: wait; opacity: .6; }
.movement-error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 7px; color: #b42318; background: #fff3f1; font-size: 12px; }
.movement-table-wrap { overflow-x: auto; }
.movement-table { width: 100%; min-width: 740px; border-collapse: collapse; text-align: left; }
.movement-table thead { border-bottom: 1px solid #e4ebf5; }
.movement-table th { height: 36px; padding: 0 10px; color: #7d8ca7; font-size: 9px; font-weight: 650; letter-spacing: .6px; text-transform: uppercase; white-space: nowrap; }
.movement-table td { height: 58px; padding: 8px 10px; border-bottom: 1px solid #e7edf6; color: #405574; font-size: 10px; }
.movement-table tbody tr { transition: background-color 120ms ease; }
.movement-table tbody tr:hover { background: #f7f9fe; }
.movement-badge { display: inline-flex; min-height: 23px; align-items: center; gap: 5px; padding: 0 9px; border-radius: 999px; font-size: 9px; font-weight: 650; white-space: nowrap; }
.movement-badge svg { width: 12px; height: 12px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.badge-entrada { color: #00966d; background: #dff8ee; }
.badge-salida { color: #d83c50; background: #ffe4e8; }
.badge-ajuste { color: #a66a00; background: #fff0c7; }
.movement-product, .movement-detail { display: flex; min-width: 120px; flex-direction: column; gap: 5px; }
.movement-product strong, .movement-detail strong { color: #10234a; font-size: 10px; font-weight: 650; }
.movement-product span, .movement-detail span { color: #7183a4; font-size: 9px; }
.movement-detail .quantity-in { color: #00966d; }
.movement-detail .quantity-out { color: #d83c50; }
.movement-detail .quantity-adjust { color: #a66a00; }
.adjust-button { display: inline-flex; min-height: 31px; align-items: center; gap: 5px; padding: 0 9px; border: 1px solid #d5e0f1; border-radius: 6px; color: #2860f5; background: #fff; cursor: pointer; font: inherit; font-size: 9px; font-weight: 650; white-space: nowrap; }
.adjust-button:hover { border-color: #2860f5; background: #f4f7ff; }
.adjust-button:disabled { cursor: wait; opacity: .6; }
.adjust-button svg { width: 13px; height: 13px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.empty-row { height: 100px !important; color: #7183a4 !important; text-align: center; }
.modal-overlay { position: fixed; z-index: 100; display: grid; overflow-y: auto; padding: 24px; background: rgba(16, 35, 74, .42); inset: 0; place-items: center; }
.adjust-modal { width: min(100%, 480px); max-height: calc(100vh - 48px); overflow-y: auto; padding: 24px; border: 1px solid #e0e8f4; border-radius: 12px; background: #fff; box-shadow: 0 18px 55px rgba(16, 35, 74, .22); }
.modal-title { margin: 0; color: #10234a; font-size: 18px; font-weight: 700; }
.modal-subtitle { margin: 7px 0 20px; color: #7183a4; font-size: 11px; }
.adjust-form { display: flex; flex-direction: column; gap: 15px; }
.adjust-field { display: flex; flex-direction: column; gap: 7px; color: #334765; font-size: 12px; font-weight: 600; }
.adjust-field input, .adjust-field textarea { width: 100%; min-height: 40px; padding: 9px 11px; border: 1px solid #d5e0f1; border-radius: 7px; outline: 0; color: #243858; background: #fff; font: inherit; font-size: 12px; }
.adjust-field input:focus, .adjust-field textarea:focus { border-color: #2860f5; box-shadow: 0 0 0 3px rgba(40, 96, 245, .1); }
.modal-actions { display: flex; justify-content: flex-end; gap: 9px; }
.modal-cancel, .modal-save { min-height: 38px; padding: 0 15px; border: 1px solid #d5e0f1; border-radius: 7px; color: #405574; background: #fff; cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.modal-save { border-color: #2860f5; color: #fff; background: #2860f5; }
.modal-cancel:disabled, .modal-save:disabled { cursor: wait; opacity: .6; }
@media (max-width: 900px) { .movement-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } .filter-actions { grid-column: 1 / -1; } }
@media (max-width: 520px) { .movement-panel { padding: 18px 14px; } .panel-header { align-items: stretch; flex-direction: column; } .filter-button { align-self: flex-start; } .movement-filters { grid-template-columns: 1fr; } .filter-actions { grid-column: auto; } .filter-actions > button { flex: 1; } }
</style>
