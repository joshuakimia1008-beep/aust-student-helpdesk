<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, CalendarClock, CircleCheck, CircleX, Send } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { inputCls } from '@/components/site/formkit'
import { statusStyle } from '@/lib/admin-nav'
import { backend, type CaseRecord } from '@/lib/backend'
import { KIND_LABEL, type Status } from '@/lib/store'
import { authUser } from '@/lib/auth'
const route = useRoute()
const reference = computed(() => String(route.params.id ?? ''))
const record = ref<CaseRecord | null>(null)
const evidenceUrls = ref<string[]>([])
const busy = ref(true)
const sending = ref(false)
const response = ref('')
const message = ref('')
const messageNotice = ref('')
const error = ref('')
const isReadOnly = computed(() => authUser.value?.role === 'Read-Only Admin')
async function load() {
  busy.value = true
  try {
    record.value = await backend.adminSubmission(reference.value)
    const paths = record.value?.details.evidence_paths
    if (Array.isArray(paths)) evidenceUrls.value = (await Promise.all(paths.map((path) => backend.evidenceUrl(String(path))))).filter((url): url is string => Boolean(url))
  }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not load this case.' }
  finally { busy.value = false }
}
async function act(status: Exclude<Status, 'pending'>) {
  if (!record.value) return
  error.value = ''
  sending.value = true
  try { await backend.decide(record.value.reference_code, status, response.value); await load(); response.value = '' }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not save the decision.' }
  finally { sending.value = false }
}
async function sendMessage() {
  if (!record.value) return
  error.value = ''
  sending.value = true
  try {
    const result = await backend.sendMessage(record.value.reference_code, message.value) as { email?: string } | null
    message.value = ''
    messageNotice.value = result?.email === 'sent' ? 'Message saved and email sent.' : result?.email === 'failed' || result?.email === 'not_configured' ? 'Message saved, but email was not sent. Check the email service setup.' : 'Message sent.'
    await load()
  }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not send the message.' }
  finally { sending.value = false }
}
onMounted(load)
</script>
<template>
  <div v-if="busy" class="mx-auto max-w-5xl py-20 text-center text-muted-foreground">Loading case…</div>
  <div v-else-if="!record" class="mx-auto max-w-3xl py-20 text-center"><p class="text-muted-foreground">Case {{ reference }} was not found or your role cannot access it.</p><RouterLink to="/admin/requests" class="mt-4 inline-block text-primary hover:underline">Back to requests</RouterLink></div>
  <div v-else class="mx-auto max-w-5xl space-y-6">
    <RouterLink to="/admin/requests" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft class="h-4 w-4"/> All requests</RouterLink>
    <p v-if="error" role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{{ error }}</p>
    <div class="flex flex-wrap items-start justify-between gap-4"><div><p class="eyebrow text-primary">{{ KIND_LABEL[record.kind] }} · {{ record.reference_code }}</p><h1 class="text-display mt-2 text-4xl">{{ record.title }}</h1><p class="mt-2 text-muted-foreground">Submitted {{ new Date(record.created_at).toLocaleString() }}{{ record.location ? ` · ${record.location}` : '' }}</p></div><span class="rounded-full px-4 py-1.5 text-sm font-medium capitalize" :class="statusStyle[record.status]">{{ record.status }}</span></div>
    <div class="grid gap-6 lg:grid-cols-3"><div class="space-y-6 lg:col-span-2">
      <section class="rounded-2xl bg-card p-6 shadow-soft"><h2 class="eyebrow mb-4 text-muted-foreground">Case details</h2><dl class="grid gap-4 sm:grid-cols-2"><div v-for="[k,v] in Object.entries(record.details).filter(([key])=>key!=='evidence_paths')" :key="k" :class="String(v).length>60?'sm:col-span-2':''"><dt class="text-xs capitalize text-muted-foreground">{{ k.replaceAll('_',' ') }}</dt><dd class="mt-1 whitespace-pre-wrap text-sm">{{ v || '—' }}</dd></div></dl><div v-if="evidenceUrls.length" class="mt-5"><h3 class="mb-3 text-sm font-medium">Evidence images</h3><div class="flex flex-wrap gap-3"><a v-for="(url,index) in evidenceUrls" :key="url" :href="url" target="_blank" rel="noreferrer"><img :src="url" :alt="`Evidence ${index+1}`" class="h-24 w-24 rounded-xl object-cover"/></a></div></div></section>
      <section class="rounded-2xl bg-card p-6 shadow-soft"><h2 class="font-medium">Messages</h2><p v-if="messageNotice" role="status" class="mt-3 rounded-xl bg-muted p-3 text-sm">{{ messageNotice }}</p><p v-if="!record.messages?.length" class="mt-3 text-sm text-muted-foreground">No messages yet.</p><ul v-else class="mt-4 space-y-3"><li v-for="m in record.messages" :key="m.id" class="rounded-xl bg-muted p-4"><p class="text-xs font-medium">{{ m.from }} · {{ new Date(m.created_at).toLocaleString() }}</p><p class="mt-2 whitespace-pre-wrap text-sm">{{ m.body }}</p></li></ul><form class="mt-5 space-y-3" @submit.prevent="sendMessage"><textarea v-model="message" required maxlength="5000" rows="3" placeholder="Message the student using this case reference…" :class="inputCls" :disabled="isReadOnly"/><button :disabled="isReadOnly||sending" class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"><Send class="h-4 w-4"/>Send message</button></form></section>
    </div><aside class="space-y-6"><section class="rounded-2xl bg-card p-6 shadow-soft"><h2 class="eyebrow mb-4 text-muted-foreground">Student privacy</h2><p class="text-sm">Student identity is kept private. Use the case reference when discussing this request.</p></section><section class="rounded-2xl bg-card p-6 shadow-soft"><h2 class="eyebrow mb-4 text-muted-foreground">Decision</h2><p v-if="isReadOnly" class="text-sm text-muted-foreground">Read-only access: you can view cases but cannot send messages or make decisions.</p><div v-else class="space-y-3"><textarea v-model="response" rows="4" maxlength="5000" placeholder="Message to include with your decision" :class="inputCls"/><button :disabled="sending" class="flex w-full items-center justify-center gap-2 rounded-full bg-success px-4 py-2.5 text-sm font-medium text-success-foreground disabled:opacity-60" @click="act('accepted')"><CircleCheck class="h-4 w-4"/>Accept</button><button :disabled="sending" class="flex w-full items-center justify-center gap-2 rounded-full bg-info px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60" @click="act('meeting')"><CalendarClock class="h-4 w-4"/>Schedule meeting</button><button :disabled="sending" class="flex w-full items-center justify-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground disabled:opacity-60" @click="act('declined')"><CircleX class="h-4 w-4"/>Decline</button></div><p v-if="record.admin_response" class="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">Last response: {{ record.admin_response }}</p></section></aside></div>
  </div>
</template>
