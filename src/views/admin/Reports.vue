<template>
  <section class="reports-page">
    <h1 class="reports-page-title">Reportes</h1>

    <section class="reports-selector">
      <header class="reports-section-header">
        <div>
          <h2>Reportes de inventario</h2>
          <p>Genera información lista para analizar o compartir.</p>
        </div>
      </header>

      <div class="report-cards">
        <button
          v-for="report in reportTypes"
          :key="report.id"
          class="report-card"
          :class="{ selected: selectedReport === report.id }"
          type="button"
          @click="selectReport(report.id)"
        >
          <span class="report-icon" :class="`icon-${report.id}`">
            <svg v-if="report.id === 'inventory'" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></svg>
            <svg v-else-if="report.id === 'movements'" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h15l-3-3m3 3-3 3M20 16H5l3 3m-3-3 3-3" /></svg>
            <svg v-else-if="report.id === 'low'" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10.3 4.3-8 14A1.8 1.8 0 0 0 3.9 21h16.2a1.8 1.8 0 0 0 1.6-2.7l-8-14a1.9 1.9 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87m-1-12.13a4 4 0 0 1 0 7.75" /></svg>
          </span>
          <strong>{{ report.title }}</strong>
          <span class="report-description">{{ report.description }}</span>
          <span class="report-card-cta">{{ selectedReport === report.id ? 'Reporte seleccionado' : 'Abrir reporte' }} <span aria-hidden="true">›</span></span>
        </button>
      </div>
    </section>

    <section class="report-results">
      <header class="results-header">
        <h2>{{ selectedReportTitle }}</h2>
        <div v-if="selectedReport === 'inventory' || selectedReport === 'low' || selectedReport === 'topProduct'" class="results-actions">
          <button
            v-if="selectedReport === 'inventory' || selectedReport === 'low'"
            class="result-button"
            type="button"
            :aria-expanded="filtersOpen"
            @click="filtersOpen = !filtersOpen"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z" /></svg>
            {{ filtersOpen ? 'Ocultar filtros' : 'Filtros' }}
          </button>
          <button class="result-button" type="button" @click="exportSelected('pdf')" :disabled="selectedLoading || !hasSelectedData">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 15h2a1 1 0 0 0 0-2H8v4m5 0v-4h1a2 2 0 0 1 0 4h-1m4 0v-4h3m-3 2h2" /></svg>
            PDF
          </button>
          <button class="result-button" type="button" @click="exportSelected('excel')" :disabled="selectedLoading || !hasSelectedData">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13l4 6m0-6-4 6m7-6v6m3-6v6m-3-3h3" /></svg>
            Excel
          </button>
          <button class="refresh-report" type="button" @click="loadSelected" :disabled="selectedLoading">
            {{ selectedLoading ? 'Cargando...' : 'Actualizar' }}
          </button>
        </div>
      </header>

      <p v-if="selectedReport === 'topProduct'" class="top-product-explanation">
        Cada entrada, salida o ajuste cuenta como una operación. El total no representa unidades, sino cuántas operaciones se registraron para ese producto.
      </p>

      <div v-if="selectedReport === 'movements'" class="movement-filters">
        <label class="report-field movement-date-field">
          <span>Rango de fechas</span>
          <div class="movement-date-range">
            <input type="date" v-model="mv.fechaInicio" aria-label="Fecha inicial" />
            <span aria-hidden="true">→</span>
            <input type="date" v-model="mv.fechaFin" aria-label="Fecha final" />
          </div>
        </label>
        <label class="report-field">
          <span>Tipo de movimiento</span>
          <select v-model="mv.tipo">
            <option value="TODOS">Todos los movimientos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
            <option value="AJUSTE">Ajustes</option>
          </select>
        </label>
        <label class="report-field">
          <span>Producto</span>
          <select v-model="mv.idProducto">
            <option :value="undefined">Todos los productos</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              {{ product.nombre }} ({{ product.codigo }})
            </option>
          </select>
        </label>
        <div class="movement-filter-actions">
          <button class="movement-search-button" type="button" @click="loadMovements" :disabled="selectedLoading">
            {{ selectedLoading ? 'Buscando...' : 'Buscar' }}
          </button>
          <button class="movement-clear-button" type="button" @click="clearMovementFilters" :disabled="selectedLoading">
            Limpiar
          </button>
          <button class="movement-export-button" type="button" @click="exportSelected('pdf')" :disabled="selectedLoading || !hasSelectedData">
            Exportar PDF
          </button>
          <button class="movement-export-button" type="button" @click="exportSelected('excel')" :disabled="selectedLoading || !hasSelectedData">
            Exportar Excel
          </button>
        </div>
      </div>

      <div v-if="filtersOpen && (selectedReport === 'inventory' || selectedReport === 'low')" class="report-filters">
        <template v-if="selectedReport === 'inventory'">
          <label class="report-field">
            <span>Categoría</span>
            <select v-model="inventoryFilters.idCategoria">
              <option :value="undefined">Todas las categorías</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.nombre }}</option>
            </select>
          </label>
          <label class="report-field">
            <span>Estado</span>
            <select v-model="inventoryFilters.estado">
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </label>
        </template>
        <template v-else>
          <label class="report-field">
            <span>Categoría</span>
            <select v-model="lowFilters.idCategoria">
              <option :value="undefined">Todas las categorías</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.nombre }}</option>
            </select>
          </label>
          <label class="report-field">
            <span>Nivel de alerta</span>
            <input type="number" v-model.number="lowFilters.nivelAlerta" min="0" placeholder="Predeterminado" />
          </label>
        </template>
        <button class="apply-filters" type="button" @click="loadSelected" :disabled="selectedLoading">
          {{ selectedLoading ? 'Aplicando...' : 'Aplicar filtros' }}
        </button>
      </div>

      <p v-if="error" class="report-error" role="alert">{{ error }}</p>
      <p v-if="categoriesError" class="report-error" role="alert">{{ categoriesError }}</p>
      <p v-if="selectedReport === 'movements' && productsError" class="report-error" role="alert">{{ productsError }}</p>

      <div class="report-table-wrap">
        <table v-if="selectedReport === 'inventory'" class="report-table">
          <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Stock actual</th><th>Mínimo requerido</th><th>Estado</th></tr></thead>
          <tbody>
            <tr v-for="product in inventory" :key="product.id">
              <td>{{ product.codigo }}</td>
              <td class="report-product">{{ product.nombre }}</td>
              <td>{{ product.categoria }}</td>
              <td>{{ product.cantidad }} {{ product.unidad_medida }}</td>
              <td>{{ product.cantidad_minima }} {{ product.unidad_medida }}</td>
              <td><span class="table-state" :class="product.estado === 'ACTIVO' ? 'active' : 'inactive'">{{ product.estado }}</span></td>
            </tr>
            <tr v-if="!selectedLoading && inventory.length === 0"><td colspan="6" class="empty-report">{{ hasLoaded.inventory ? 'No hay productos para estos filtros.' : 'Sin datos. Carga el reporte para comenzar.' }}</td></tr>
            <tr v-if="selectedLoading && inventory.length === 0"><td colspan="6" class="empty-report">Cargando inventario...</td></tr>
          </tbody>
        </table>

        <table v-else-if="selectedReport === 'movements'" class="report-table">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Código</th><th>Cantidad</th><th>Usuario</th><th>Motivo</th></tr></thead>
          <tbody>
            <tr v-for="movement in movements" :key="movement.id">
              <td>{{ formatDate(movement.fecha) }}</td>
              <td><span class="movement-type" :class="`type-${movement.tipo.toLowerCase()}`">{{ movement.tipo }}</span></td>
              <td class="report-product">{{ movement.producto?.nombre }}</td>
              <td>{{ movement.producto?.codigo }}</td>
              <td>{{ movement.cantidad }}</td>
              <td>{{ movement.usuario?.nombre }}</td>
              <td>{{ movement.motivo || '—' }}</td>
            </tr>
            <tr v-if="!selectedLoading && movements.length === 0"><td colspan="7" class="empty-report">{{ hasLoaded.movements ? 'No hay movimientos para estos filtros.' : 'Sin datos. Aplica los filtros para comenzar.' }}</td></tr>
            <tr v-if="selectedLoading && movements.length === 0"><td colspan="7" class="empty-report">Cargando movimientos...</td></tr>
          </tbody>
        </table>

        <table v-else-if="selectedReport === 'low'" class="report-table">
          <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Stock actual</th><th>Mínimo requerido</th><th>Diferencia</th></tr></thead>
          <tbody>
            <tr v-for="product in lowStock" :key="product.id">
              <td>{{ product.codigo }}</td>
              <td class="report-product">{{ product.nombre }}</td>
              <td>{{ product.categoria }}</td>
              <td>{{ product.cantidad }} {{ product.unidad_medida }}</td>
              <td>{{ product.cantidad_minima }} {{ product.unidad_medida }}</td>
              <td :class="product.cantidad - product.cantidad_minima < 0 ? 'difference-low' : 'difference-ok'">{{ product.cantidad - product.cantidad_minima }}</td>
            </tr>
            <tr v-if="!selectedLoading && lowStock.length === 0"><td colspan="6" class="empty-report">{{ hasLoaded.low ? 'No hay productos con stock bajo.' : 'Sin datos. Carga el reporte para comenzar.' }}</td></tr>
            <tr v-if="selectedLoading && lowStock.length === 0"><td colspan="6" class="empty-report">Cargando stock mínimo...</td></tr>
          </tbody>
        </table>

        <table v-else class="report-table">
          <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Operaciones registradas</th></tr></thead>
          <tbody>
            <tr v-if="topProduct">
              <td>{{ topProduct.producto.codigo || '—' }}</td>
              <td class="report-product">{{ topProduct.producto.nombre || 'Producto' }}</td>
              <td>{{ typeof topProduct.producto.categoria === 'object' ? topProduct.producto.categoria?.nombre : topProduct.producto.categoria || '—' }}</td>
              <td>{{ topProduct.totalMovimientos }}</td>
            </tr>
            <tr v-if="!selectedLoading && !topProduct"><td colspan="4" class="empty-report">{{ hasLoaded.topProduct ? 'No hay movimientos registrados.' : 'Sin datos. Carga el reporte para comenzar.' }}</td></tr>
            <tr v-if="selectedLoading && !topProduct"><td colspan="4" class="empty-report">Cargando reporte...</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import './Reports.css'
import ReportsService, { type ProductoReporte, type MovimientoReporte, type ProductoMasMovimientosReporte } from '../../services/ReportsService'
import type jsPDF from 'jspdf'

async function loadExportLibs() {
  const [pdf, table, xlsx] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('xlsx')
  ])
  return { jsPDF: pdf.default, autoTable: table.default, XLSX: xlsx }
}

function currentPageNumber(doc: jsPDF): number {
  const internal = doc.internal as unknown as { getCurrentPageInfo: () => { pageNumber: number } }
  return internal.getCurrentPageInfo().pageNumber
}
import { getCategorias, type Categoria } from '../../services/categoriesService'
import { getProductos, type Producto } from '../../services/productsService'

const loading = ref({ inventory: false, movements: false, low: false, topProduct: false })
const error = ref<string | null>(null)
const categoriesError = ref<string | null>(null)
const productsError = ref<string | null>(null)
const filtersOpen = ref(false)
const selectedReport = ref<'inventory' | 'movements' | 'low' | 'topProduct'>('inventory')
const hasLoaded = ref({ inventory: false, movements: false, low: false, topProduct: false })

const inventory = ref<ProductoReporte[]>([])
const movements = ref<MovimientoReporte[]>([])
const lowStock = ref<ProductoReporte[]>([])
const topProduct = ref<ProductoMasMovimientosReporte | null>(null)
const categories = ref<Categoria[]>([])
const products = ref<Producto[]>([])
const inventoryFilters = ref<{ idCategoria?: number; estado: string }>({ estado: '' })
const lowFilters = ref<{ idCategoria?: number; nivelAlerta?: number }>({})

const mv = ref<{ fechaInicio?: string; fechaFin?: string; tipo: 'TODOS' | 'ENTRADA' | 'SALIDA' | 'AJUSTE'; idProducto?: number }>({ tipo: 'TODOS' })

const reportTypes = [
  { id: 'inventory' as const, title: 'Inventario general', description: 'Consulta existencias, categorías y estado de los productos.' },
  { id: 'movements' as const, title: 'Movimientos', description: 'Analiza entradas, salidas y ajustes por periodo.' },
  { id: 'low' as const, title: 'Stock mínimo', description: 'Identifica productos que requieren reposición.' },
  { id: 'topProduct' as const, title: 'Producto con más movimientos', description: 'Consulta el producto con mayor número de movimientos activos.' },
]

const selectedReportTitle = computed(() => reportTypes.find(report => report.id === selectedReport.value)?.title || '')
const selectedLoading = computed(() => loading.value[selectedReport.value])
const hasSelectedData = computed(() => {
  if (selectedReport.value === 'inventory') return inventory.value.length > 0
  if (selectedReport.value === 'movements') return movements.value.length > 0
  if (selectedReport.value === 'low') return lowStock.value.length > 0
  return topProduct.value !== null
})

function selectReport(report: 'inventory' | 'movements' | 'low' | 'topProduct') {
  selectedReport.value = report
  error.value = null
  if (!hasLoaded.value[report]) void loadSelected()
}

function loadSelected() {
  if (selectedReport.value === 'inventory') return loadInventory()
  if (selectedReport.value === 'movements') return loadMovements()
  if (selectedReport.value === 'low') return loadLow()
  return loadTopProduct()
}

async function loadInventory() {
  try {
    loading.value.inventory = true
    error.value = null
    inventory.value = await ReportsService.getInventoryReport({
      idCategoria: inventoryFilters.value.idCategoria,
      estado: inventoryFilters.value.estado || undefined,
    })
    hasLoaded.value.inventory = true
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar el reporte de inventario'
  } finally {
    loading.value.inventory = false
  }
}

async function loadMovements() {
  if (mv.value.fechaInicio && mv.value.fechaFin && mv.value.fechaInicio > mv.value.fechaFin) {
    error.value = 'La fecha inicial no puede ser posterior a la fecha final.'
    return
  }
  try {
    loading.value.movements = true
    error.value = null
    const params = {
      fechaInicio: mv.value.fechaInicio,
      fechaFin: mv.value.fechaFin,
      tipoMovimiento: mv.value.tipo === 'TODOS' ? undefined : mv.value.tipo,
      idProducto: mv.value.idProducto,
    }
    movements.value = await ReportsService.getMovementReport(params)
    hasLoaded.value.movements = true
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar el reporte de movimientos'
  } finally {
    loading.value.movements = false
  }
}

function clearMovementFilters() {
  mv.value = { tipo: 'TODOS' }
  void loadMovements()
}

async function loadLow() {
  try {
    loading.value.low = true
    error.value = null
    lowStock.value = await ReportsService.getLowStockReport(lowFilters.value)
    hasLoaded.value.low = true
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar el reporte de stock mínimo'
  } finally {
    loading.value.low = false
  }
}

async function loadTopProduct() {
  try {
    loading.value.topProduct = true
    error.value = null
    topProduct.value = await ReportsService.getProductWithMostMovementsReport()
    hasLoaded.value.topProduct = true
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar el reporte de productos con más movimientos'
  } finally {
    loading.value.topProduct = false
  }
}

function exportSelected(format: 'pdf' | 'excel') {
  if (selectedReport.value === 'inventory') return exportInventory(format)
  if (selectedReport.value === 'movements') return exportMovements(format)
  if (selectedReport.value === 'low') return exportLow(format)
  return exportTopProduct(format)
}

// Export helpers
async function exportInventory(format: 'pdf'|'excel') {
  const { jsPDF, autoTable, XLSX } = await loadExportLibs()
  if (format === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const generatedAt = new Date()
    const dateLabel = generatedAt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    const categoryCount = new Set(inventory.value.map(product => product.categoria)).size
    const productsWithStock = inventory.value.filter(product => product.cantidad > 0).length

    doc.setFillColor(16, 35, 74)
    doc.rect(0, 0, pageWidth, 43, 'F')
    doc.setFillColor(40, 96, 245)
    doc.rect(0, 41, pageWidth, 2, 'F')
    doc.setTextColor(177, 201, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('GESTIÓN DE INVENTARIO', 14, 13)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(21)
    doc.text('Reporte de Inventario', 14, 25)
    doc.setTextColor(221, 230, 247)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Resumen de productos y existencias registradas', 14, 33)
    doc.setFontSize(9)
    doc.text(`Generado el ${dateLabel}`, pageWidth - 14, 25, { align: 'right' })

    const summaryCards = [
      { label: 'PRODUCTOS', value: String(inventory.value.length) },
      { label: 'CON EXISTENCIAS', value: String(productsWithStock) },
      { label: 'CATEGORÍAS', value: String(categoryCount) },
    ]
    const cardGap = 5
    const cardWidth = (pageWidth - 28 - cardGap * 2) / summaryCards.length
    summaryCards.forEach((card, index) => {
      const x = 14 + index * (cardWidth + cardGap)
      doc.setFillColor(246, 248, 252)
      doc.roundedRect(x, 49, cardWidth, 24, 2, 2, 'F')
      doc.setTextColor(104, 123, 153)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(card.label, x + 5, 57)
      doc.setTextColor(16, 35, 74)
      doc.setFontSize(14)
      doc.text(card.value, x + 5, 68)
    })

    const columns = ['Código', 'Producto', 'Categoría', 'Stock']
    const rows = inventory.value.map(product => [
      product.codigo,
      product.nombre,
      product.categoria,
      product.cantidad,
    ])
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 81,
      margin: { left: 14, right: 14, bottom: 15 },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        textColor: [53, 73, 105],
        lineColor: [229, 235, 244],
        lineWidth: 0.15,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [40, 96, 245],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 4,
      },
      alternateRowStyles: { fillColor: [246, 248, 252] },
      columnStyles: {
        0: { cellWidth: 48 },
        2: { cellWidth: 52 },
        3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: () => {
        const pageNumber = currentPageNumber(doc)
        doc.setDrawColor(229, 235, 244)
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)
        doc.setTextColor(113, 131, 164)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text('Reporte de Inventario', 14, pageHeight - 7)
        doc.text(`Página ${pageNumber}`, pageWidth - 14, pageHeight - 7, { align: 'right' })
      },
    })
    doc.save(`reporte-inventario-${new Date().toISOString().slice(0,10)}.pdf`)
  } else {
    const worksheetData = inventory.value.map(p => ({
      Código: p.codigo,
      Producto: p.nombre,
      Categoría: p.categoria,
      Stock: p.cantidad,
    }))
    const ws = XLSX.utils.json_to_sheet(worksheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    XLSX.writeFile(wb, `reporte-inventario-${new Date().toISOString().slice(0,10)}.xlsx`)
  }
}

async function exportMovements(format: 'pdf'|'excel') {
  const { jsPDF, autoTable, XLSX } = await loadExportLibs()
  const movementCounts = movements.value.reduce(
    (counts, movement) => {
      counts[movement.tipo] += 1
      return counts
    },
    { ENTRADA: 0, SALIDA: 0, AJUSTE: 0 },
  )
  const movementPeriod = getMovementPeriodLabel()

  if (format === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const generatedAt = new Date()
    const dateLabel = generatedAt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    doc.setFillColor(16, 35, 74)
    doc.rect(0, 0, pageWidth, 43, 'F')
    doc.setFillColor(0, 169, 139)
    doc.rect(0, 41, pageWidth, 2, 'F')
    doc.setTextColor(177, 201, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('GESTIÓN DE INVENTARIO', 14, 13)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(21)
    doc.text('Reporte de Movimientos', 14, 25)
    doc.setTextColor(221, 230, 247)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periodo: ${movementPeriod}`, 14, 34)
    doc.text(`Generado el ${dateLabel}`, pageWidth - 14, 25, { align: 'right' })

    const summaryCards = [
      { label: 'MOVIMIENTOS', value: String(movements.value.length) },
      { label: 'ENTRADAS', value: String(movementCounts.ENTRADA) },
      { label: 'SALIDAS', value: String(movementCounts.SALIDA) },
      { label: 'AJUSTES', value: String(movementCounts.AJUSTE) },
    ]
    const cardGap = 5
    const cardWidth = (pageWidth - 28 - cardGap * (summaryCards.length - 1)) / summaryCards.length
    summaryCards.forEach((card, index) => {
      const x = 14 + index * (cardWidth + cardGap)
      doc.setFillColor(246, 248, 252)
      doc.roundedRect(x, 49, cardWidth, 24, 2, 2, 'F')
      doc.setTextColor(104, 123, 153)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(card.label, x + 5, 57)
      doc.setTextColor(16, 35, 74)
      doc.setFontSize(14)
      doc.text(card.value, x + 5, 68)
    })

    const columns = ['Fecha y hora', 'Tipo de movimiento', 'Producto', 'Código', 'Cantidad', 'Registrado por', 'Motivo / detalle']
    const rows = movements.value.map(movement => [
      formatDate(movement.fecha),
      getMovementTypeLabel(movement.tipo),
      movement.producto?.nombre || 'Producto no especificado',
      movement.producto?.codigo || '—',
      formatMovementQuantity(movement),
      movement.usuario?.nombre || 'No especificado',
      movement.motivo?.trim() || 'Sin detalle indicado',
    ])
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 81,
      margin: { left: 14, right: 14, bottom: 15 },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3.5,
        textColor: [53, 73, 105],
        lineColor: [229, 235, 244],
        lineWidth: 0.15,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [0, 169, 139],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 4,
      },
      alternateRowStyles: { fillColor: [246, 248, 252] },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 42 },
        3: { cellWidth: 31 },
        4: { cellWidth: 31, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 34 },
      },
      didDrawPage: () => {
        const pageNumber = currentPageNumber(doc)
        doc.setDrawColor(229, 235, 244)
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)
        doc.setTextColor(113, 131, 164)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text('Reporte de Movimientos', 14, pageHeight - 7)
        doc.text(`Página ${pageNumber}`, pageWidth - 14, pageHeight - 7, { align: 'right' })
      },
    })
    doc.save(`reporte-movimientos-${new Date().toISOString().slice(0,10)}.pdf`)
  } else {
    const worksheetData = movements.value.map(m => ({
      Fecha: formatDate(m.fecha),
      'Tipo de movimiento': getMovementTypeLabel(m.tipo),
      Producto: m.producto?.nombre || 'Producto no especificado',
      Código: m.producto?.codigo || '',
      Cantidad: m.cantidad,
      Unidad: m.producto?.unidad_medida || 'unidad',
      'Lectura de cantidad': formatMovementQuantity(m),
      'Registrado por': m.usuario?.nombre || 'No especificado',
      'Motivo / detalle': m.motivo?.trim() || 'Sin detalle indicado',
    }))
    const summaryData = [
      { Resumen: 'Periodo del reporte', Detalle: movementPeriod },
      { Resumen: 'Fecha de generación', Detalle: new Date().toLocaleString('es-ES') },
      { Resumen: 'Total de movimientos', Detalle: movements.value.length },
      { Resumen: 'Entradas', Detalle: movementCounts.ENTRADA },
      { Resumen: 'Salidas', Detalle: movementCounts.SALIDA },
      { Resumen: 'Ajustes', Detalle: movementCounts.AJUSTE },
      { Resumen: 'Nota sobre los ajustes', Detalle: 'El registro disponible no indica si cada ajuste aumenta o reduce el stock.' },
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 28 }, { wch: 80 }]
    const ws = XLSX.utils.json_to_sheet(worksheetData)
    ws['!cols'] = [
      { wch: 21 },
      { wch: 34 },
      { wch: 30 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 25 },
      { wch: 24 },
      { wch: 38 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen')
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle de movimientos')
    XLSX.writeFile(wb, `reporte-movimientos-${new Date().toISOString().slice(0,10)}.xlsx`)
  }
}

function getMovementTypeLabel(type: MovimientoReporte['tipo']) {
  if (type === 'ENTRADA') return 'Entrada'
  if (type === 'SALIDA') return 'Salida'
  return 'Ajuste (dirección no indicada)'
}

function formatMovementQuantity(movement: MovimientoReporte) {
  const sign = movement.tipo === 'ENTRADA' ? '+' : movement.tipo === 'SALIDA' ? '-' : ''
  const unit = movement.producto?.unidad_medida || 'unidad'
  return `${sign}${movement.cantidad} ${unit}`
}

function getMovementPeriodLabel() {
  const { fechaInicio, fechaFin } = mv.value
  const formatFilterDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('es-ES')

  if (fechaInicio && fechaFin) return `del ${formatFilterDate(fechaInicio)} al ${formatFilterDate(fechaFin)}`
  if (fechaInicio) return `desde ${formatFilterDate(fechaInicio)}`
  if (fechaFin) return `hasta ${formatFilterDate(fechaFin)}`
  return 'todo el periodo disponible'
}

async function exportTopProduct(format: 'pdf' | 'excel') {
  const report = topProduct.value
  if (!report) return

  const category = typeof report.producto.categoria === 'object'
    ? report.producto.categoria?.nombre || '—'
    : report.producto.categoria || '—'
  const fileDate = new Date().toISOString().slice(0, 10)
  const row = {
    Código: report.producto.codigo || '—',
    Producto: report.producto.nombre || 'Producto',
    Categoría: category,
    'Operaciones registradas': report.totalMovimientos,
  }
  const explanation = 'Cada entrada, salida o ajuste cuenta como una operación. El total no representa unidades.'

  if (format === 'excel') {
    const { XLSX } = await loadExportLibs()
    const worksheet = XLSX.utils.json_to_sheet([row])
    const workbook = XLSX.utils.book_new()
    const summary = XLSX.utils.aoa_to_sheet([
      ['Producto con más movimientos'],
      [explanation],
      ['Generado el', new Date().toLocaleDateString('es-ES')],
    ])
    summary['!cols'] = [{ wch: 28 }, { wch: 90 }]
    XLSX.utils.book_append_sheet(workbook, summary, 'Cómo leer el reporte')
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Producto más movimientos')
    XLSX.writeFile(workbook, `reporte-producto-mas-movimientos-${fileDate}.xlsx`)
    return
  }

  const { jsPDF, autoTable } = await loadExportLibs()
  const doc = new jsPDF({ orientation: 'landscape' })
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(16, 35, 74)
  doc.rect(0, 0, pageWidth, 43, 'F')
  doc.setFillColor(40, 96, 245)
  doc.rect(0, 41, pageWidth, 2, 'F')
  doc.setTextColor(177, 201, 255)
  doc.setFontSize(8)
  doc.text('GESTIÓN DE INVENTARIO', 14, 13)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.text('Producto con más movimientos', 14, 26)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(221, 230, 247)
  doc.setFontSize(9)
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 14, 26, { align: 'right' })
  doc.setTextColor(53, 73, 105)
  doc.setFontSize(10)
  doc.text(explanation, 14, 55, { maxWidth: pageWidth - 28 })
  doc.setFillColor(246, 248, 252)
  doc.roundedRect(14, 66, pageWidth - 28, 27, 2, 2, 'F')
  doc.setTextColor(104, 123, 153)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('OPERACIONES REGISTRADAS', 20, 77)
  doc.setTextColor(16, 35, 74)
  doc.setFontSize(16)
  doc.text(String(report.totalMovimientos), 20, 87)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(53, 73, 105)
  doc.setFontSize(10)
  doc.text(`Producto: ${row.Producto}`, 95, 78)
  doc.text(`Código: ${row.Código}   ·   Categoría: ${row.Categoría}`, 95, 87)
  autoTable(doc, {
    head: [['Código', 'Producto', 'Categoría', 'Operaciones registradas']],
    body: [[row.Código, row.Producto, row.Categoría, row['Operaciones registradas']]],
    startY: 105,
    margin: { left: 14, right: 14 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: [53, 73, 105] },
    headStyles: { fillColor: [40, 96, 245], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 248, 252] },
  })
  doc.save(`reporte-producto-mas-movimientos-${fileDate}.pdf`)
}

async function exportLow(format: 'pdf'|'excel') {
  const { jsPDF, autoTable, XLSX } = await loadExportLibs()
  const belowMinimumCount = lowStock.value.filter(product => product.cantidad < product.cantidad_minima).length
  const categoryCount = new Set(lowStock.value.map(product => product.categoria)).size
  const reportDate = new Date()

  if (format === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const dateLabel = reportDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    doc.setFillColor(16, 35, 74)
    doc.rect(0, 0, pageWidth, 43, 'F')
    doc.setFillColor(228, 154, 0)
    doc.rect(0, 41, pageWidth, 2, 'F')
    doc.setTextColor(255, 220, 145)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('GESTIÓN DE INVENTARIO', 14, 13)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(21)
    doc.text('Reporte de Stock Mínimo', 14, 25)
    doc.setTextColor(221, 230, 247)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Productos que requieren seguimiento y reposición', 14, 33)
    doc.text(`Generado el ${dateLabel}`, pageWidth - 14, 25, { align: 'right' })

    const summaryCards = [
      { label: 'PRODUCTOS EN ALERTA', value: String(lowStock.value.length) },
      { label: 'BAJO EL MÍNIMO', value: String(belowMinimumCount) },
      { label: 'CATEGORÍAS AFECTADAS', value: String(categoryCount) },
    ]
    const cardGap = 5
    const cardWidth = (pageWidth - 28 - cardGap * 2) / summaryCards.length
    summaryCards.forEach((card, index) => {
      const x = 14 + index * (cardWidth + cardGap)
      doc.setFillColor(255, 249, 235)
      doc.roundedRect(x, 49, cardWidth, 24, 2, 2, 'F')
      doc.setTextColor(143, 105, 35)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(card.label, x + 5, 57)
      doc.setTextColor(16, 35, 74)
      doc.setFontSize(14)
      doc.text(card.value, x + 5, 68)
    })

    const columns = ['Código', 'Producto', 'Categoría', 'Stock actual', 'Mínimo requerido', 'Faltante para llegar al mínimo']
    const rows = lowStock.value.map(product => [
      product.codigo,
      product.nombre,
      product.categoria,
      `${product.cantidad} ${product.unidad_medida}`,
      `${product.cantidad_minima} ${product.unidad_medida}`,
      `${Math.max(0, product.cantidad_minima - product.cantidad)} ${product.unidad_medida}`,
    ])
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 81,
      margin: { left: 14, right: 14, bottom: 15 },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3.5,
        textColor: [53, 73, 105],
        lineColor: [229, 235, 244],
        lineWidth: 0.15,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [228, 154, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 4,
      },
      alternateRowStyles: { fillColor: [255, 249, 235] },
      columnStyles: {
        0: { cellWidth: 35 },
        2: { cellWidth: 44 },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
        5: { cellWidth: 47, halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: () => {
        const pageNumber = currentPageNumber(doc)
        doc.setDrawColor(229, 235, 244)
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)
        doc.setTextColor(113, 131, 164)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text('Reporte de Stock Mínimo', 14, pageHeight - 7)
        doc.text(`Página ${pageNumber}`, pageWidth - 14, pageHeight - 7, { align: 'right' })
      },
    })
    doc.save(`reporte-bajo-stock-${new Date().toISOString().slice(0,10)}.pdf`)
  } else {
    const worksheetData = lowStock.value.map(p => ({
      Código: p.codigo,
      Producto: p.nombre,
      Categoría: p.categoria,
      'Stock actual': p.cantidad,
      'Mínimo requerido': p.cantidad_minima,
      Unidad: p.unidad_medida,
      'Faltante para llegar al mínimo': Math.max(0, p.cantidad_minima - p.cantidad),
      'Estado de reposición': p.cantidad < p.cantidad_minima ? 'Por debajo del mínimo' : 'En nivel de alerta',
    }))
    const ws = XLSX.utils.json_to_sheet(worksheetData)
    ws['!cols'] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 24 },
      { wch: 15 },
      { wch: 19 },
      { wch: 14 },
      { wch: 31 },
      { wch: 24 },
    ]
    if (worksheetData.length > 0) {
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: worksheetData.length, c: 7 } }) }
    }

    const summaryData = [
      { Resumen: 'Fecha de generación', Detalle: reportDate.toLocaleString('es-ES') },
      { Resumen: 'Productos en el reporte', Detalle: lowStock.value.length },
      { Resumen: 'Productos por debajo del mínimo', Detalle: belowMinimumCount },
      { Resumen: 'Categorías afectadas', Detalle: categoryCount },
      { Resumen: 'Nivel de alerta aplicado', Detalle: lowFilters.value.nivelAlerta ?? 'Predeterminado del sistema' },
      { Resumen: 'Nota', Detalle: 'El faltante se calcula por producto; no se suman cantidades porque pueden usar unidades de medida distintas.' },
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 34 }, { wch: 78 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen')
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle de stock')
    XLSX.writeFile(wb, `reporte-bajo-stock-${new Date().toISOString().slice(0,10)}.xlsx`)
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('es-ES')
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadProducts(), loadInventory()])
})

async function loadCategories() {
  try {
    categoriesError.value = null
    categories.value = await getCategorias()
  } catch (e: any) {
    console.error(e)
    categoriesError.value = e?.message || 'Error al cargar categorías para los filtros'
  }
}

async function loadProducts() {
  try {
    productsError.value = null
    products.value = await getProductos()
  } catch (e: unknown) {
    console.error(e)
    productsError.value = 'No se pudieron cargar los productos para el filtro de movimientos.'
  }
}
</script>
