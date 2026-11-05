<template>
  <section class="category-catalog">
    <header class="category-header">
      <div>
        <h2 class="category-heading">Categorías</h2>
        <p class="category-subtitle">Organiza el catálogo para encontrar todo más rápido.</p>
      </div>
      <button class="create-category-button" type="button" @click="openNew">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14m-7-7h14" /></svg>
        Nueva categoría
      </button>
    </header>

    <p v-if="error" class="category-error" role="alert">{{ error }}</p>

    <div v-if="loading && !items.length" class="category-empty">Cargando categorías...</div>
    <div v-else-if="items.length" class="category-grid">
      <article v-for="category in items" :key="category.id" class="category-card">
        <div class="category-card-main">
          <span class="category-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1" /></svg>
          </span>
          <div class="category-info">
            <h3>{{ category.nombre }}</h3>
            <p>{{ category.descripcion || 'Sin descripción' }}</p>
          </div>
        </div>
        <footer class="category-card-footer">
          <span class="category-state" :class="{ inactive: (category.estado || 'ACTIVO') !== 'ACTIVO' }">
            {{ (category.estado || 'ACTIVO') === 'ACTIVO' ? 'Activa' : 'Inactiva' }}
          </span>
          <div class="category-actions">
            <button class="category-action edit-category" type="button" @click="openEdit(category)">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m16 4 4 4M4 20l4-.8L19.5 7.7a2.12 2.12 0 0 0-3-3L5.2 16 4 20Z" /></svg>
              Editar
            </button>
            <button
              class="category-action delete-category"
              type="button"
              @click="openDelete(category)"
              :disabled="deleting"
              :aria-label="`Eliminar ${category.nombre}`"
              title="Eliminar categoría"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
            </button>
          </div>
        </footer>
      </article>
    </div>
    <p v-else class="category-empty">No hay categorías registradas.</p>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <h3 id="category-modal-title" class="modal-title">{{ isEditing ? 'Editar categoría' : 'Nueva categoría' }}</h3>
        <form class="category-form" @submit.prevent="onSave">
          <label class="field">
            <span>Nombre *</span>
            <input v-model.trim="form.nombre" required maxlength="100" />
          </label>
          <label class="field">
            <span>Descripción</span>
            <textarea v-model.trim="form.descripcion" rows="3" />
          </label>
          <label v-if="isEditing" class="field">
            <span>Estado</span>
            <select v-model="form.estado">
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </label>
          <p v-if="formError" class="category-error" role="alert">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" class="modal-button" @click="closeModal" :disabled="saving">Cancelar</button>
            <button type="submit" class="modal-button primary" :disabled="saving">
              {{ saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear categoría') }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="deleteModalOpen" class="modal-overlay" @click.self="closeDeleteModal">
      <section class="modal delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
        <h3 id="delete-category-title" class="modal-title">Eliminar categoría</h3>
        <p class="delete-message">
          ¿Seguro que deseas eliminar <strong>{{ deletingCategory?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <p v-if="deleteError" class="category-error" role="alert">{{ deleteError }}</p>
        <div class="modal-actions">
          <button type="button" class="modal-button" @click="closeDeleteModal" :disabled="deleting">Cancelar</button>
          <button type="button" class="modal-button danger" @click="onDelete" :disabled="deleting">
            {{ deleting ? 'Eliminando...' : 'Eliminar categoría' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  type Categoria,
  type NewCategoria
} from '../../services/categoriesService'

const items = ref<Categoria[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const modalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref<string | null>(null)
const editingId = ref<number | null>(null)
const deleteModalOpen = ref(false)
const deletingCategory = ref<Categoria | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const emptyForm = (): NewCategoria => ({
  nombre: '',
  descripcion: '',
  estado: 'ACTIVO'
})
const form = ref<NewCategoria>(emptyForm())

async function load() {
  try {
    error.value = null
    loading.value = true
    items.value = await getCategorias()
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar categorías'
  } finally {
    loading.value = false
  }
}

function openNew() {
  isEditing.value = false
  editingId.value = null
  formError.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

function openEdit(category: Categoria) {
  isEditing.value = true
  editingId.value = category.id
  formError.value = null
  form.value = {
    nombre: category.nombre,
    descripcion: category.descripcion || '',
    estado: category.estado || 'ACTIVO'
  }
  modalOpen.value = true
}

function closeModal() {
  if (saving.value) return
  modalOpen.value = false
}

async function onSave() {
  try {
    saving.value = true
    formError.value = null
    const nombre = form.value.nombre.trim()
    if (!nombre) {
      formError.value = 'Ingresa el nombre de la categoría'
      return
    }
    const payload = { ...form.value, nombre, descripcion: form.value.descripcion?.trim() || '' }
    if (isEditing.value && editingId.value != null) {
      await updateCategoria(editingId.value, payload)
    } else {
      await createCategoria(payload)
    }
    modalOpen.value = false
    await load()
  } catch (e: any) {
    console.error(e)
    formError.value = e?.message || 'No se pudo guardar la categoría'
  } finally {
    saving.value = false
  }
}

function openDelete(category: Categoria) {
  deletingCategory.value = category
  deleteError.value = null
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  if (deleting.value) return
  deleteModalOpen.value = false
  deletingCategory.value = null
  deleteError.value = null
}

async function onDelete() {
  if (!deletingCategory.value) {
    deleteError.value = 'No hay una categoría seleccionada'
    return
  }

  try {
    deleting.value = true
    deleteError.value = null
    await deleteCategoria(deletingCategory.value.id)
    deleteModalOpen.value = false
    deletingCategory.value = null
    await load()
  } catch (e: any) {
    console.error(e)
    deleteError.value = e?.message || 'No se pudo eliminar la categoría'
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.category-catalog { width: min(100%, 1120px); margin: 20px auto 0; padding: 24px; border: 1px solid #e0e8f4; border-radius: 10px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.category-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.category-heading { margin: 0; color: #10234a; font-size: 15px; font-weight: 700; }
.category-subtitle { margin: 7px 0 0; color: #7183a4; font-size: 11px; }
.create-category-button { display: inline-flex; min-height: 40px; flex: 0 0 auto; align-items: center; justify-content: center; gap: 8px; padding: 0 16px; border: 0; border-radius: 8px; color: #fff; background: #2860f5; box-shadow: 0 6px 13px rgba(40, 96, 245, .2); cursor: pointer; font: inherit; font-size: 11px; font-weight: 650; }
.create-category-button:hover { background: #1d52e4; }
.create-category-button svg { width: 15px; height: 15px; stroke: currentColor; stroke-linecap: round; stroke-width: 1.8; }
.category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.category-card { min-width: 0; padding: 16px; border: 1px solid #dce5f2; border-radius: 8px; background: #fff; }
.category-card-main { display: flex; min-width: 0; align-items: flex-start; gap: 10px; }
.category-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 8px; color: #2860f5; background: #eaf0ff; }
.category-icon svg { width: 17px; height: 17px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.category-info { min-width: 0; }
.category-info h3 { overflow: hidden; margin: 2px 0 5px; color: #10234a; font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.category-info p { overflow: hidden; margin: 0; color: #7183a4; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.category-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 20px; }
.category-state { display: inline-flex; min-height: 22px; align-items: center; padding: 0 9px; border-radius: 999px; color: #00966d; background: #dff8ee; font-size: 9px; font-weight: 650; }
.category-state.inactive { color: #66758f; background: #edf0f5; }
.category-actions { display: inline-flex; align-items: center; gap: 12px; }
.category-action { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 3px; border: 0; color: #00a98b; background: transparent; cursor: pointer; font: inherit; font-size: 9px; font-weight: 650; }
.category-action:hover { color: #007f6b; }
.category-action svg { width: 14px; height: 14px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.category-action:disabled { cursor: wait; opacity: .5; }
.delete-category { color: #f04458; }
.delete-category:hover { color: #c9283d; }
.category-error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 7px; color: #b42318; background: #fff3f1; font-size: 12px; }
.category-empty { padding: 30px 12px; color: #7183a4; font-size: 12px; text-align: center; }
.modal-overlay { position: fixed; z-index: 100; display: grid; overflow-y: auto; padding: 24px; background: rgba(16, 35, 74, .42); inset: 0; place-items: center; }
.modal { width: min(100%, 520px); max-height: calc(100vh - 48px); overflow-y: auto; padding: 24px; border: 1px solid #e0e8f4; border-radius: 12px; background: #fff; box-shadow: 0 18px 55px rgba(16, 35, 74, .22); }
.delete-modal { max-width: 440px; }
.modal-title { margin: 0 0 20px; color: #10234a; font-size: 18px; font-weight: 700; }
.category-form { display: flex; flex-direction: column; gap: 15px; }
.field { display: flex; flex-direction: column; gap: 7px; color: #334765; font-size: 12px; font-weight: 600; }
.field input, .field select, .field textarea { width: 100%; min-height: 40px; padding: 9px 11px; border: 1px solid #d5e0f1; border-radius: 7px; outline: 0; color: #243858; background: #fff; font: inherit; font-size: 12px; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: #2860f5; box-shadow: 0 0 0 3px rgba(40, 96, 245, .1); }
.delete-message { margin: 0; color: #405574; font-size: 13px; line-height: 1.6; }
.delete-message strong { color: #10234a; }
.modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 5px; }
.modal-button { min-height: 38px; padding: 0 15px; border: 1px solid #d5e0f1; border-radius: 7px; color: #405574; background: #fff; cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.modal-button.primary { border-color: #2860f5; color: #fff; background: #2860f5; }
.modal-button.danger { border-color: #dc3545; color: #fff; background: #dc3545; }
.modal-button:disabled { cursor: wait; opacity: .6; }
@media (max-width: 800px) { .category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 520px) { .category-catalog { padding: 18px 15px; } .category-header { align-items: stretch; flex-direction: column; } .create-category-button { align-self: stretch; } .category-grid { grid-template-columns: 1fr; } .modal-actions { flex-wrap: wrap; } }
</style>
