<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; intro: string }>()
</script>

<template>
  <div class="mx-auto w-full min-w-0 max-w-4xl space-y-6 px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
    <header class="min-w-0">
      <p class="eyebrow text-primary">{{ eyebrow }}</p>
      <h1 class="text-display mt-2 break-words text-3xl sm:text-4xl">{{ title }}</h1>
      <p class="mt-2 max-w-2xl break-words text-sm leading-6 text-muted-foreground">
        {{ intro }}
      </p>
    </header>
    <slot />
  </div>
</template>
