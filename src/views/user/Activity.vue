<template>
  <section class="activity-page">
    <article class="activity-panel">
      <header class="activity-header">
        <div>
          <h2>Actividad reciente</h2>
          <p>Tus solicitudes recientes y el estado de cada una.</p>
        </div>
        <button type="button" class="refresh-button" :disabled="loading" @click="loadActivity">
          {{ loading ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </header>

      <p v-if="error" class="activity-error" role="alert">{{ error }}</p>
      <p v-if="loading && entries.length === 0" class="activity-empty">Cargando actividad...</p>
      <p v-else-if="!loading && entries.length === 0 && !error" class="activity-empty">
        Aún no tienes actividad registrada.
      </p>
      <ul v-else class="activity-list">
        <li
          v-for="entry in entries"
          :key="`${entry.request.id}-${entry.kind}`"
          class="activity-item"
          :class="`activity-${entry.kind}`"
        >
          <span class="activity-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <span class="activity-copy">
            <strong>{{ entry.title }}</strong>
            <span>
              Cantidad: {{ entry.request.cantidad }} {{ entry.request.producto?.unidad_medida || 'unidades' }}
              <template v-if="entry.kind === 'request' && entry.request.comentario">
                · {{ entry.request.comentario }}
              </template>
            </span>
          </span>
          <time :datetime="entry.request.fecha">{{ formatDate(entry.request.fecha) }}</time>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getCurrentUser } from '../../services/authService'
import { getSolicitudes, type EstadoSolicitud, type SolicitudDTO } from '../../services/requestsService'

type ActivityEntry = {
  request: SolicitudDTO
  kind: 'request' | 'status'
  title: string
}

const currentUserId = Number(getCurrentUser()?.id || 0)
const requests = ref<SolicitudDTO[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const entries = computed(() => {
  const statusLabels: Record<EstadoSolicitud, string> = {
    PENDIENTE: 'pendiente',
    EN_PROCESO: 'en proceso',
    APROBADA: 'aprobada',
    RECHAZADA: 'rechazada',
  }

  return requests.value
    .filter(request => request.id_usuario === currentUserId)
    .slice()
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .flatMap(request => {
      const productName = request.producto?.nombre || 'producto'
      const requestEntry: ActivityEntry = {
        request,
        kind: 'request',
        title: `Solicitaste ${productName}`,
      }

      if (request.estado_solicitud === 'PENDIENTE') return [requestEntry]

      return [
        requestEntry,
        {
          request,
          kind: 'status' as const,
          title: `Tu solicitud de ${productName} está ${statusLabels[request.estado_solicitud]}`,
        },
      ]
    })
})

async function loadActivity() {
  try {
    loading.value = true
    error.value = null
    requests.value = await getSolicitudes()
  } catch (cause: unknown) {
    console.error(cause)
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar tu actividad.'
  } finally {
    loading.value = false
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(date)
}

onMounted(() => void loadActivity())
</script>

<style scoped>
.activity-page { width: min(100%, 900px); margin: 0 auto; }
.activity-panel { padding: 27px 24px; border: 1px solid #e0e8f4; border-radius: 12px; background: #fff; box-shadow: 0 5px 18px rgba(24, 48, 91, .035); }
.activity-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.activity-header h2 { margin: 0; color: #10234a; font-size: 18px; font-weight: 700; }
.activity-header p { margin: 7px 0 0; color: #7183a4; font-size: 12px; }
.refresh-button { min-height: 36px; padding: 0 12px; border: 1px solid #d5deeb; border-radius: 7px; color: #405574; background: #fff; cursor: pointer; font: inherit; font-size: 11px; }
.refresh-button:hover:not(:disabled) { border-color: #2860f5; color: #2860f5; }
.refresh-button:disabled { cursor: wait; opacity: .65; }
.activity-list { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
.activity-item { display: flex; min-height: 78px; align-items: center; gap: 13px; padding: 12px 16px; border: 1px solid #e0e5ed; border-radius: 10px; background: #fff; }
.activity-item.activity-status { border-color: #bfd5ff; background: #eff5ff; }
.activity-icon { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border-radius: 50%; color: #a64b00; background: #fff1c8; }
.activity-status .activity-icon { color: #2457d6; background: #dceaff; }
.activity-icon svg { width: 19px; height: 19px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.activity-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 6px; }
.activity-copy strong { overflow: hidden; color: #10234a; font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.activity-copy > span { overflow: hidden; color: #536783; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.activity-item time { flex: 0 0 auto; color: #8290a8; font-size: 10px; white-space: nowrap; }
.activity-empty { padding: 34px 12px; color: #7183a4; font-size: 12px; text-align: center; }
.activity-error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 7px; color: #b42318; background: #fff3f1; font-size: 12px; }
@media (max-width: 520px) {
  .activity-panel { padding: 19px 14px; }
  .activity-header { align-items: flex-start; }
  .activity-header h2 { font-size: 16px; }
  .activity-item { min-height: 72px; gap: 10px; padding: 10px; }
  .activity-icon { width: 32px; height: 32px; flex-basis: 32px; }
  .activity-item time { display: none; }
}
</style>
