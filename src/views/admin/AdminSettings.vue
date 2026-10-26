<script setup lang="ts">
import { Monitor, Moon, Sun, Trash2 } from 'lucide-vue-next'
import { resetDemoData } from '@/lib/store'
import { useTheme, type Theme } from '@/lib/useTheme'
import { isSupabaseMode } from '@/lib/supabase'

const { theme, setTheme } = useTheme()

const themes: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div>
      <p class="eyebrow text-primary">Preferences</p>
      <h1 class="text-display mt-2 text-4xl">Settings</h1>
    </div>

    <section class="rounded-2xl bg-card p-6 shadow-soft">
      <h2 class="font-medium">Appearance</h2>
      <p class="mt-1 text-sm text-muted-foreground">Choose how the admin console looks on this device.</p>
      <div class="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
        <button
          v-for="t in themes"
          :key="t.value"
          class="flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition"
          :class="theme === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'"
          @click="setTheme(t.value)"
        >
          <component :is="t.icon" class="h-4 w-4" /> {{ t.label }}
        </button>
      </div>
      <p class="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Monitor class="h-3.5 w-3.5" /> First visit follows your system preference.
      </p>
    </section>

    <section class="rounded-2xl bg-card p-6 shadow-soft">
      <h2 class="font-medium">Offices</h2>
      <dl class="mt-3 space-y-2 text-sm">
        <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Student Affairs</dt><dd>studentaffairs@aust.edu.ng</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Operations</dt><dd>operations@aust.edu.ng</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Venue Office</dt><dd>venues@aust.edu.ng</dd></div>
      </dl>
    </section>

    <section v-if="!isSupabaseMode" class="rounded-2xl border border-destructive/30 bg-card p-6 shadow-soft">
      <h2 class="font-medium text-destructive">Danger zone</h2>
      <p class="mt-1 text-sm text-muted-foreground">Clear all locally stored submissions, logs and notifications, and restore the demo data.</p>
      <button class="mt-4 flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground hover:opacity-90" @click="resetDemoData">
        <Trash2 class="h-4 w-4" /> Reset demo data
      </button>
    </section>
  </div>
</template>
