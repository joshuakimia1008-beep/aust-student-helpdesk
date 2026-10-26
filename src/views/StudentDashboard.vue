<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Bell, BookOpen, CircleCheck, Clock3, FilePlus2, MessageSquareText } from 'lucide-vue-next'
import { authUser } from '@/lib/auth'
import { backend, type CaseRecord, type NoticeRecord } from '@/lib/backend'
import { KIND_LABEL } from '@/lib/store'
const records = ref<CaseRecord[]>([])
const notices = ref<NoticeRecord[]>([])
const busy = ref(true)
const error = ref('')
const counts = computed(() => ({
  total: records.value.length,
  pending: records.value.filter((x) => x.status === 'pending').length,
  accepted: records.value.filter((x) => x.status === 'accepted').length,
  declined: records.value.filter((x) => x.status === 'declined').length,
  meeting: records.value.filter((x) => x.status === 'meeting').length,
}))
async function load() {
  busy.value = true
  error.value = ''
  try {
    const [cases, notes] = await Promise.all([backend.studentSubmissions(), backend.notifications()])
    records.value = cases
    notices.value = notes
  } catch (e) { error.value = e instanceof Error ? e.message : 'Could not load your submissions.' }
  finally { busy.value = false }
}
onMounted(load)
const statusClass: Record<string, string> = { pending: 'bg-warning/15 text-warning-foreground', accepted: 'bg-success/15 text-success', declined: 'bg-destructive/15 text-destructive', meeting: 'bg-info/15 text-info' }
const metrics = computed(() => [
  { label: 'All submissions', value: counts.value.total, icon: FilePlus2, tone: 'text-primary' },
  { label: 'Waiting for review', value: counts.value.pending, icon: Clock3, tone: 'text-warning-foreground' },
  { label: 'Accepted', value: counts.value.accepted, icon: CircleCheck, tone: 'text-success' },
  { label: 'Declined', value: counts.value.declined, icon: CircleCheck, tone: 'text-destructive' },
])
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-8 px-4 py-7 sm:px-8 sm:py-10">
    <header class="flex flex-wrap items-end justify-between gap-5 rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
      <div class="min-w-0"><p class="eyebrow text-primary">Student dashboard</p><h1 class="text-display mt-2 text-3xl sm:text-4xl">Hello, {{ authUser?.name || 'Student' }}</h1><p class="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Your requests and the latest updates from the AUST Helpdesk, all in one place.</p></div>
      <RouterLink to="/complaint" class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-deep"><FilePlus2 class="h-4 w-4"/>Start a request<ArrowRight class="h-4 w-4"/></RouterLink>
    </header>

    <p v-if="error" role="alert" class="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{{ error }} <button class="ml-2 font-semibold underline underline-offset-2" @click="load">Try again</button></p>

    <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Submission summary">
      <div v-for="item in metrics" :key="item.label" class="flex items-center gap-4 rounded-2xl border bg-card p-4 sm:p-5">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted"><component :is="item.icon" class="h-5 w-5" :class="item.tone"/></span>
        <div><p class="text-2xl font-semibold tracking-tight">{{ item.value }}</p><p class="mt-0.5 text-xs text-muted-foreground">{{ item.label }}</p></div>
      </div>
    </section>

    <section class="space-y-4" aria-label="Helpdesk services">
      <div><p class="eyebrow text-primary">Get support</p><h2 class="mt-1 text-xl font-semibold tracking-tight">What do you need help with?</h2></div>
      <div class="grid gap-3 md:grid-cols-3">
        <RouterLink to="/complaint" class="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft"><span class="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><MessageSquareText class="h-5 w-5"/></span><h3 class="mt-4 font-semibold">Report an issue</h3><p class="mt-1 text-sm leading-5 text-muted-foreground">Tell us about a fault or concern on campus.</p><span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Lodge a complaint <ArrowRight class="h-4 w-4 transition group-hover:translate-x-1"/></span></RouterLink>
        <RouterLink to="/facility-request" class="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft"><span class="grid h-10 w-10 place-items-center rounded-xl bg-info/10 text-info"><FilePlus2 class="h-5 w-5"/></span><h3 class="mt-4 font-semibold">Request an item</h3><p class="mt-1 text-sm leading-5 text-muted-foreground">Ask for room supplies or facilities support.</p><span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Make a request <ArrowRight class="h-4 w-4 transition group-hover:translate-x-1"/></span></RouterLink>
        <RouterLink to="/venue-request" class="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft"><span class="grid h-10 w-10 place-items-center rounded-xl bg-success/10 text-success"><BookOpen class="h-5 w-5"/></span><h3 class="mt-4 font-semibold">Book a venue</h3><p class="mt-1 text-sm leading-5 text-muted-foreground">Request a campus space for your event.</p><span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Explore venues <ArrowRight class="h-4 w-4 transition group-hover:translate-x-1"/></span></RouterLink>
      </div>
    </section>

    <section class="grid gap-5 lg:grid-cols-[1.55fr_0.85fr]">
      <div class="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 sm:px-6"><div><p class="eyebrow text-muted-foreground">Request history</p><h2 class="mt-1 font-semibold">Your submissions</h2></div><RouterLink to="/complaint" class="text-sm font-medium text-primary hover:underline">New submission</RouterLink></div>
        <div v-if="busy" class="space-y-3 px-5 py-7 sm:px-6"><div v-for="n in 3" :key="n" class="h-14 animate-pulse rounded-xl bg-muted"/><p class="text-center text-sm text-muted-foreground">Loading your submissions…</p></div>
        <div v-else-if="!records.length" class="px-6 py-12 text-center"><span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><FilePlus2 class="h-5 w-5"/></span><p class="mt-4 font-semibold">Nothing here yet</p><p class="mt-1 text-sm text-muted-foreground">Your submissions will appear here after you send one.</p><RouterLink to="/complaint" class="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Make a submission <ArrowRight class="h-4 w-4"/></RouterLink></div>
        <ul v-else class="divide-y">
          <li v-for="x in records" :key="x.id"><RouterLink :to="`/student/submissions/${encodeURIComponent(x.reference_code)}`" class="flex min-w-0 flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-muted/50 sm:px-6">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-primary"><FilePlus2 class="h-4 w-4"/></span>
            <div class="min-w-0 flex-1"><p class="font-mono text-xs text-muted-foreground">{{ x.reference_code }}</p><p class="truncate text-sm font-semibold">{{ x.title }}</p><p class="text-xs text-muted-foreground">{{ KIND_LABEL[x.kind] }} · {{ new Date(x.created_at).toLocaleDateString() }}</p></div>
            <span class="rounded-full px-3 py-1 text-xs font-semibold capitalize" :class="statusClass[x.status] || 'bg-muted text-muted-foreground'">{{ x.status }}</span><ArrowRight class="h-4 w-4 shrink-0 text-muted-foreground"/>
          </RouterLink></li>
        </ul>
      </div>
      <aside class="min-w-0 rounded-2xl border bg-card p-5 shadow-soft sm:p-6"><h2 class="flex items-center gap-2 font-semibold"><span class="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary"><Bell class="h-4 w-4"/></span> Updates</h2>
        <p v-if="busy" class="mt-4 text-sm text-muted-foreground">Loading updates…</p>
        <p v-else-if="!notices.length" class="mt-4 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">No new updates. We’ll show them here when available.</p>
        <ul v-else class="mt-4 space-y-3"><li v-for="n in notices.slice(0,8)" :key="n.id" class="border-b pb-3 text-sm last:border-0"><p>{{ n.summary }}</p><p class="mt-1 text-xs text-muted-foreground">{{ new Date(n.created_at).toLocaleString() }}</p></li></ul>
        <p class="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">Meetings scheduled: <span class="font-semibold text-foreground">{{ counts.meeting }}</span></p>
      </aside>
    </section>
  </main>
</template>
