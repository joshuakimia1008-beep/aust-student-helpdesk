<script setup lang="ts">
import { CircleCheck } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ id: string; what: string; emailStatus?: 'sent' | 'failed' | 'not_configured' | 'demo' }>(), { emailStatus: 'demo' })
</script>

<template>
  <div class="rounded-3xl bg-card p-10 text-center shadow-soft">
    <CircleCheck class="mx-auto h-14 w-14 text-success" />
    <h2 class="mt-5 text-3xl font-medium tracking-tight">{{ what }} received</h2>
    <p class="mt-3 text-muted-foreground">Your reference number is</p>
    <p class="mt-2 text-4xl font-medium tracking-tight text-primary">{{ id }}</p>
    <p class="mx-auto mt-4 max-w-md text-sm text-muted-foreground">Keep this reference number. Track progress and read replies from your student portal.</p>
    <p v-if="props.emailStatus === 'sent'" role="status" class="mx-auto mt-4 max-w-md rounded-xl bg-success/10 p-3 text-sm text-success">A confirmation email with this reference number has been sent to your account email.</p>
    <p v-else-if="props.emailStatus === 'failed' || props.emailStatus === 'not_configured'" role="status" class="mx-auto mt-4 max-w-md rounded-xl bg-warning/20 p-3 text-sm">Your request is saved. We couldn't send a confirmation email right now; keep the reference above and check your portal for updates.</p>
    <p v-else class="mx-auto mt-4 max-w-md text-xs text-muted-foreground">Demo mode: confirmation email is available after Supabase and email are configured.</p>
    <RouterLink to="/student" class="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground hover:bg-primary-deep">Go to my portal</RouterLink>
  </div>
</template>
