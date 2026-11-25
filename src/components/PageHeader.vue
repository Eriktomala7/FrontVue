<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  headerClass?: string
  titleClass?: string
  subtitleClass?: string
}>()
</script>

<template>
  <header :class="headerClass">
    <div>
      <h2 :class="titleClass">{{ title }}</h2>
      <p v-if="subtitle" :class="subtitleClass">{{ subtitle }}</p>
    </div>
    <slot name="actions" />
  </header>
</template>
