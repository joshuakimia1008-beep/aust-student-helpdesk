<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Bell, BellOff } from 'lucide-vue-next'
import { backend, type NoticeRecord } from '@/lib/backend'
const notices = ref<NoticeRecord[]>([])
const error = ref('')
const busy = ref(true)
onMounted(async () => {
  try { notices.value = await backend.adminNotifications() }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not load notifications.' }
  finally { busy.value = false }
})
</script>
<template>
  <div class="mx-auto max-w-3xl space-y-6"><div><p class="eyebrow text-primary">Alerts</p><h1 class="text-display mt-2 text-4xl">Notifications</h1><p class="mt-2 text-muted-foreground">Updates for cases your staff role can handle.</p></div>
    <p v-if="error" role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{{ error }}</p>
    <div class="overflow-hidden rounded-2xl bg-card shadow-soft"><p v-if="busy" class="px-6 py-12 text-center text-muted-foreground">Loading…</p><p v-else-if="notices.length===0" class="flex flex-col items-center gap-3 px-6 py-16 text-muted-foreground"><BellOff class="h-8 w-8"/>No notifications yet.</p><ul v-else class="divide-y"><li v-for="n in notices" :key="n.id" class="flex items-center gap-4 px-6 py-4"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><Bell class="h-4 w-4"/></span><div class="flex-1"><p class="text-sm">{{ n.summary }}</p><p class="mt-1 font-mono text-xs text-muted-foreground">{{ n.reference_code }} · {{ n.event_type }}</p></div><span class="text-xs text-muted-foreground">{{ new Date(n.created_at).toLocaleString() }}</span></li></ul></div>
  </div>
</template>
