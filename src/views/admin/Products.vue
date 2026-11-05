<template>
  <section class="product-catalog">
    <header class="catalog-header">
      <div>
        <h2 class="catalog-title">Catálogo de productos</h2>
        <p class="catalog-subtitle">Administra los artículos registrados en tu inventario.</p>
      </div>
      <button class="create-product-button" type="button" @click="openNew">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14m-7-7h14" /></svg>
        Nuevo producto
      </button>
    </header>

    <div class="product-filters">
      <label class="product-search">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input v-model.trim="searchQuery" type="search" placeholder="Buscar por nombre o código..." aria-label="Buscar productos por nombre o código" />
      </label>

      <label class="product-select">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z" /></svg>
        <select v-model="categoryFilter" aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          <option v-for="category in categories" :key="category.id" :value="String(category.id)">{{ category.nombre }}</option>
        </select>
        <svg class="select-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </label>

      <label class="product-select">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z" /></svg>
        <select v-model="statusFilter" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Disponible</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
        <svg class="select-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </label>
    </div>

    <p v-if="error" class="catalog-error" role="alert">{{ error }}</p>

    <div class="product-table-wrap">
      <table class="product-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Código</th>
            <th>Categoría</th>
            <th>Existencias</th>
            <th>Estado</th>
            <th aria-label="Acciones"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredItems" :key="p.id">
            <td>
              <div class="product-name-cell">
                <span class="product-row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></svg>
                </span>
                <strong>{{ p.nombre }}</strong>
              </div>
            </td>
            <td class="product-code">{{ p.codigo }}</td>
            <td>{{ categoriaNombre(p) }}</td>
            <td class="product-stock"><strong>{{ p.cantidad }}</strong><span>{{ displayUnit(p) }}</span></td>
            <td><span class="product-status" :class="statusClass(p)">{{ statusLabel(p) }}</span></td>
            <td>
              <div class="product-actions">
                <button class="product-action edit-product" type="button" @click="openEdit(p)" :aria-label="`Editar ${p.nombre}`">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m16 4 4 4M4 20l4-.8L19.5 7.7a2.12 2.12 0 0 0-3-3L5.2 16 4 20Z" /></svg>
                  <span>Editar</span>
                </button>
                <button
                  class="product-action delete-product"
                  type="button"
                  @click="openDelete(p)"
                  :disabled="deleting"
                  :aria-label="`Eliminar ${p.nombre}`"
                  title="Eliminar producto"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && filteredItems.length === 0">
            <td colspan="6" class="empty-products">
              {{ items.length ? 'No hay productos que coincidan con los filtros.' : 'No hay productos registrados.' }}
            </td>
          </tr>
          <tr v-if="loading && items.length === 0">
            <td colspan="6" class="empty-products">Cargando productos...</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear/Editar -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3 class="modal-title">{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</h3>

        <form @submit.prevent="onSave" class="form">
          <div class="grid">
            <div class="codigo-auto-container">
              <label class="field">
                <span>Código *</span>
                <input
                  v-model.trim="form.codigo"
                  required
                  readonly
                  class="codigo-auto"
                  title="Código generado automáticamente"
                />
              </label>
              <span class="muted">(Código generado automáticamente)</span>
            </div>
            <label class="field">
              <span>Nombre *</span>
              <input v-model.trim="form.nombre" required />
            </label>
          </div>

          <div class="grid">
            <label class="field">
              <span>Cantidad *</span>
              <input v-model.number="form.cantidad" type="number" min="0" required />
            </label>
            <label class="field">
              <span>Estado</span>
              <select v-model="form.estado">
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </label>
          </div>

          <div class="grid">
            <label class="field">
              <span>Categoría *</span>
              <select v-model.number="selectedCategoriaId" required>
                <option :value="undefined" disabled>Seleccione categoría</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </label>
            <span></span>
          </div>

          <label class="field">
            <span>Descripción</span>
            <textarea v-model.trim="form.descripcion" rows="3" />
          </label>

          <div class="product-photo-field">
            <label class="field">
              <span>Foto del producto</span>
              <input ref="photoInput" type="file" accept="image/*" @change="onPhotoSelected" />
            </label>
            <div v-if="productPhoto" class="product-photo-preview">
              <img :src="productPhoto" alt="Vista previa de la foto del producto" />
              <button type="button" class="remove-product-photo" @click="clearPhoto">
                Quitar foto
              </button>
            </div>
          </div>

          <div v-if="formError" class="error">{{ formError }}</div>

          <div class="modal-actions">
            <button type="button" class="btn outline" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn" :disabled="saving">
              {{ saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- /Modal -->

    <div v-if="deleteModalOpen" class="modal-overlay" @click.self="closeDeleteModal">
      <section class="modal delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <h3 id="delete-modal-title" class="modal-title">Eliminar producto</h3>
        <p class="delete-message">
          ¿Seguro que deseas eliminar <strong>{{ deletingProduct?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <p v-if="deleteError" class="error" role="alert">{{ deleteError }}</p>
        <div class="modal-actions">
          <button type="button" @click="closeDeleteModal" :disabled="deleting">Cancelar</button>
          <button type="button" class="confirm-delete" @click="onDelete" :disabled="deleting">
            {{ deleting ? 'Eliminando...' : 'Eliminar producto' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import './Products.css'
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  type Producto,
  type NewProducto
} from '../../services/productsService'
import { getCategorias, type Categoria } from '../../services/categoriesService'

const items = ref<Producto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')

const deleteModalOpen = ref(false)
const deletingProduct = ref<Producto | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

// Modal / Form state
const modalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref<string | null>(null)
const editingId = ref<number | null>(null)
const productPhoto = ref('')
const photoInput = ref<HTMLInputElement | null>(null)

// Categorías
const categories = ref<Categoria[]>([])
const selectedCategoriaId = ref<number | undefined>(undefined)

const filteredItems = computed(() => {
  const query = searchQuery.value.toLocaleLowerCase()
  return items.value.filter(product => {
    const matchesQuery = !query
      || product.nombre.toLocaleLowerCase().includes(query)
      || product.codigo.toLocaleLowerCase().includes(query)
    const idCategoria = (product as Producto & { id_categoria?: number }).id_categoria
    const category = typeof product.categoria === 'object'
      ? product.categoria?.nombre
      : product.categoria
    const matchesCategory = !categoryFilter.value
      || String(idCategoria ?? categories.value.find(item => item.nombre === category)?.id ?? '') === categoryFilter.value
    const matchesStatus = !statusFilter.value || (product.estado || 'ACTIVO') === statusFilter.value
    return matchesQuery && matchesCategory && matchesStatus
  })
})

// form con los campos principales de producto
const form = ref<NewProducto>({
  codigo: '',
  nombre: '',
  cantidad: 0,
  cantidad_minima: 0,
  unidad_medida: 'unidad',
  estado: 'ACTIVO',
  descripcion: '',
  precio_compra: undefined,
  precio_venta: undefined,
})

function categoriaNombre(p: Producto): string {
  if (typeof p.categoria === 'object' && p.categoria?.nombre) return p.categoria.nombre
  const idCat = (p as any).id_categoria as number | undefined
  const byId = idCat ? categories.value.find(c => c.id === idCat)?.nombre : undefined
  return byId || (typeof p.categoria === 'string' ? p.categoria : 'Sin categoría')
}

function statusLabel(product: Producto) {
  if (product.estado !== 'ACTIVO') return 'Inactivo'
  if (product.cantidad <= (product.cantidad_minima ?? 0)) return 'Bajo stock'
  return 'Disponible'
}

function statusClass(product: Producto) {
  if (product.estado !== 'ACTIVO') return 'status-inactive'
  if (product.cantidad <= (product.cantidad_minima ?? 0)) return 'status-low'
  return 'status-available'
}

function displayUnit(product: Producto) {
  const unit = product.unidad_medida?.trim()
  if (!unit || ['ud', 'unidad', 'unidades'].includes(unit.toLocaleLowerCase())) {
    return product.cantidad === 1 ? 'unidad' : 'unidades'
  }
  return unit
}

async function load() {
  try {
    error.value = null
    loading.value = true
    items.value = await getProductos()
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar productos'
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    categories.value = await getCategorias()
  } catch (e) {
    // no bloquear UI por error de categorías
  }
}

function openNew() {
  isEditing.value = false
  editingId.value = null
  formError.value = null
  productPhoto.value = ''
  selectedCategoriaId.value = undefined

  // ✅ GENERACIÓN AUTOMÁTICA DE CÓDIGO PROGRESIVO
  form.value.codigo = generarCodigoProducto()
  form.value.nombre = ''
  form.value.cantidad = 0
  form.value.cantidad_minima = 0
  form.value.unidad_medida = 'unidad'
  form.value.estado = 'ACTIVO'
  form.value.descripcion = ''
  form.value.precio_compra = undefined
  form.value.precio_venta = undefined

  modalOpen.value = true
}

// ✅ FUNCIÓN PARA GENERAR CÓDIGO AUTOMÁTICO PROGRESIVO
function generarCodigoProducto(): string {
  // Obtener el último número usado del localStorage
  const ultimoNumero = parseInt(localStorage.getItem('ultimoCodigoProducto') || '0');
  const nuevoNumero = ultimoNumero + 1;

  // Guardar el nuevo número para la próxima vez
  localStorage.setItem('ultimoCodigoProducto', nuevoNumero.toString());

  // Formatear con ceros a la izquierda (6 dígitos)
  const numeroFormateado = nuevoNumero.toString().padStart(6, '0');

  return `PROD${numeroFormateado}`;
}

function openEdit(p: Producto) {
  isEditing.value = true
  editingId.value = p.id
  formError.value = null
  productPhoto.value = p.foto_producto || ''
  // Resolver id de la categoría
  const idCat = (p as any).id_categoria as number | undefined
  if (idCat) {
    selectedCategoriaId.value = idCat
  } else if (typeof p.categoria === 'object') {
    const found = categories.value.find(c => c.nombre === (p.categoria as any)?.nombre)
    selectedCategoriaId.value = found?.id
  } else {
    selectedCategoriaId.value = undefined
  }
  form.value = {
    codigo: p.codigo,
    nombre: p.nombre,
    cantidad: p.cantidad,
    cantidad_minima: p.cantidad_minima ?? 0,
    unidad_medida: p.unidad_medida,
    estado: p.estado || 'ACTIVO',
    descripcion: p.descripcion || '',
    precio_compra: p.precio_compra,
    precio_venta: p.precio_venta,
  }
  modalOpen.value = true
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    formError.value = 'Seleccione un archivo de imagen válido'
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    formError.value = 'La foto no debe superar los 5 MB'
    input.value = ''
    return
  }

  try {
    const photoData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new Error('No se pudo leer la foto'))
      }
      reader.onerror = () => reject(new Error('No se pudo leer la foto'))
      reader.readAsDataURL(file)
    })
    productPhoto.value = photoData
    formError.value = null
  } catch (e: any) {
    console.error(e)
    formError.value = e?.message || 'No se pudo cargar la foto'
    input.value = ''
  }
}

function clearPhoto() {
  productPhoto.value = ''
  if (photoInput.value) photoInput.value.value = ''
}

function closeModal() {
  if (saving.value) return
  modalOpen.value = false
}

async function onSave() {
  try {
    saving.value = true
    formError.value = null

    if (!form.value.nombre.trim()) {
      formError.value = 'Ingresa el nombre del producto'
      return
    }
    if (!Number.isInteger(form.value.cantidad) || form.value.cantidad < 0) {
      formError.value = 'La cantidad debe ser un número entero igual o mayor que cero'
      return
    }
    if (!selectedCategoriaId.value) {
      formError.value = 'Seleccione una categoría'
      return
    }
    const codigoNuevo = form.value.codigo.trim().toLocaleLowerCase()
    if (codigoNuevo && items.value.some(p => p.id !== editingId.value && p.codigo.trim().toLocaleLowerCase() === codigoNuevo)) {
      formError.value = `El código ${form.value.codigo.trim()} ya existe en otro producto`
      return
    }

    // ✅ VALIDACIÓN DE USUARIO AUTENTICADO
    const usuarioLogueado = JSON.parse(localStorage.getItem('user') || '{}')
    if (!usuarioLogueado.id) {
      formError.value = 'Usuario no autenticado'
      return
    }

    // ✅ ARMAR PAYLOAD CON ID_USUARIO CRÍTICO PARA MOVIMIENTO AUTOMÁTICO
    const payload: any = { 
      ...form.value,
      nombre: form.value.nombre.trim(),
      id_categoria: selectedCategoriaId.value,
      id_usuario: usuarioLogueado.id,
      foto_producto: productPhoto.value || null
    }
    delete payload.categoria
    delete payload.cantidad_minima

    // ✅ CORRECCIÓN PRISMA: Usar sintaxis de relación para categoría
    if (selectedCategoriaId.value) {
      payload.categoria = {
        connect: { id: selectedCategoriaId.value }
      }
    }
    delete payload.id_categoria

    // ✅ ASEGURAR TIPOS DE DATOS CORRECTOS PARA PRISMA
    payload.cantidad = Math.max(0, parseInt(payload.cantidad, 10) || 0)
    payload.id_categoria = parseInt(payload.id_categoria, 10) || 0
    payload.id_usuario = parseInt(payload.id_usuario, 10) || 0

    // ✅ LOGS DE DEPURACIÓN COMPLETOS
    console.log('=== DATOS QUE SE ENVIARÁN AL BACKEND ===')
    console.log('Usuario autenticado:', usuarioLogueado)
    console.log('Datos del formulario:', form.value)
    console.log('ID categoría seleccionada:', selectedCategoriaId.value)
    console.log('Payload completo:', {
      ...payload,
      id_categoria: selectedCategoriaId.value,
    })
    console.log('URL endpoint:', isEditing.value ? `/productos/${editingId.value}` : '/productos')
    console.log('Método:', isEditing.value ? 'PUT' : 'POST')
    console.log('========================================')

    if (isEditing.value && editingId.value != null) {
      await updateProducto(editingId.value, payload)
    } else {
      await createProducto(payload)
    }
    modalOpen.value = false
    await load()
  } catch (e: any) {
    console.error(e)
    formError.value = e?.message || 'No se pudo guardar el producto'
  } finally {
    saving.value = false
  }
}

function openDelete(product: Producto) {
  deletingProduct.value = product
  deleteError.value = null
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  if (deleting.value) return
  deleteModalOpen.value = false
  deletingProduct.value = null
  deleteError.value = null
}

async function onDelete() {
  if (!deletingProduct.value) {
    deleteError.value = 'No hay un producto seleccionado'
    return
  }

  try {
    deleting.value = true
    deleteError.value = null
    await deleteProducto(deletingProduct.value.id)
    deleteModalOpen.value = false
    deletingProduct.value = null
    await load()
  } catch (e: any) {
    console.error(e)
    deleteError.value = e?.message || 'No se pudo eliminar el producto'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadCategories(), load()])
})
</script>
