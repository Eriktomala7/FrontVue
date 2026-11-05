<template>
  <section class="catalog-page">
    <div class="catalog-card">
      <header class="catalog-header">
        <h1>Productos</h1>
        <button class="catalog-primary" type="button" :disabled="availableProducts.length === 0" @click="openRequest()">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01" /></svg>
          Solicitar Productos
        </button>
      </header>

      <div class="catalog-filters">
        <label class="catalog-search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input v-model.trim="search" type="search" placeholder="Buscar productos..." aria-label="Buscar productos" />
        </label>
        <label class="catalog-category">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z" /></svg>
          <select v-model="category" aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            <option v-for="name in categories" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
      </div>

      <p v-if="error" class="catalog-error" role="alert">{{ error }}</p>
      <p v-if="success" class="catalog-success" role="status">{{ success }}</p>

      <p v-if="loading" class="catalog-empty">Cargando productos...</p>
      <p v-else-if="filteredProducts.length === 0" class="catalog-empty">No hay productos para mostrar.</p>

      <div v-else class="product-grid">
        <article v-for="product in filteredProducts" :key="product.id" class="product-card">
          <div class="product-image">
            <img v-if="product.foto_producto" :src="product.foto_producto" :alt="product.nombre" />
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01" /></svg>
          </div>
          <div class="product-body">
            <h2>{{ product.nombre }}</h2>
            <p class="product-code">Código: {{ product.codigo }}</p>
            <p class="product-category">{{ categoryName(product) }}</p>
            <p class="product-description">{{ product.descripcion || 'Sin descripción' }}</p>
            <span class="product-stock" :class="{ empty: product.cantidad <= 0 }">
              Stock: {{ product.cantidad }} {{ product.cantidad === 1 ? 'unidad' : 'unidades' }}
            </span>
          </div>
          <button class="product-request" type="button" :disabled="product.cantidad <= 0" @click="openRequest(product)">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01" /></svg>
            {{ product.cantidad <= 0 ? 'Agotado' : 'Solicitar' }}
          </button>
        </article>
      </div>
    </div>

    <div v-if="modalOpen" class="catalog-overlay" @click.self="closeModal">
      <section class="catalog-modal" role="dialog" aria-modal="true" aria-labelledby="request-title">
        <h2 id="request-title">Solicitar producto</h2>
        <form @submit.prevent="onRequest">
          <label class="catalog-field">
            <span>Producto</span>
            <select v-model.number="selectedId" required @change="amount = 1">
              <option :value="null" disabled>Selecciona un producto</option>
              <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                {{ product.nombre }} ({{ product.cantidad }} disponibles)
              </option>
            </select>
          </label>
          <label class="catalog-field">
            <span>Cantidad</span>
            <input v-model.number="amount" type="number" min="1" step="1" :max="selected?.cantidad || 1" required />
            <small v-if="selected">Disponibles: {{ selected.cantidad }} {{ selected.unidad_medida }}</small>
            <small v-if="selected && amount > selected.cantidad" class="catalog-error" role="alert">
              No puedes solicitar más de {{ selected.cantidad }} unidades.
            </small>
          </label>
          <label class="catalog-field">
            <span>Comentario (opcional)</span>
            <textarea v-model.trim="comment" rows="3" placeholder="Ej: Para proyecto X"></textarea>
          </label>
          <p v-if="formError" class="catalog-error" role="alert">{{ formError }}</p>
          <div class="catalog-actions">
            <button type="button" class="catalog-cancel" :disabled="sending" @click="closeModal">Cancelar</button>
            <button
              type="submit"
              class="catalog-primary"
              :disabled="sending || !selected || !Number.isInteger(amount) || amount < 1 || amount > selected.cantidad"
            >
              {{ sending ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getProductos, type Producto } from '../../services/productsService'
import { getCurrentUser } from '../../services/authService'
import { createSolicitud } from '../../services/requestsService'

const items = ref<Producto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const search = ref('')
const category = ref('')

const modalOpen = ref(false)
const selectedId = ref<number | null>(null)
const amount = ref(1)
const comment = ref('')
const sending = ref(false)
const formError = ref<string | null>(null)

function categoryName(product: Producto) {
  const value = typeof product.categoria === 'object' ? product.categoria?.nombre : product.categoria
  return value || 'Sin categoría'
}

const activeProducts = computed(() => items.value.filter(product => product.estado !== 'INACTIVO'))
const availableProducts = computed(() => activeProducts.value.filter(product => product.cantidad > 0))
const categories = computed(() => [...new Set(activeProducts.value.map(categoryName))].sort())
const selected = computed(() => items.value.find(product => product.id === selectedId.value) || null)

const filteredProducts = computed(() => {
  const term = search.value.toLowerCase()
  return activeProducts.value.filter(product => {
    const matchesCategory = !category.value || categoryName(product) === category.value
    const matchesSearch = !term || [product.nombre, product.codigo, product.descripcion || '']
      .some(value => value.toLowerCase().includes(term))
    return matchesCategory && matchesSearch
  })
})

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

function openRequest(product?: Producto) {
  selectedId.value = product?.id ?? availableProducts.value[0]?.id ?? null
  amount.value = 1
  comment.value = ''
  formError.value = null
  success.value = null
  modalOpen.value = true
}

function closeModal() {
  if (!sending.value) modalOpen.value = false
}

async function onRequest() {
  const user = getCurrentUser()
  if (!user?.id) {
    formError.value = 'No se encontró el usuario autenticado'
    return
  }
  if (!selected.value) {
    formError.value = 'Selecciona un producto'
    return
  }
  if (!Number.isInteger(amount.value) || amount.value < 1 || amount.value > selected.value.cantidad) {
    formError.value = 'Cantidad inválida'
    return
  }

  try {
    sending.value = true
    formError.value = null
    await createSolicitud({
      id_usuario: Number(user.id),
      id_producto: selected.value.id,
      cantidad: amount.value,
      comentario: comment.value,
      estado_solicitud: 'PENDIENTE',
    })
    modalOpen.value = false
    success.value = 'Solicitud enviada correctamente.'
  } catch (e: any) {
    console.error(e)
    formError.value = e?.response?.data?.message || e?.message || 'No se pudo crear la solicitud'
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.catalog-page { width: 100%; max-width: 1120px; min-width: 0; margin: 0 auto; }
.catalog-card { padding: 24px; border: 1px solid #e0e8f4; border-radius: 10px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.catalog-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid #e8edf5; }
.catalog-header h1 { margin: 0; color: #10234a; font-size: 22px; font-weight: 750; }
.catalog-primary { display: inline-flex; min-height: 38px; align-items: center; justify-content: center; gap: 8px; padding: 0 16px; border: 0; border-radius: 7px; color: #fff; background: #3b82f6; cursor: pointer; font: inherit; font-size: 12px; font-weight: 700; white-space: nowrap; }
.catalog-primary:hover:not(:disabled) { background: #2563eb; }
.catalog-primary:disabled, .product-request:disabled, .catalog-cancel:disabled { cursor: not-allowed; opacity: .55; }
.catalog-primary svg, .product-request svg { width: 16px; height: 16px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.catalog-filters { display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: 14px; margin: 22px 0; }
.catalog-search, .catalog-category { display: flex; min-height: 40px; align-items: center; gap: 10px; padding: 0 12px; border: 1px solid #d5dde8; border-radius: 7px; color: #7b8aa3; background: #fff; }
.catalog-search svg, .catalog-category svg { width: 17px; height: 17px; flex: 0 0 17px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.catalog-search input, .catalog-category select { width: 100%; min-width: 0; border: 0; outline: 0; color: #354969; background: transparent; font: inherit; font-size: 12px; }
.catalog-search:focus-within, .catalog-category:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, .12); }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 18px; }
.product-card { display: flex; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid #e4eaf3; border-radius: 10px; background: #fff; }
.product-image { display: grid; height: 180px; place-items: center; overflow: hidden; padding: 12px; color: #9aa7bb; background: #f6f8fc; }
.product-image img { display: block; width: 100%; height: 100%; object-fit: contain; }
.product-image svg { width: 34px; height: 34px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.product-body { display: flex; flex: 1; flex-direction: column; align-items: center; padding: 20px 18px 14px; text-align: center; }
.product-body h2 { margin: 0 0 14px; max-width: 100%; overflow: hidden; color: #10234a; font-size: 16px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.product-code, .product-category, .product-description { margin: 0 0 18px; color: #6f7f99; font-size: 11px; }
.product-category, .product-description { color: #50627f; font-size: 12px; }
.product-description { display: -webkit-box; min-height: 34px; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.product-stock { margin-top: auto; padding: 4px 10px; border-radius: 999px; color: #008767; background: #dcf8ef; font-size: 10px; font-weight: 600; }
.product-stock.empty { color: #b42318; background: #ffe4e8; }
.product-request { display: flex; min-height: 40px; align-items: center; justify-content: center; gap: 8px; margin: 0 12px 12px; border: 0; border-radius: 6px; color: #fff; background: #3b82f6; cursor: pointer; font: inherit; font-size: 12px; font-weight: 700; }
.product-request:hover:not(:disabled) { background: #2563eb; }
.catalog-empty { padding: 44px 8px; color: #7183a4; font-size: 13px; text-align: center; }
.catalog-error, .catalog-success { margin: 0 0 16px; padding: 10px 12px; border-radius: 7px; font-size: 12px; }
.catalog-error { border: 1px solid #fecaca; color: #b42318; background: #fff3f1; }
.catalog-success { border: 1px solid #bbf0dc; color: #008767; background: #effcf7; }
.catalog-overlay { position: fixed; z-index: 50; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(16, 35, 74, .45); }
.catalog-modal { width: min(100%, 440px); padding: 24px; border-radius: 12px; background: #fff; box-shadow: 0 18px 48px rgba(16, 35, 74, .22); }
.catalog-modal h2 { margin: 0 0 20px; color: #10234a; font-size: 18px; }
.catalog-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; color: #405574; font-size: 12px; font-weight: 600; }
.catalog-field input, .catalog-field select, .catalog-field textarea { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 1px solid #d5e0f1; border-radius: 7px; color: #354969; background: #fff; font: inherit; font-size: 12px; }
.catalog-field small { color: #7183a4; font-size: 10px; font-weight: 400; }
.catalog-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 20px; }
.catalog-cancel { min-height: 38px; padding: 0 14px; border: 1px solid #d5e0f1; border-radius: 7px; color: #536783; background: #fff; cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
@media (max-width: 620px) {
  .catalog-card { padding: 16px; }
  .catalog-header { align-items: flex-start; flex-direction: column; }
  .catalog-filters { grid-template-columns: 1fr; }
}
</style>
