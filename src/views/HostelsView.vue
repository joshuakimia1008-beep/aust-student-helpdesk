<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import HostelGallery from '@/components/site/HostelGallery.vue'
import SiteFooter from '@/components/site/SiteFooter.vue'
import SiteHeader from '@/components/site/SiteHeader.vue'
import { HOSTELS } from '@/lib/hostels'
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <section class="mx-auto max-w-7xl px-5 pt-14 sm:px-8">
      <p class="eyebrow text-primary">Student housing</p>
      <h1 class="text-display mt-3 text-5xl sm:text-7xl">Available hostels</h1>
      <p class="mt-5 max-w-2xl text-lg text-muted-foreground">
        All hostels are on campus and equipped with essential amenities. Fees are for a 1 year lease, as published by AUST Admissions.
      </p>
    </section>
    <div class="mx-auto max-w-7xl space-y-20 px-5 py-16 sm:px-8">
      <article
        v-for="(h, idx) in HOSTELS"
        :key="h.name"
        class="grid items-start gap-10 lg:grid-cols-2"
        :class="idx % 2 ? 'lg:[&>*:first-child]:order-2' : ''"
      >
        <HostelGallery :images="h.images" :name="h.name" />
        <div>
          <h2 class="text-display text-4xl sm:text-5xl">{{ h.name }}</h2>
          <p class="mt-3 text-lg text-muted-foreground">{{ h.tagline }}</p>
          <div class="mt-8 space-y-3">
            <div
              v-for="r in h.rooms"
              :key="r.type"
              class="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-card p-5 shadow-soft"
            >
              <div class="max-w-sm">
                <p class="font-medium">{{ r.type }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ r.description }}</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-medium text-primary">{{ r.perSemester }}</p>
                <p class="text-xs text-muted-foreground">per semester · {{ r.perYear }}/yr</p>
              </div>
            </div>
          </div>
          <ul class="mt-6 grid grid-cols-2 gap-2 text-sm">
            <li v-for="f in h.features" :key="f" class="flex items-center gap-2"><Check class="h-4 w-4 text-primary" />{{ f }}</li>
          </ul>
        </div>
      </article>
    </div>
    <SiteFooter />
  </div>
</template>
