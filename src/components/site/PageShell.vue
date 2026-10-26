<script setup lang="ts">
import SiteFooter from './SiteFooter.vue'
import SiteHeader from './SiteHeader.vue'

defineProps<{ eyebrow: string; title: string; intro: string }>()
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <section class="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
      <p class="eyebrow text-primary">{{ eyebrow }}</p>
      <h1 class="text-display mt-3 text-4xl sm:text-6xl">{{ title }}</h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg">{{ intro }}</p>
      <div class="mt-8 sm:mt-10">
        <slot />
      </div>
    </section>
    <SiteFooter />
  </div>
</template>
