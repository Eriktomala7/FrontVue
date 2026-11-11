<template>
  <div class="user-layout">
    <aside class="user-sidebar">
      <RouterLink class="user-brand" to="/dashboard" aria-label="Stockwise, inicio">
        <span class="user-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></svg>
        </span>
        <span class="user-brand-copy"><strong>Stockwise</strong><small>CONTROL DE INVENTARIO</small></span>
      </RouterLink>

      <p class="user-menu-label">MENÚ PRINCIPAL</p>
      <nav class="user-menu" aria-label="Menú principal">
        <RouterLink
          v-for="item in menuItems"
          :key="item.label"
          :to="item.to"
          class="user-menu-item"
          :class="{ active: isActive(item.to) }"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><use :href="`#user-icon-${item.icon}`" /></svg>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <button class="user-logout" type="button" @click="handleLogout">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>
        <span>Cerrar sesión</span>
      </button>
    </aside>

    <div class="user-main">
      <header class="user-topbar">
        <div class="user-heading">
          <p class="user-breadcrumb">Espacio de usuario <span>/</span> {{ currentSection }}</p>
          <h1>{{ currentSection === 'Inicio' ? `Buenos días, ${displayName}` : currentSection }}</h1>
        </div>
        <div class="user-topbar-actions">
          <div ref="notificationsRoot" class="notifications-control">
            <button
              class="user-notifications"
              type="button"
              :aria-expanded="notificationsOpen"
              aria-haspopup="true"
              :aria-label="unreadCount ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'"
              @click="toggleNotifications"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></svg>
              <span v-if="unreadCount" class="notification-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
            <section v-if="notificationsOpen" class="notifications-panel" aria-label="Notificaciones">
              <header class="notifications-header">
                <strong>Notificaciones</strong>
                <div class="notifications-header-actions">
                  <button v-if="unreadCount" type="button" @click="markNotificationsAsRead()">Marcar todas como leídas</button>
                  <RouterLink to="/dashboard/requests" @click="notificationsOpen = false">Ver solicitudes</RouterLink>
                </div>
              </header>
              <p v-if="notificationsLoading && notifications.length === 0" class="notifications-empty">Cargando notificaciones...</p>
              <p v-else-if="notificationsError" class="notifications-empty notifications-error" role="alert">{{ notificationsError }}</p>
              <p v-else-if="notifications.length === 0" class="notifications-empty">No tienes notificaciones por ahora.</p>
              <ul v-else class="notifications-list">
                <li v-for="notification in notifications" :key="notification.id" :class="{ unread: isUnread(notification) }">
                  <button class="notification-item" type="button" @click="markNotificationAsRead(notification)">
                    <span class="notification-dot" :class="notification.tipo === 'APROBADA' ? 'dot-approved' : 'dot-rejected'" aria-hidden="true" />
                    <span>
                      <span class="notification-message">{{ notification.mensaje }}</span>
                      <time :datetime="notification.fecha">{{ formatNotificationDate(notification.fecha) }}</time>
                    </span>
                  </button>
                </li>
              </ul>
            </section>
          </div>
          <RouterLink class="user-account" to="/dashboard/profile">
            <span class="user-avatar">{{ initials }}</span>
            <span class="user-account-copy"><strong>{{ displayName }}</strong><small>Colaborador</small></span>
          </RouterLink>
        </div>
      </header>
      <main class="user-content">
        <RouterView />
      </main>
    </div>

    <svg class="user-icon-definitions" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <symbol id="user-icon-home" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" /></symbol>
      <symbol id="user-icon-box" viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4.5 7.5-4.5M12 12v9" /></symbol>
      <symbol id="user-icon-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6m-11 5h6m-6 4h6" /></symbol>
      <symbol id="user-icon-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></symbol>
      <symbol id="user-icon-bell" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></symbol>
      <symbol id="user-icon-profile" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></symbol>
      <symbol id="user-icon-logout" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></symbol>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { getCurrentUser, logout, type User } from '../services/authService'
import { getNotificaciones, marcarNotificacionLeida, type NotificacionSolicitud } from '../services/requestsService'

const route = useRoute()
const router = useRouter()
const user = ref<User | null>(getCurrentUser())

const NOTIFICATION_REFRESH_MS = 60000
const notifications = ref<NotificacionSolicitud[]>([])
const notificationsOpen = ref(false)
const notificationsLoading = ref(false)
const notificationsError = ref<string | null>(null)
const notificationsRoot = ref<HTMLElement | null>(null)
let notificationsTimer: number | undefined

const unreadCount = computed(() => notifications.value.filter(isUnread).length)

function isUnread(notification: NotificacionSolicitud) {
  return !notification.leida
}

async function loadNotifications() {
  const userId = Number(user.value?.id)
  if (!userId) return
  try {
    notificationsLoading.value = true
    notificationsError.value = null
    notifications.value = await getNotificaciones(userId)
  } catch (e: any) {
    console.error(e)
    notificationsError.value = 'No se pudieron cargar las notificaciones.'
  } finally {
    notificationsLoading.value = false
  }
}

async function markNotificationsAsRead(targetNotifications = notifications.value.filter(isUnread)) {
  const unreadNotifications = targetNotifications.filter(isUnread)
  const results = await Promise.allSettled(
    unreadNotifications.map(notification => marcarNotificacionLeida(notification.id))
  )

  results.forEach((result, index) => {
    const notification = unreadNotifications[index]
    if (result.status === 'fulfilled' && notification) {
      notification.leida = true
    } else {
      if (result.status === 'rejected') console.error(result.reason)
    }
  })

  if (results.some(result => result.status === 'rejected')) {
    notificationsError.value = 'No se pudieron marcar algunas notificaciones como leídas.'
  }
}

async function markNotificationAsRead(notification: NotificacionSolicitud) {
  await markNotificationsAsRead([notification])
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
const displayName = computed(() => user.value?.nombre || 'Usuario')
const initials = computed(() => {
  const parts = displayName.value.trim().split(/\s+/)
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''
  return parts.length > 1
    ? `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    : first.charAt(0).toUpperCase() || 'U'
})
const menuItems = [
  { to: '/dashboard', label: 'Inicio', icon: 'home' },
  { to: '/dashboard/products', label: 'Productos', icon: 'box' },
  { to: '/dashboard/requests', label: 'Mis solicitudes', icon: 'file' },
  { to: '/dashboard/activity', label: 'Actividad', icon: 'clock' },
  { to: '/dashboard/notifications', label: 'Notificaciones', icon: 'bell' },
  { to: '/dashboard/profile', label: 'Mi Perfil', icon: 'profile' },
]

const currentSection = computed(() => {
  return menuItems.find(item => item.to !== '/dashboard' && isActive(item.to))?.label || 'Inicio'
})

function isActive(path: string) {
  if (path === '/dashboard') return route.path === path
  return route.path === path || route.path.startsWith(path + '/')
}

function handleLogout() {
  logout()
  router.replace('/login')
}

function handleUserUpdated(event: Event) {
  user.value = (event as CustomEvent<User>).detail
}

onMounted(() => {
  window.addEventListener('auth-user-updated', handleUserUpdated)
  window.addEventListener('user-notifications-updated', loadNotifications)
  document.addEventListener('click', handleDocumentClick)
  void loadNotifications()
  notificationsTimer = window.setInterval(loadNotifications, NOTIFICATION_REFRESH_MS)
})
onUnmounted(() => {
  window.removeEventListener('auth-user-updated', handleUserUpdated)
  window.removeEventListener('user-notifications-updated', loadNotifications)
  document.removeEventListener('click', handleDocumentClick)
  window.clearInterval(notificationsTimer)
})
</script>

<style scoped>
.user-layout { display: flex; min-height: 100vh; color: #10234a; background: #f2f5fb; }
.user-sidebar { position: sticky; top: 0; display: flex; width: 250px; height: 100vh; flex: 0 0 250px; flex-direction: column; border-right: 1px solid #e1e8f2; background: #fff; }
.user-brand { display: flex; min-height: 76px; align-items: center; gap: 12px; padding: 0 18px; border-bottom: 1px solid #e8edf5; color: #10234a; text-decoration: none; }
.user-brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 10px; color: #fff; background: #2860f5; box-shadow: 0 6px 14px rgba(40, 96, 245, .2); }
.user-brand-mark svg { width: 23px; height: 23px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.user-brand-copy { display: flex; flex-direction: column; gap: 2px; }
.user-brand-copy strong { font-size: 14px; font-weight: 750; }
.user-brand-copy small { color: #7183a4; font-size: 8px; letter-spacing: 1px; }
.user-menu-label { margin: 26px 20px 12px; color: #8a9ab4; font-size: 9px; font-weight: 700; letter-spacing: 1.3px; }
.user-menu { display: flex; flex-direction: column; gap: 4px; padding: 0 10px; }
.user-menu-item { display: flex; min-height: 42px; align-items: center; gap: 12px; padding: 0 13px; border-radius: 8px; color: #50627f; font-size: 12px; text-decoration: none; transition: color 140ms ease, background-color 140ms ease; }
.user-menu-item svg { width: 18px; height: 18px; flex: 0 0 18px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.user-menu-item:hover { color: #2860f5; background: #f5f8ff; }
.user-menu-item.active { color: #2860f5; background: #edf3ff; font-weight: 650; box-shadow: inset 3px 0 #2860f5; }
.user-logout { display: flex; min-height: 46px; align-items: center; gap: 12px; margin: auto 10px 14px; padding: 0 13px; border: 0; border-top: 1px solid #edf1f7; color: #697b96; background: transparent; cursor: pointer; font: inherit; font-size: 12px; text-align: left; }
.user-logout svg { width: 18px; height: 18px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.user-logout:hover { color: #d83c50; }
.user-main { min-width: 0; flex: 1; }
.user-topbar { display: flex; min-height: 74px; align-items: center; justify-content: space-between; gap: 20px; padding: 0 32px; border-bottom: 1px solid #e3eaf5; background: #fff; }
.user-heading { min-width: 0; }
.user-breadcrumb { margin: 0 0 5px; color: #7d8ca7; font-size: 10px; }
.user-breadcrumb span { margin: 0 8px; color: #b4bfd0; }
.user-heading h1 { margin: 0; color: #10234a; font-size: 19px; font-weight: 700; letter-spacing: -.25px; line-height: 1.35; }
.user-topbar-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 12px; }
.notifications-control { position: relative; }
.user-notifications { position: relative; display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid #dce5f2; border-radius: 9px; color: #617491; background: #fff; cursor: pointer; text-decoration: none; }
.user-notifications:hover, .user-notifications[aria-expanded="true"] { border-color: #a9bded; color: #2860f5; }
.notification-badge { position: absolute; top: -6px; right: -6px; display: grid; min-width: 17px; height: 17px; place-items: center; padding: 0 4px; border: 2px solid #fff; border-radius: 999px; color: #fff; background: #d83c50; font-size: 8px; font-weight: 700; line-height: 1; }
.notifications-panel { position: absolute; z-index: 30; top: calc(100% + 10px); right: 0; width: 330px; max-width: calc(100vw - 32px); overflow: hidden; border: 1px solid #e0e8f4; border-radius: 10px; background: #fff; box-shadow: 0 14px 34px rgba(16, 35, 74, .16); }
.notifications-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 16px; border-bottom: 1px solid #e7edf6; }
.notifications-header strong { color: #10234a; font-size: 12px; }
.notifications-header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.notifications-header-actions button, .notifications-header-actions a { padding: 0; border: 0; color: #2860f5; background: transparent; font-size: 10px; font-weight: 650; text-decoration: none; cursor: pointer; }
.notifications-header-actions button:hover, .notifications-header-actions a:hover { text-decoration: underline; }
.notifications-list { max-height: 340px; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
.notifications-list li { border-bottom: 1px solid #eef2f8; }
.notifications-list li:last-child { border-bottom: 0; }
.notifications-list li.unread { background: #f6f9ff; }
.notification-item { display: flex; width: 100%; align-items: flex-start; gap: 11px; padding: 13px 16px; border: 0; color: inherit; background: transparent; text-align: left; cursor: pointer; }
.notification-item:hover { background: #f6f9ff; }
.notification-message { display: block; margin: 0 0 5px; color: #243858; font-size: 11px; line-height: 1.45; }
.notifications-list time { color: #8a9ab4; font-size: 9px; }
.notification-dot { width: 8px; height: 8px; flex: 0 0 8px; margin-top: 4px; border-radius: 50%; }
.dot-approved { background: #00a98b; }
.dot-rejected { background: #d83c50; }
.notifications-empty { margin: 0; padding: 26px 16px; color: #7183a4; font-size: 11px; text-align: center; }
.notifications-error { color: #b42318; }
.user-notifications svg { width: 18px; height: 18px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.user-account { display: flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; }
.user-avatar { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 50%; color: #2860f5; background: #e7efff; font-size: 12px; font-weight: 700; }
.user-account-copy { display: flex; flex-direction: column; gap: 4px; }
.user-account-copy strong { color: #10234a; font-size: 11px; }
.user-account-copy small { color: #7183a4; font-size: 10px; }
.user-content { min-width: 0; padding: 30px 32px; }
.user-icon-definitions { position: absolute; width: 0; height: 0; overflow: hidden; }
@media (max-width: 900px) {
  .user-sidebar { width: 210px; flex-basis: 210px; }
  .user-topbar { padding-right: 22px; padding-left: 22px; }
  .user-content { padding: 24px 22px; }
}
@media (max-width: 680px) {
  .user-layout { display: block; }
  .user-sidebar { position: static; width: 100%; height: auto; }
  .user-brand { min-height: 62px; }
  .user-menu-label { display: none; }
  .user-menu { flex-direction: row; gap: 3px; overflow-x: auto; padding: 8px 10px; }
  .user-menu-item { min-height: 38px; flex: 0 0 auto; gap: 7px; padding: 0 10px; font-size: 10px; }
  .user-menu-item svg { width: 16px; height: 16px; flex-basis: 16px; }
  .user-menu-item.active { box-shadow: inset 0 -2px #2860f5; }
  .user-logout { min-height: 35px; margin: 0 10px 8px; border-top: 0; }
  .user-topbar { min-height: 68px; padding: 0 16px; }
  .user-heading h1 { font-size: 16px; }
  .user-account-copy { display: none; }
  .user-content { padding: 18px 14px; }
}
</style>
