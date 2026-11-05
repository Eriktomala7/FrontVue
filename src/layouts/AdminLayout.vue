<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <RouterLink class="admin-brand" to="/admin" aria-label="Stockwise, resumen">
        <span class="admin-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></svg>
        </span>
        <span class="admin-brand-copy">
          <strong>Stockwise</strong>
          <small>CONTROL DE INVENTARIO</small>
        </span>
      </RouterLink>

      <p class="admin-menu-label">MENÚ PRINCIPAL</p>
      <nav class="admin-menu" aria-label="Menú principal">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="admin-menu-item"
          :class="{ 'is-active': isActive(item.path) }"
        >
          <svg class="admin-menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <use :href="`#admin-icon-${item.icon}`" />
          </svg>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <button class="admin-logout" type="button" @click="handleLogout">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>
        <span>Cerrar sesión</span>
      </button>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <div class="admin-heading">
          <p class="admin-breadcrumb">Administración <span>/</span> {{ currentSection }}</p>
          <h1 v-if="isSummaryPage">Buenos días, {{ displayName }}</h1>
        </div>
        <div class="admin-topbar-actions">
        <div ref="notificationsRoot" class="admin-notifications-control">
          <button
            class="admin-notifications"
            type="button"
            :aria-expanded="notificationsOpen"
            aria-haspopup="true"
            :aria-label="notificationCount ? `Notificaciones, ${notificationCount}` : 'Notificaciones'"
            @click="toggleNotifications"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></svg>
            <span v-if="notificationCount" class="admin-notification-badge">{{ notificationCount > 9 ? '9+' : notificationCount }}</span>
          </button>
          <section v-if="notificationsOpen" class="admin-notifications-panel" aria-label="Notificaciones">
            <header class="admin-notifications-header">
              <strong>Notificaciones</strong>
              <div class="admin-notifications-header-actions">
                <button v-if="notificationCount" type="button" @click="markNotificationsAsRead()">Marcar todas como leídas</button>
                <RouterLink to="/admin/solicitudes" @click="notificationsOpen = false">Ver solicitudes</RouterLink>
              </div>
            </header>
            <p v-if="notificationsLoading && notifications.length === 0 && stockNotifications.length === 0" class="admin-notifications-empty">Cargando notificaciones...</p>
            <p v-if="notificationsError" class="admin-notifications-empty admin-notifications-error" role="alert">{{ notificationsError }}</p>
            <p v-if="notifications.length === 0 && stockNotifications.length === 0 && !notificationsLoading && !notificationsError" class="admin-notifications-empty">No tienes notificaciones por ahora.</p>

            <template v-if="notifications.length">
              <h3 class="admin-notifications-section-title">Solicitudes pendientes</h3>
              <ul class="admin-notifications-list">
                <li v-for="notification in notifications" :key="`request-${notification.id}`" :class="{ 'is-unread': !notification.leida }">
                  <RouterLink to="/admin/solicitudes" @click="openRequestNotification(notification)">
                    <span class="admin-notification-dot" aria-hidden="true" />
                    <span>
                      <span class="admin-notification-message">{{ notification.mensaje }}</span>
                      <time :datetime="notification.fecha">{{ formatNotificationDate(notification.fecha) }}</time>
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </template>

            <template v-if="stockNotifications.length">
              <h3 class="admin-notifications-section-title">Alertas de inventario</h3>
              <ul class="admin-notifications-list">
                <li v-for="notification in stockNotifications" :key="`stock-${notification.id}`" :class="{ 'is-unread': !notification.leida }">
                  <button class="admin-stock-notification" type="button" @click="markNotificationAsRead(notification)">
                    <span class="admin-notification-dot" aria-hidden="true" />
                    <div class="admin-stock-notification-content">
                      <span class="admin-notification-message">{{ notification.mensaje }}</span>
                      <span v-if="notification.producto" class="admin-stock-product">
                        {{ notification.producto.nombre }} · {{ notification.producto.cantidad }} disponibles
                      </span>
                    </div>
                  </button>
                </li>
              </ul>
            </template>
          </section>
        </div>
        <div class="admin-user">
          <span class="admin-avatar">{{ initials }}</span>
          <span class="admin-user-copy">
            <strong>{{ displayName }}</strong>
            <small>{{ roleLabel }}</small>
          </span>
        </div>
        </div>
      </header>
      <main class="admin-content">
        <RouterView />
      </main>
    </div>

    <svg class="admin-icon-definitions" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <symbol id="admin-icon-home" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" /></symbol>
      <symbol id="admin-icon-box" viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></symbol>
      <symbol id="admin-icon-tag" viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><path d="M7.5 7.5h.01" /></symbol>
      <symbol id="admin-icon-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></symbol>
      <symbol id="admin-icon-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6m-11 5h6m-6 4h6" /></symbol>
      <symbol id="admin-icon-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87m-1-12.13a4 4 0 0 1 0 7.75" /></symbol>
      <symbol id="admin-icon-report" viewBox="0 0 24 24"><path d="M4 19V5m0 14h17M8 15l4-4 3 2 5-6" /></symbol>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { getCurrentUser, logout } from '../services/authService'
import {
  getNotificacionesAdmin,
  getNotificacionesStock,
  marcarNotificacionLeida,
  type NotificacionAdmin,
  type NotificacionStock
} from '../services/requestsService'
import './AdminLayout.css'

const route = useRoute()
const user = getCurrentUser()

const NOTIFICATION_REFRESH_MS = 30000
const notifications = ref<NotificacionAdmin[]>([])
const stockNotifications = ref<NotificacionStock[]>([])
const notificationsOpen = ref(false)
const notificationsLoading = ref(false)
const notificationsError = ref<string | null>(null)
const notificationsRoot = ref<HTMLElement | null>(null)
const notificationCount = computed(() =>
  [...notifications.value, ...stockNotifications.value].filter(notification => !notification.leida).length
)
let notificationsTimer: number | undefined

async function markNotificationsAsRead(targetNotifications = [
  ...notifications.value,
  ...stockNotifications.value
].filter(notification => !notification.leida)) {
  const unreadNotifications = [
    ...targetNotifications
  ].filter((notification, index, all) =>
    !notification.leida && all.findIndex(item => item.id === notification.id) === index
  )
  const results = await Promise.allSettled(
    unreadNotifications.map(notification => marcarNotificacionLeida(notification.id))
  )

  results.forEach((result, index) => {
    const notification = unreadNotifications[index]
    if (result.status === 'fulfilled' && notification) {
      const id = notification.id
      notifications.value.forEach(notification => {
        if (notification.id === id) notification.leida = true
      })
      stockNotifications.value.forEach(notification => {
        if (notification.id === id) notification.leida = true
      })
    } else {
      if (result.status === 'rejected') console.error(result.reason)
    }
  })

  if (results.some(result => result.status === 'rejected')) {
    notificationsError.value = 'No se pudieron marcar algunas notificaciones como leídas.'
  }
}

async function markNotificationAsRead(notification: NotificacionAdmin | NotificacionStock) {
  await markNotificationsAsRead([notification])
}

function openRequestNotification(notification: NotificacionAdmin) {
  notificationsOpen.value = false
  void markNotificationAsRead(notification)
}

async function loadNotifications() {
  notificationsLoading.value = true
  notificationsError.value = null
  const [requestsResult, stockResult] = await Promise.allSettled([
    getNotificacionesAdmin(),
    getNotificacionesStock()
  ])

  const errors: string[] = []
  if (requestsResult.status === 'fulfilled') {
    notifications.value = requestsResult.value
  } else {
    console.error(requestsResult.reason)
    errors.push('las solicitudes pendientes')
  }
  if (stockResult.status === 'fulfilled') {
    stockNotifications.value = stockResult.value.notificaciones
  } else {
    console.error(stockResult.reason)
    errors.push('las alertas de inventario')
  }

  if (errors.length) notificationsError.value = `No se pudieron cargar ${errors.join(' ni ')}.`
  notificationsLoading.value = false
}

async function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value
  if (!notificationsOpen.value) return
  await loadNotifications()
}

function formatNotificationDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function handleDocumentClick(event: MouseEvent) {
  if (notificationsOpen.value && !notificationsRoot.value?.contains(event.target as Node)) {
    notificationsOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  void loadNotifications()
  notificationsTimer = window.setInterval(loadNotifications, NOTIFICATION_REFRESH_MS)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.clearInterval(notificationsTimer)
})

const menuItems = [
  { path: '/admin', label: 'Resumen', icon: 'home' },
  { path: '/admin/products', label: 'Productos', icon: 'box' },
  { path: '/admin/categorias', label: 'Categorías', icon: 'tag' },
  { path: '/admin/movements', label: 'Movimientos', icon: 'clock' },
  { path: '/admin/solicitudes', label: 'Solicitudes', icon: 'file' },
  { path: '/admin/users', label: 'Usuarios', icon: 'users' },
  { path: '/admin/reports', label: 'Reportes', icon: 'report' },
]

const displayName = computed(() => user?.nombre || 'Administrador')
const roleLabel = computed(() => user?.rol === 'ADMIN' ? 'Administrador' : 'Usuario')
const initials = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'A')
const currentSection = computed(() => menuItems.find(item => isActive(item.path))?.label || 'Resumen')
const isSummaryPage = computed(() => route.path === '/admin')

function isActive(path: string) {
  return route.path === path || (path !== '/admin' && route.path.startsWith(path + '/'))
}

function handleLogout() {
  logout()
}
</script>
