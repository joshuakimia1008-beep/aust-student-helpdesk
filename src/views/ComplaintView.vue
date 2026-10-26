<script setup lang="ts">
import { ref } from 'vue'
import Field from '@/components/site/Field.vue'
import FormCard from '@/components/site/FormCard.vue'
import { inputCls, today } from '@/components/site/formkit'
import PageShell from '@/components/site/PageShell.vue'
import SubmitButton from '@/components/site/SubmitButton.vue'
import Success from '@/components/site/Success.vue'
import { backend } from '@/lib/backend'
import { isSupabaseMode } from '@/lib/supabase'
const done = ref<string | null>(null)
const emailStatus = ref<'sent' | 'failed' | 'not_configured' | 'demo'>('demo')
const error = ref('')
const busy = ref(false)
async function onSubmit(e: Event) {
  const form = e.currentTarget as HTMLFormElement
  const f = new FormData(form)
  const fileInput = form.elements.namedItem('evidence') as HTMLInputElement
  const g = (k: string) => String(f.get(k) ?? '').trim()
  error.value = ''
  busy.value = true
  try {
    const result = await backend.registerSubmission({
      kind: 'complaint', title: g('title'), location: g('location'),
      details: { date: g('date'), description: g('details'), desired_resolution: g('resolution') },
    })
    done.value = result.reference_code
    emailStatus.value = 'email' in result ? result.email : 'demo'
    if (fileInput.files?.length) {
      if (!isSupabaseMode) error.value = 'Your complaint was saved in demo mode, but demo mode cannot keep private image files.'
      else {
        try { await backend.uploadEvidence(result.id, result.reference_code, fileInput.files) }
        catch (uploadError) { error.value = `Your complaint was sent (${result.reference_code}), but the images did not upload: ${uploadError instanceof Error ? uploadError.message : 'Try again later.'}` }
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) { error.value = e instanceof Error ? e.message : 'Could not send your complaint.' }
  finally { busy.value = false }
}
</script>
<template>
  <PageShell eyebrow="Operations office" title="Lodge a complaint" intro="Tell us what happened, when, and where. Your account is linked privately so you can track progress; staff see a reference number instead of your account details. Your description may still identify you, so leave out personal details you do not need to share.">
    <p v-if="error && done" role="alert" class="mb-5 rounded-xl bg-warning/20 p-4 text-sm">{{ error }}</p>
    <Success v-if="done" :id="done" what="Complaint" :email-status="emailStatus" />
    <form v-else class="space-y-6" @submit.prevent="onSubmit">
      <p v-if="error" role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{{ error }}</p>
      <FormCard title="The complaint">
        <Field label="Short title"><input required maxlength="160" name="title" placeholder="e.g. Broken window" :class="inputCls" /></Field>
        <Field label="Date of complaint"><input required type="date" name="date" :value="today()" :class="inputCls" /></Field>
        <Field label="Location" full><input required maxlength="200" name="location" placeholder="e.g. Kwame Nkrumah Hall, Room 12" :class="inputCls" /></Field>
        <Field label="Complaint details" hint="What happened, when, and where? Avoid including your name or student number." full><textarea required name="details" rows="5" maxlength="5000" :class="inputCls" /></Field>
        <Field label="Desired resolution" full><textarea required name="resolution" rows="3" maxlength="2000" :class="inputCls" /></Field>
        <Field label="Evidence images (optional)" hint="Up to 4 JPG, PNG, or WebP images. Images are resized before upload. The system removes most photo metadata, but a photo can still show who or where you are." full><input name="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp" :class="inputCls" /></Field>
      </FormCard>
      <SubmitButton :disabled="busy">{{ busy ? 'Sending…' : 'Submit complaint' }}</SubmitButton>
    </form>
  </PageShell>
</template>
