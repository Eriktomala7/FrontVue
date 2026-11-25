<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  titleId: string
  panelClass?: string
  overlayClass?: string
  titleClass?: string
  error?: string | null
  errorClass?: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <div v-if="open" :class="overlayClass || 'modal-overlay'" @click.self="$emit('close')">
    <section
      :class="panelClass || 'modal'"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <h3 :id="titleId" :class="titleClass || 'modal-title'">{{ title }}</h3>
      <slot />
      <p v-if="error" :class="errorClass || 'error'" role="alert">{{ error }}</p>
      <div class="modal-actions">
        <slot name="actions" />
      </div>
    </section>
  </div>
</template>
