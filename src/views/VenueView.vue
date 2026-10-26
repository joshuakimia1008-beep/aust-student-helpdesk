<script setup lang="ts">
import { ref } from 'vue'
import Field from '@/components/site/Field.vue'
import FormCard from '@/components/site/FormCard.vue'
import { inputCls } from '@/components/site/formkit'
import PageShell from '@/components/site/PageShell.vue'
import SubmitButton from '@/components/site/SubmitButton.vue'
import Success from '@/components/site/Success.vue'
import { VENUES } from '@/lib/hostels'
import { backend } from '@/lib/backend'
const done = ref<string | null>(null)
const emailStatus = ref<'sent' | 'failed' | 'not_configured' | 'demo'>('demo')
const error = ref('')
const busy = ref(false)
async function onSubmit(e: Event) {
  const f = new FormData(e.currentTarget as HTMLFormElement)
  const g = (k: string) => String(f.get(k) ?? '').trim()
  error.value = ''
  busy.value = true
  try {
    const result = await backend.registerSubmission({
      kind: 'venue', title: g('event'), location: g('venue'),
      details: {
        venue_type: g('venueType'), event_purpose: g('purpose'), event_date: g('date'),
        start_time: g('start'), end_time: g('end'), expected_attendance: g('attendance'),
        facilities_needed: g('facilities'), external_guests: g('guests'),
        faculty_adviser: g('adviser'), applicant_type: g('type'),
        declaration: 'Agreed to comply with AUST venue-use policies',
      },
    })
    done.value = result.reference_code
    emailStatus.value = 'email' in result ? result.email : 'demo'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) { error.value = e instanceof Error ? e.message : 'Could not send your booking request.' }
  finally { busy.value = false }
}
</script>
<template>
  <PageShell eyebrow="Student Affairs office" title="Book a venue" intro="Request a hall, field, classroom or open space for your event. Track the request from your student dashboard. Avoid putting personal details in the event description.">
    <Success v-if="done" :id="done" what="Venue request" :email-status="emailStatus" />
    <form v-else class="space-y-6" @submit.prevent="onSubmit">
      <p v-if="error" role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{{ error }}</p>
      <FormCard title="Event">
        <Field label="Applicant type"><select name="type" :class="inputCls"><option v-for="x in ['Student', 'Staff', 'Club', 'External']" :key="x">{{ x }}</option></select></Field>
        <Field label="Venue type"><select name="venueType" :class="inputCls"><option v-for="x in ['Hall', 'Field', 'Classroom', 'Open Space', 'Other']" :key="x">{{ x }}</option></select></Field>
        <Field label="Preferred venue"><input required list="venues" name="venue" :class="inputCls" /><datalist id="venues"><option v-for="v in VENUES" :key="v" :value="v" /></datalist></Field>
        <Field label="Event name"><input required maxlength="160" name="event" :class="inputCls" /></Field>
        <Field label="Event purpose" full><textarea required name="purpose" rows="3" maxlength="5000" :class="inputCls" /></Field>
        <Field label="Event date"><input required type="date" name="date" :class="inputCls" /></Field>
        <Field label="Expected attendance"><input required type="number" min="1" max="10000" name="attendance" :class="inputCls" /></Field>
        <Field label="Start time"><input required type="time" name="start" :class="inputCls" /></Field>
        <Field label="End time"><input required type="time" name="end" :class="inputCls" /></Field>
        <Field label="Facilities needed" full><input name="facilities" maxlength="1000" placeholder="e.g. Projector, PA system, chairs" :class="inputCls" /></Field>
        <Field label="External guests?"><select name="guests" :class="inputCls"><option>No</option><option>Yes</option></select></Field>
        <Field label="Faculty adviser (if applicable)"><input name="adviser" maxlength="160" :class="inputCls" /></Field>
        <label class="flex items-start gap-3 sm:col-span-2"><input required type="checkbox" class="mt-1 h-5 w-5 accent-primary" /><span class="text-sm">I agree to comply with AUST venue-use policies.</span></label>
      </FormCard>
      <SubmitButton :disabled="busy">{{ busy ? 'Sending…' : 'Submit venue request' }}</SubmitButton>
    </form>
  </PageShell>
</template>
