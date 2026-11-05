<template>
  <section class="users-page">
    <header class="page-header">
      <div>
        <div class="breadcrumb"><span>Administración</span><span>/</span><span>Equipo</span></div>
        <h1>Usuarios</h1>
      </div>
    </header>

    <div class="users-panel">
      <header class="panel-header">
        <div>
          <h2>Usuarios</h2>
          <p>Administra los accesos y roles de tu equipo.</p>
        </div>
        <button class="create-user-button" type="button" @click="openNew">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14m-7-7h14" /></svg>
          Nuevo usuario
        </button>
      </header>

      <p v-if="error" class="users-error" role="alert">{{ error }}</p>

      <div class="users-table-wrap">
        <table class="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in items" :key="user.id">
              <td>
                <div class="user-cell">
                  <img v-if="user.foto_perfil" class="user-avatar" :src="user.foto_perfil" :alt="`Foto de ${user.nombre}`" />
                  <span v-else class="user-avatar initials" aria-hidden="true">{{ initials(user.nombre) }}</span>
                  <strong>{{ user.nombre }}</strong>
                </div>
              </td>
              <td class="user-email">{{ user.email }}</td>
              <td>{{ user.rol === 'ADMIN' ? 'Administrador' : 'Usuario' }}</td>
              <td>
                <span class="user-status" :class="user.estado === 'ACTIVO' ? 'active' : 'inactive'">
                  {{ user.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="user-actions">
                  <button
                    class="user-action edit-user"
                    type="button"
                    @click="openEdit(user)"
                    :aria-label="`Editar ${user.nombre}`"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m16 4 4 4M4 20l4-.8L19.5 7.7a2.12 2.12 0 0 0-3-3L5.2 16 4 20Z" /></svg>
                    Editar
                  </button>
                  <button
                    class="user-action delete-user"
                    type="button"
                    @click="openDelete(user)"
                    :disabled="deleting"
                    :aria-label="`Eliminar ${user.nombre}`"
                    title="Eliminar usuario"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="loading && items.length === 0">
              <td colspan="5" class="empty-row">Cargando usuarios...</td>
            </tr>
            <tr v-else-if="!loading && items.length === 0">
              <td colspan="5" class="empty-row">No hay usuarios para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <h2 id="user-modal-title" class="modal-title">{{ isEditing ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
        <form class="user-form" @submit.prevent="onSave">
          <div class="form-grid">
            <label class="form-field">
              <span>Nombre *</span>
              <input v-model.trim="form.nombre" required />
            </label>
            <label class="form-field">
              <span>Correo *</span>
              <input v-model.trim="form.email" type="email" required />
            </label>
          </div>
          <div class="form-grid">
            <label class="form-field">
              <span>Rol *</span>
              <select v-model="form.rol" required>
                <option value="ADMIN">Administrador</option>
                <option value="USUARIO">Usuario</option>
              </select>
            </label>
            <label class="form-field">
              <span>Estado</span>
              <select v-model="form.estado">
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </label>
          </div>
          <label v-if="!isEditing" class="form-field">
            <span>Contraseña *</span>
            <input v-model.trim="form.password" type="password" minlength="6" required />
          </label>
          <label v-else class="form-field">
            <span>Nueva contraseña (opcional)</span>
            <input v-model.trim="form.password" type="password" minlength="6" placeholder="Dejar en blanco para no cambiar" />
          </label>
          <p v-if="formError" class="users-error" role="alert">{{ formError }}</p>
          <div class="modal-actions">
            <button class="modal-cancel" type="button" @click="closeModal" :disabled="saving">Cancelar</button>
            <button class="modal-submit" type="submit" :disabled="saving">
              {{ saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear usuario') }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="deleteModalOpen" class="modal-overlay" @click.self="closeDelete">
      <section class="modal delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
        <h2 id="delete-user-title" class="modal-title">Eliminar usuario</h2>
        <p class="delete-message">
          ¿Seguro que deseas eliminar a <strong>{{ deletingUser?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <p v-if="deleteError" class="users-error" role="alert">{{ deleteError }}</p>
        <div class="modal-actions">
          <button class="modal-cancel" type="button" @click="closeDelete" :disabled="deleting">Cancelar</button>
          <button class="modal-delete" type="button" @click="onDelete" :disabled="deleting">
            {{ deleting ? 'Eliminando...' : 'Eliminar usuario' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import './Users.css'
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  type UsuarioDTO,
  type NewUsuario,
  type UpdateUsuario
} from '../../services/usersService'

const items = ref<UsuarioDTO[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const modalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref<string | null>(null)
const editingId = ref<number | null>(null)
const deleteModalOpen = ref(false)
const deletingUser = ref<UsuarioDTO | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const form = ref<NewUsuario & UpdateUsuario>({
  nombre: '',
  email: '',
  password: '',
  rol: 'USUARIO',
  estado: 'ACTIVO',
})

async function load() {
  try {
    error.value = null
    loading.value = true
    items.value = await getUsuarios()
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Error al cargar usuarios'
  } finally {
    loading.value = false
  }
}

function openNew() {
  isEditing.value = false
  editingId.value = null
  formError.value = null
  form.value = { nombre: '', email: '', password: '', rol: 'USUARIO', estado: 'ACTIVO' }
  modalOpen.value = true
}

function openEdit(user: UsuarioDTO) {
  isEditing.value = true
  editingId.value = user.id
  formError.value = null
  form.value = {
    nombre: user.nombre,
    email: user.email,
    password: '',
    rol: user.rol,
    estado: user.estado,
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
    const email = form.value.email.trim()
    if (!nombre) {
      formError.value = 'Ingresa el nombre del usuario'
      return
    }
    if (!email) {
      formError.value = 'Ingresa el correo electrónico'
      return
    }
    if (form.value.password && form.value.password.length < 6) {
      formError.value = 'La contraseña debe tener al menos 6 caracteres'
      return
    }
    if (isEditing.value && editingId.value != null) {
      const payload: UpdateUsuario = {
        nombre,
        email,
        rol: form.value.rol,
        estado: form.value.estado,
        ...(form.value.password ? { password: form.value.password } : {}),
      }
      await updateUsuario(editingId.value, payload)
    } else {
      if (!form.value.password || form.value.password.length < 6) {
        formError.value = 'La contraseña debe tener al menos 6 caracteres'
        return
      }
      const payload: NewUsuario = {
        nombre,
        email,
        password: form.value.password,
        rol: form.value.rol,
        estado: form.value.estado,
      }
      await createUsuario(payload)
    }
    modalOpen.value = false
    await load()
  } catch (e: any) {
    console.error(e)
    formError.value = e?.message || 'No se pudo guardar el usuario'
  } finally {
    saving.value = false
  }
}

function openDelete(user: UsuarioDTO) {
  deletingUser.value = user
  deleteError.value = null
  deleteModalOpen.value = true
}

function closeDelete() {
  if (deleting.value) return
  deleteModalOpen.value = false
  deletingUser.value = null
  deleteError.value = null
}

async function onDelete() {
  if (!deletingUser.value) {
    deleteError.value = 'No hay un usuario seleccionado'
    return
  }
  try {
    deleting.value = true
    deleteError.value = null
    await deleteUsuario(deletingUser.value.id)
    deleteModalOpen.value = false
    deletingUser.value = null
    await load()
  } catch (e: any) {
    console.error(e)
    deleteError.value = e?.message || 'No se pudo eliminar el usuario'
  } finally {
    deleting.value = false
  }
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toLocaleUpperCase())
    .join('')
}

onMounted(load)
</script>
