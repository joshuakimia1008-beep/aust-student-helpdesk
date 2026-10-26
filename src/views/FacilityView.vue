<script setup lang="ts">
import { ref } from 'vue'
import Field from '@/components/site/Field.vue'
import FormCard from '@/components/site/FormCard.vue'
import { inputCls } from '@/components/site/formkit'
import PageShell from '@/components/site/PageShell.vue'
import SubmitButton from '@/components/site/SubmitButton.vue'
import Success from '@/components/site/Success.vue'
import { backend } from '@/lib/backend'
import { isSupabaseMode } from '@/lib/supabase'
const ITEMS = ['Fan', 'Air conditioner', 'Mattress', 'Chair / desk', 'Wardrobe', 'Light bulb', 'Curtains', 'Other']
const done = ref<string | null>(null)
const emailStatus = ref<'sent' | 'failed' | 'not_configured' | 'demo'>('demo')
const error = ref('')
const busy = ref(false)
async function onSubmit(e: Event) {
  const form = e.currentTarget as HTMLFormElement
  const f = new FormData(form)
  const fileInput = form.elements.namedItem('evidence') as HTMLInputElement
  const g = (k: string) => String(f.get(k) ?? '').trim()
  const item = g('item') === 'Other' ? g('other') || 'Other' : g('item')
  error.value = ''
  busy.value = true
  try {
    const result = await backend.registerSubmission({
      kind: 'facility', title: `Request: ${item}`, location: g('location'),
      details: { item_requested: item, quantity: g('qty'), office: g('office'), reason: g('reason') },
    })
    done.value = result.reference_code
    emailStatus.value = 'email' in result ? result.email : 'demo'
    if (fileInput.files?.length) {
      if (!isSupabaseMode) error.value = 'Your request was saved in demo mode, but demo mode cannot keep private image files.'
      else {
        try { await backend.uploadEvidence(result.id, result.reference_code, fileInput.files) }
        catch (uploadError) { error.value = `Your request was sent (${result.reference_code}), but the images did not upload: ${uploadError instanceof Error ? uploadError.message : 'Try again later.'}` }
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) { error.value = e instanceof Error ? e.message : 'Could not send your request.' }
  finally { busy.value = false }
}
</script>
<template>
  <PageShell eyebrow="Student Affairs & Operations" title="Request an item" intro="Need a fan, an A/C or something else for your room or space? Send a request and track it from your student dashboard. Your account details are not shown to case staff.">
    <p v-if="error && done" role="alert" class="mb-5 rounded-xl bg-warning/20 p-4 text-sm">{{ error }}</p>
    <Success v-if="done" :id="done" what="Request" :email-status="emailStatus" />
    <form v-else class="space-y-6" @submit.prevent="onSubmit">
      <p v-if="error" role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{{ error }}</p>
      <FormCard title="The request">
        <Field label="Item"><select required name="item" :class="inputCls"><option v-for="i in ITEMS" :key="i">{{ i }}</option></select></Field>
        <Field label="If other, specify"><input name="other" maxlength="160" :class="inputCls" /></Field>
        <Field label="Quantity"><input required type="number" min="1" max="100" value="1" name="qty" :class="inputCls" /></Field>
        <Field label="Office"><select name="office" :class="inputCls"><option>Operations</option><option>Student Affairs</option></select></Field>
        <Field label="Where is it needed?" full><input required maxlength="200" name="location" placeholder="e.g. Nnamdi Azikiwe Hall, Room 8" :class="inputCls" /></Field>
        <Field label="Reason" hint="Don't include your name or student number unless staff need it." full><textarea required name="reason" rows="4" maxlength="5000" :class="inputCls" /></Field>
        <Field label="Evidence images (optional)" hint="Up to 4 JPG, PNG, or WebP images. Images are resized before upload. A photo can still reveal who or where you are." full><input name="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp" :class="inputCls" /></Field>
      </FormCard>
      <SubmitButton :disabled="busy">{{ busy ? 'Sending…' : 'Send request' }}</SubmitButton>
    </form>
  </PageShell>
</template>
