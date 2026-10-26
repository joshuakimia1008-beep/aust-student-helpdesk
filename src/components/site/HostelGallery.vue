<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ images: string[]; name: string }>()
const i = ref(0)
</script>

<template>
  <div>
    <div class="aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
      <img :src="images[i]" :alt="name" class="h-full w-full object-cover" />
    </div>
    <div class="mt-3 flex gap-2">
      <button
        v-for="(src, idx) in images"
        :key="idx"
        :aria-label="`Photo ${idx + 1}`"
        class="h-16 w-16 overflow-hidden rounded-xl border-2"
        :class="idx === i ? 'border-primary' : 'border-transparent opacity-70'"
        @click="i = idx"
      >
        <img :src="src" alt="" class="h-full w-full object-cover" />
      </button>
    </div>
  </div>
</template>
