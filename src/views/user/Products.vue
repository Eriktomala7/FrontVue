<template>
    <div class="container">
      <div class="header">
        <h2 class="title">Productos</h2>
        <button class="btn outline" @click="load" :disabled="loading">
          {{ loading ? 'Cargando...' : 'Refrescar' }}
        </button>
      </div>
  
      <div v-if="error" class="error">{{ error }}</div>
  
      <div v-if="items.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Unidad</th>
              <th style="width: 140px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in items" :key="p.id">
              <td>{{ p.codigo }}</td>
              <td>{{ p.nombre }}</td>
              <td>{{ typeof p.categoria === 'object' ? p.categoria?.nombre : (p.categoria || 'Sin categoría') }}</td>
              <td>{{ p.cantidad }}</td>
              <td>{{ p.unidad_medida }}</td>
              <td>
                <button class="btn small" @click="openRequest(p)" :disabled="p.cantidad <= 0">Solicitar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <p v-else-if="!loading" class="muted">No hay productos para mostrar.</p>
  
      <!-- Modal Solicitar -->
      <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <h3 class="modal-title">Solicitar: {{ selected?.nombre }}</h3>
  
          <form @submit.prevent="onRequest" class="form">
            <label class="field">
              <span>Cantidad *</span>
              <input type="number" min="1" step="1" :max="selected?.cantidad || 1" v-model.number="cantidad" required />
              <small class="muted">Disponibles: {{ selected?.cantidad }} {{ selected?.unidad_medida }}</small>
              <small v-if="selected && cantidad > selected.cantidad" class="error" role="alert">
                No puedes solicitar más de {{ selected.cantidad }} unidades.
              </small>
            </label>
  
            <label class="field">
              <span>Comentario (opcional)</span>
              <textarea rows="3" v-model.trim="comentario" placeholder="Ej: Para proyecto X" />
            </label>
  
            <div v-if="formError" class="error">{{ formError }}</div>
  
            <div class="modal-actions">
              <button type="button" class="btn outline" @click="closeModal">Cancelar</button>
              <button
                type="submit"
                class="btn"
                :disabled="sending || !selected || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > selected.cantidad"
              >
                {{ sending ? 'Enviando...' : 'Enviar Solicitud' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <!-- /Modal -->
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { getProductos, type Producto } from '../../services/productsService'
  import { getCurrentUser } from '../../services/authService'
  import { createSolicitud } from '../../services/requestsService'
  
  const items = ref<Producto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const modalOpen = ref(false)
  const selected = ref<Producto | null>(null)
  const cantidad = ref(1)
  const comentario = ref('')
  const sending = ref(false)
  const formError = ref<string | null>(null)
  
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
  
  function openRequest(p: Producto) {
    selected.value = p
    cantidad.value = 1
    comentario.value = ''
    formError.value = null
    modalOpen.value = true
  }
  
  function closeModal() {
    if (sending.value) return
    modalOpen.value = false
  }
  
  async function onRequest() {
    try {
      sending.value = true
      formError.value = null
      const user = getCurrentUser()
      if (!user?.id) {
        formError.value = 'No se encontró el usuario autenticado'
        return
      }
      if (!selected.value) {
        formError.value = 'No hay producto seleccionado'
        return
      }
      if (!Number.isInteger(cantidad.value) || cantidad.value < 1 || cantidad.value > selected.value.cantidad) {
        formError.value = 'Cantidad inválida'
        return
      }
      await createSolicitud({
        id_usuario: Number(user.id),
        id_producto: selected.value.id,
        cantidad: cantidad.value,
        comentario: comentario.value,
        estado_solicitud: 'PENDIENTE',
      })
      modalOpen.value = false
    } catch (e: any) {
      console.error(e)
      formError.value = e?.message || 'No se pudo crear la solicitud'
    } finally {
      sending.value = false
    }
  }
  
  onMounted(load)
  </script>
  
  <style scoped>
  .container { max-width: 1100px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; margin: 12px 0; }
  .title { font-size: 22px; font-weight: 700; }
  .btn { background: #3b82f6; color: white; border: none; border-radius: 6px; padding: 8px 10px; cursor: pointer; }
  .btn.outline { background: transparent; color: #3b82f6; border: 1px solid #3b82f6; }
  .btn.small { padding: 6px 8px; font-size: 13px; }
  .table-wrap { margin-top: 12px; overflow: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; font-size: 14px; }
  .error { margin: 10px 0; color: #b91c1c; }
  .muted { color: #64748b; }
  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: grid; place-items: center; z-index: 50; }
  .modal { width: 100%; max-width: 520px; background: white; border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; }
  .modal-title { margin: 0 0 8px; font-weight: 700; }
  .form { display: flex; flex-direction: column; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  input, select, textarea { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; font-size: 14px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
  </style>