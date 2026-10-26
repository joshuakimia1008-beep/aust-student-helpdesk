<script setup lang="ts">
defineProps<{ label: string; hint?: string; full?: boolean }>()
</script>

<template>
  <label class="block" :class="full ? 'sm:col-span-2' : ''">
    <span class="mb-2 block text-sm font-semibold tracking-tight">{{ label }}</span>
    <slot />
    <span v-if="hint" class="mt-2 block text-xs leading-5 text-muted-foreground">{{ hint }}</span>
  </label>
</template>
