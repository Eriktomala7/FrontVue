<template>
  <section class="notifications-page">
    <article class="notifications-panel">
      <header class="notifications-header">
        <div>
          <h2>Notificaciones</h2>
          <p>{{ unreadCount }} sin leer</p>
        </div>
        <button
          v-if="unreadCount"
          class="mark-all-button"
          type="button"
          :disabled="marking"
          @click="markAllAsRead"
        >
          {{ marking ? 'Actualizando...' : 'Marcar todas como leídas' }}
        </button>
      </header>

      <p v-if="error" class="notifications-error" role="alert">{{ error }}</p>
      <p v-if="loading && notifications.length === 0" class="notifications-empty">Cargando notificaciones...</p>
      <p v-else-if="!loading && notifications.length === 0 && !error" class="notifications-empty">
        No tienes notificaciones por ahora.
      </p>
      <ul v-else class="notifications-list">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-row"
          :class="[{ unread: isUnread(notification) }, `notification-${notification.tipo.toLowerCase()}`]"
        >
          <button
            class="notification-item"
            type="button"
            :disabled="!isUnread(notification) || marking"
            :aria-label="isUnread(notification) ? `Marcar como leída: ${notification.mensaje}` : notification.mensaje"
            @click="markAsRead(notification)"
          >
            <span class="notification-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <span class="notification-copy">
              <strong>{{ notification.mensaje }}</strong>
              <span v-if="notification.fecha">{{ formatDate(notification.fecha) }}</span>
            </span>
            <span class="notification-action" aria-hidden="true">{{ isUnread(notification) ? '−' : '✓' }}</span>
          </button>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getCurrentUser } from '../../services/authService'
import {
  getNotificaciones,
  marcarNotificacionLeida,
  type NotificacionSolicitud,
} from '../../services/requestsService'

const currentUserId = Number(getCurrentUser()?.id || 0)
const notifications = ref<NotificacionSolicitud[]>([])
const loading = ref(true)
const marking = ref(false)
const error = ref<string | null>(null)

const unreadCount = computed(() => notifications.value.filter(isUnread).length)

function isUnread(notification: NotificacionSolicitud) {
  return !notification.leida
}

async function loadNotifications() {
  try {
    loading.value = true
    error.value = null
    if (!currentUserId) throw new Error('No se pudo identificar al usuario.')
    notifications.value = await getNotificaciones(currentUserId)
  } catch (cause: unknown) {
    console.error(cause)
    error.value = cause instanceof Error ? cause.message : 'No se pudieron cargar las notificaciones.'
  } finally {
    loading.value = false
  }
}

async function markAllAsRead() {
  await markAsRead(notifications.value.filter(isUnread))
}

async function markAsRead(target: NotificacionSolicitud | NotificacionSolicitud[]) {
  const targets = (Array.isArray(target) ? target : [target]).filter(isUnread)
  if (!targets.length) return

  marking.value = true
  error.value = null
  try {
    const results = await Promise.allSettled(
      targets.map(notification => marcarNotificacionLeida(notification.id))
    )
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const notification = targets[index]
        if (notification) notification.leida = true
      } else {
        console.error(result.reason)
      }
    })

    if (results.some(result => result.status === 'rejected')) {
      error.value = 'No se pudieron marcar algunas notificaciones como leídas.'
    }
    window.dispatchEvent(new Event('user-notifications-updated'))
  } finally {
    marking.value = false
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

onMounted(() => void loadNotifications())
</script>

<style scoped>
.notifications-page { width: min(100%, 900px); margin: 0 auto; }
.notifications-panel { padding: 27px 24px; border: 1px solid #e0e8f4; border-radius: 12px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.notifications-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.notifications-header h2 { margin: 0; color: #10234a; font-size: 18px; font-weight: 700; }
.notifications-header p { margin: 7px 0 0; color: #7183a4; font-size: 12px; }
.mark-all-button { min-height: 38px; padding: 0 14px; border: 1px solid #ccd5e2; border-radius: 7px; color: #405574; background: #fff; cursor: pointer; font: inherit; font-size: 11px; }
.mark-all-button:hover:not(:disabled) { border-color: #2860f5; color: #2860f5; }
.mark-all-button:disabled { cursor: wait; opacity: .65; }
.notifications-list { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
.notification-row { overflow: hidden; border: 1px solid #e0e5ed; border-radius: 10px; background: #fff; }
.notification-row.unread { border-color: #bfd5ff; background: #eff5ff; }
.notification-item { display: flex; width: 100%; min-height: 76px; align-items: center; gap: 13px; padding: 12px 16px; border: 0; color: inherit; background: transparent; text-align: left; }
.notification-item:not(:disabled) { cursor: pointer; }
.notification-item:not(:disabled):hover { background: rgba(255, 255, 255, .45); }
.notification-item:disabled { opacity: 1; }
.notification-icon { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border-radius: 50%; color: #2457d6; background: #dceaff; }
.notification-icon svg { width: 19px; height: 19px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.notification-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 6px; }
.notification-copy strong { overflow: hidden; color: #10234a; font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.notification-copy > span { color: #536783; font-size: 11px; }
.notification-action { flex: 0 0 auto; color: #8290a8; font-size: 19px; font-weight: 300; line-height: 1; }
.notification-row:not(.unread) .notification-action { color: #00a276; font-size: 15px; }
.notifications-empty { padding: 34px 12px; color: #7183a4; font-size: 12px; text-align: center; }
.notifications-error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 7px; color: #b42318; background: #fff3f1; font-size: 12px; }
@media (max-width: 520px) {
  .notifications-panel { padding: 19px 14px; }
  .notifications-header { align-items: flex-start; }
  .notifications-header h2 { font-size: 16px; }
  .mark-all-button { padding: 0 9px; font-size: 10px; }
  .notification-item { min-height: 70px; gap: 10px; padding: 10px; }
  .notification-icon { width: 32px; height: 32px; flex-basis: 32px; }
}
</style>
