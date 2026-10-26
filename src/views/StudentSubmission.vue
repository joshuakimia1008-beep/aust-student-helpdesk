<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Send } from 'lucide-vue-next'
import { inputCls } from '@/components/site/formkit'
import { backend, type CaseRecord } from '@/lib/backend'
import { KIND_LABEL } from '@/lib/store'
const route = useRoute()
const reference = computed(() => String(route.params.reference ?? ''))
const record = ref<CaseRecord | null>(null)
const evidenceUrls = ref<string[]>([])
const busy = ref(true)
const sending = ref(false)
const body = ref('')
const error = ref('')
async function load() {
  busy.value = true
  try {
    record.value = await backend.studentSubmission(reference.value)
    const paths = record.value?.details.evidence_paths
    if (Array.isArray(paths)) evidenceUrls.value = (await Promise.all(paths.map((path) => backend.evidenceUrl(String(path))))).filter((url): url is string => Boolean(url))
  }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not load this submission.' }
  finally { busy.value = false }
}
async function send() {
  error.value = ''
  sending.value = true
  try { await backend.sendMessage(reference.value, body.value); body.value = ''; await load() }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not send message.' }
  finally { sending.value = false }
}
onMounted(load)
</script>
<template>
  <main class="mx-auto max-w-4xl space-y-6 px-5 py-10 sm:px-8">
    <RouterLink to="/student" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft class="h-4 w-4"/> Back to dashboard</RouterLink>
    <p v-if="error" role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{{ error }}</p>
    <div v-if="busy" class="rounded-2xl bg-card p-10 text-center text-muted-foreground">Loading submission…</div>
    <div v-else-if="!record" class="rounded-2xl bg-card p-10 text-center">Submission not found.</div>
    <template v-else>
      <header><p class="eyebrow text-primary">{{ KIND_LABEL[record.kind] }} · {{ record.reference_code }}</p><h1 class="text-display mt-2 text-4xl">{{ record.title }}</h1><p class="mt-2 text-sm text-muted-foreground">Sent {{ new Date(record.created_at).toLocaleString() }}{{ record.location ? ` · ${record.location}` : '' }}</p></header>
      <section class="rounded-2xl bg-card p-6 shadow-soft"><div class="flex items-center justify-between gap-4"><h2 class="font-medium">Status</h2><span class="rounded-full bg-muted px-3 py-1 text-sm capitalize">{{ record.status }}</span></div><p v-if="record.admin_response" class="mt-4 whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm">{{ record.admin_response }}</p></section>
      <section class="rounded-2xl bg-card p-6 shadow-soft"><h2 class="eyebrow mb-4 text-muted-foreground">Submission details</h2><dl class="grid gap-4 sm:grid-cols-2"><div v-for="[key,value] in Object.entries(record.details).filter(([key])=>key!=='evidence_paths')" :key="key"><dt class="text-xs text-muted-foreground">{{ key.replaceAll('_',' ') }}</dt><dd class="mt-1 whitespace-pre-wrap text-sm">{{ value || '—' }}</dd></div></dl><div v-if="evidenceUrls.length" class="mt-5"><h3 class="mb-3 text-sm font-medium">Evidence images</h3><div class="flex flex-wrap gap-3"><a v-for="(url,index) in evidenceUrls" :key="url" :href="url" target="_blank" rel="noreferrer"><img :src="url" :alt="`Evidence ${index+1}`" class="h-24 w-24 rounded-xl object-cover"/></a></div></div></section>
      <section class="rounded-2xl bg-card p-6 shadow-soft"><h2 class="font-medium">Messages</h2><p v-if="!record.messages?.length" class="mt-3 text-sm text-muted-foreground">No messages yet.</p><ul v-else class="mt-4 space-y-3"><li v-for="m in record.messages" :key="m.id" class="rounded-xl bg-muted p-4"><p class="text-xs font-medium">{{ m.from }} · {{ new Date(m.created_at).toLocaleString() }}</p><p class="mt-2 whitespace-pre-wrap text-sm">{{ m.body }}</p></li></ul><form class="mt-5 space-y-3" @submit.prevent="send"><label class="block"><span class="mb-2 block text-sm font-medium">Send a message</span><textarea v-model="body" required maxlength="5000" rows="3" :class="inputCls"/></label><button :disabled="sending" class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"><Send class="h-4 w-4"/>{{ sending ? 'Sending…' : 'Send message' }}</button></form></section>
    </template>
  </main>
</template>
