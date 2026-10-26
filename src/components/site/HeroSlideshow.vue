<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { SLIDES } from '@/lib/hostels'

const i = ref(0)
const paused = ref(false)
let timer: number | undefined

function stop() {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
}
function start() {
  stop()
  timer = window.setInterval(() => {
    i.value = (i.value + 1) % SLIDES.length
  }, 6000)
}
watch(paused, (p) => (p ? stop() : start()), { immediate: true })
onBeforeUnmount(stop)

const go = (d: number) => {
  i.value = (i.value + d + SLIDES.length) % SLIDES.length
}
const s = computed(() => SLIDES[i.value]!)
const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <section
    class="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-ink"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div
      v-for="(sl, idx) in SLIDES"
      :key="sl.title"
      class="absolute inset-0 transition-opacity duration-[1400ms]"
      :class="idx === i ? 'opacity-100' : 'opacity-0'"
      :aria-hidden="idx !== i"
    >
      <img
        :src="sl.image"
        :alt="sl.title"
        class="h-full w-full object-cover"
        :class="idx === i ? 'animate-kenburns' : ''"
        :loading="idx < 2 ? 'eager' : 'lazy'"
      />
    </div>
    <div class="absolute inset-0 bg-hero-fade" />

    <div class="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-16 sm:px-8 sm:pb-20">
      <p :key="`e${i}`" class="eyebrow animate-rise text-primary">{{ pad(i + 1) }} / {{ pad(SLIDES.length) }} · {{ s.title }}</p>
      <slot />
      <div class="mt-10 flex items-center justify-between gap-6 border-t border-ink-foreground/20 pt-6">
        <p :key="`c${i}`" class="animate-rise text-sm text-ink-foreground/75">{{ s.caption }}</p>
        <div class="flex items-center gap-3">
          <div class="hidden gap-1.5 sm:flex">
            <button
              v-for="(sl, idx) in SLIDES"
              :key="sl.title"
              :aria-label="`Show ${sl.title}`"
              class="h-1.5 rounded-full transition-all"
              :class="idx === i ? 'w-8 bg-primary' : 'w-3 bg-ink-foreground/40 hover:bg-ink-foreground/70'"
              @click="i = idx"
            />
          </div>
          <button
            aria-label="Previous slide"
            class="grid h-11 w-11 place-items-center rounded-full border border-ink-foreground/30 text-ink-foreground transition hover:bg-ink-foreground/10"
            @click="go(-1)"
          >
            <ChevronLeft class="h-5 w-5" />
          </button>
          <button
            aria-label="Next slide"
            class="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-deep"
            @click="go(1)"
          >
            <ChevronRight class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
