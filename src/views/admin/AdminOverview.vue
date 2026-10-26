<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, CalendarClock, CircleCheck, CircleX, Clock, Inbox } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { statusStyle } from '@/lib/admin-nav'
import { KIND_LABEL } from '@/lib/store'
import { backend, type CaseRecord } from '@/lib/backend'
const records = ref<CaseRecord[]>([])
const error = ref('')
const busy = ref(true)
const count = (status: string) => records.value.filter((x) => x.status === status).length
const stats = computed(() => [
  { label: 'Total submissions', value: records.value.length, icon: Inbox, tone: 'text-primary' },
  { label: 'Pending review', value: count('pending'), icon: Clock, tone: 'text-warning-foreground' },
  { label: 'Accepted', value: count('accepted'), icon: CircleCheck, tone: 'text-success' },
  { label: 'Declined', value: count('declined'), icon: CircleX, tone: 'text-destructive' },
  { label: 'Meetings scheduled', value: count('meeting'), icon: CalendarClock, tone: 'text-info' },
])
const recent = computed(() => records.value.slice(0, 6))
async function load() {
  busy.value = true
  error.value = ''
  try { records.value = await backend.adminSubmissions() }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not load cases.' }
  finally { busy.value = false }
}
onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-7">
    <div class="flex flex-wrap items-end justify-between gap-4"><div><p class="eyebrow text-primary">Admin dashboard</p><h1 class="text-display mt-2 text-3xl sm:text-4xl">Overview</h1><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Cases your staff role is allowed to handle. Student account details are not shown here.</p></div><RouterLink to="/admin/requests" class="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted">Open request queue <ArrowRight class="h-4 w-4"/></RouterLink></div>
    <p v-if="error" role="alert" class="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{{ error }} <button class="ml-2 font-semibold underline underline-offset-2" @click="load">Try again</button></p>
    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Helpdesk case summary"><div v-for="s in stats" :key="s.label" class="flex items-center gap-4 rounded-2xl border bg-card p-4"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted"><component :is="s.icon" class="h-5 w-5" :class="s.tone"/></span><div><p class="text-2xl font-semibold tracking-tight">{{ s.value }}</p><p class="mt-0.5 text-xs text-muted-foreground">{{ s.label }}</p></div></div></section>
    <section class="overflow-hidden rounded-2xl border bg-card shadow-soft"><div class="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 sm:px-6"><div><p class="eyebrow text-muted-foreground">The latest activity</p><h2 class="mt-1 font-semibold">Latest submissions</h2></div><RouterLink to="/admin/requests" class="flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-primary hover:bg-secondary">View all <ArrowRight class="h-4 w-4"/></RouterLink></div>
      <div v-if="busy" class="space-y-3 p-5 sm:p-6"><div v-for="n in 4" :key="n" class="h-14 animate-pulse rounded-xl bg-muted"/><p class="text-center text-sm text-muted-foreground">Loading cases…</p></div><p v-else-if="!recent.length" class="px-6 py-14 text-center text-sm text-muted-foreground">No cases available.</p>
      <ul v-else class="divide-y"><li v-for="x in recent" :key="x.id"><RouterLink :to="`/admin/requests/${encodeURIComponent(x.reference_code)}`" class="flex min-w-0 flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-muted/50 sm:px-6"><span class="min-w-[9rem] font-mono text-xs text-muted-foreground">{{ x.reference_code }}</span><div class="min-w-0 flex-1 basis-40"><p class="truncate text-sm font-semibold">{{ x.title }}</p><p class="truncate text-xs text-muted-foreground">{{ KIND_LABEL[x.kind] }} · {{ x.location || 'No location' }}</p></div><span class="rounded-full px-3 py-1 text-xs font-semibold capitalize" :class="statusStyle[x.status] || 'bg-muted text-muted-foreground'">{{ x.status }}</span><ArrowRight class="h-4 w-4 shrink-0 text-muted-foreground"/></RouterLink></li></ul>
    </section>
  </div>
</template>
