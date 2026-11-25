<script setup lang="ts">
defineProps<{
  label: string
  variant?: 'active' | 'inactive' | 'warning' | 'neutral'
  badgeClass?: string
}>()
</script>

<template>
  <span :class="[badgeClass, variant && `${variant}-state`]">{{ label }}</span>
</template>
