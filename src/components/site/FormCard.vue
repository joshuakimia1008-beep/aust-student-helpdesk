<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <fieldset class="m-0 min-w-0 w-full max-w-full rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
    <legend class="sr-only">{{ title }}</legend>
    <p class="eyebrow mb-5 text-muted-foreground">{{ title }}</p>
    <div class="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
      <slot />
    </div>
  </fieldset>
</template>
