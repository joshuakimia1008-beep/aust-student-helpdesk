<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <fieldset class="rounded-2xl border bg-card p-5 shadow-soft sm:rounded-3xl sm:p-8">
    <legend class="sr-only">{{ title }}</legend>
    <p class="eyebrow mb-6 text-muted-foreground">{{ title }}</p>
    <div class="grid gap-5 sm:grid-cols-2">
      <slot />
    </div>
  </fieldset>
</template>
