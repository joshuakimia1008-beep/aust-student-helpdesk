<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { statusStyle } from '@/lib/admin-nav'
import { KIND_LABEL, type Kind, type Status } from '@/lib/store'
import { backend, type CaseRecord } from '@/lib/backend'
const kinds: Array<{ value: Kind | 'all'; label: string }> = [
  { value: 'all', label: 'All types' }, { value: 'complaint', label: 'Complaints' },
  { value: 'venue', label: 'Venue requests' }, { value: 'facility', label: 'Facility requests' },
]
const statuses: Array<Status | 'all'> = ['all', 'pending', 'accepted', 'declined', 'meeting']
const records = ref<CaseRecord[]>([])
const kind = ref<Kind | 'all'>('all')
const status = ref<Status | 'all'>('all')
const q = ref('')
const busy = ref(true)
const error = ref('')
const filtered = computed(() => records.value.filter((x) => !q.value || `${x.reference_code} ${x.title} ${x.location ?? ''}`.toLowerCase().includes(q.value.toLowerCase())))
const sel = 'field-control'
async function load() {
  busy.value = true
  error.value = ''
  try { records.value = await backend.adminSubmissions(kind.value === 'all' ? undefined : kind.value, status.value === 'all' ? undefined : status.value) }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not load cases.' }
  finally { busy.value = false }
}
onMounted(load)
watch([kind, status], load)
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <div><p class="eyebrow text-primary">Request queue</p><h1 class="text-display mt-2 text-3xl sm:text-4xl">Requests</h1><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review cases your role is allowed to handle. Student identities are not included.</p></div>
    <p v-if="error" role="alert" class="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{{ error }} <button class="ml-2 font-semibold underline" @click="load">Try again</button></p>
    <section class="grid gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:grid-cols-[minmax(14rem,1fr)_minmax(10rem,0.35fr)_minmax(10rem,0.35fr)] sm:p-5" aria-label="Search and filter requests">
      <label class="block"><span class="mb-1.5 block text-xs font-semibold text-muted-foreground">Search requests</span><span class="relative block"><Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input v-model="q" placeholder="Reference, title or location" :class="`${sel} pl-9`"/></span></label>
      <label class="block"><span class="mb-1.5 block text-xs font-semibold text-muted-foreground">Request type</span><select v-model="kind" :class="sel"><option v-for="k in kinds" :key="k.value" :value="k.value">{{ k.label }}</option></select></label>
      <label class="block"><span class="mb-1.5 block text-xs font-semibold text-muted-foreground">Status</span><select v-model="status" :class="sel"><option v-for="s in statuses" :key="s" :value="s">{{ s === 'all' ? 'All statuses' : s }}</option></select></label>
    </section>
    <section class="overflow-hidden rounded-2xl border bg-card shadow-soft" aria-label="Request results">
      <div class="flex items-center justify-between border-b px-5 py-3.5 sm:px-6"><p class="text-sm font-semibold">{{ busy ? 'Loading requests…' : `${filtered.length} ${filtered.length === 1 ? 'request' : 'requests'}` }}</p><p class="hidden text-xs text-muted-foreground sm:block">Select a request to view its details</p></div>
      <p v-if="busy" class="px-6 py-12 text-center text-sm text-muted-foreground">Loading cases…</p><div v-else-if="filtered.length===0" class="px-6 py-14 text-center"><p class="font-medium">Nothing matches these filters</p><p class="mt-1 text-sm text-muted-foreground">Try another search term or choose a different status.</p></div>
      <ul v-else class="divide-y"><li v-for="x in filtered" :key="x.id"><RouterLink :to="`/admin/requests/${encodeURIComponent(x.reference_code)}`" class="flex min-w-0 flex-wrap items-center gap-3 px-4 py-4 transition hover:bg-muted/50 sm:px-6"><span class="min-w-[9rem] font-mono text-xs text-muted-foreground">{{ x.reference_code }}</span><div class="min-w-0 flex-1 basis-44"><p class="truncate text-sm font-semibold">{{ x.title }}</p><p class="truncate text-xs text-muted-foreground">{{ KIND_LABEL[x.kind] }} · {{ x.location || 'No location' }}</p></div><span class="hidden rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground sm:inline-flex">{{ KIND_LABEL[x.kind] }}</span><span class="text-xs text-muted-foreground">{{ new Date(x.created_at).toLocaleDateString() }}</span><span class="rounded-full px-3 py-1 text-xs font-semibold capitalize" :class="statusStyle[x.status] || 'bg-muted text-muted-foreground'">{{ x.status }}</span></RouterLink></li></ul>
    </section>
  </div>
</template>
