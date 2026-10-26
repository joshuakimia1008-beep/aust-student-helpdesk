<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { inputCls } from '@/components/site/formkit'
import { authUser, signOut } from '@/lib/auth'
import { backend } from '@/lib/backend'
const form = reactive({ display_name: '', phone: '' })
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
onMounted(async () => {
  try { const profile = await backend.profile(); form.display_name = profile.display_name; form.phone = profile.phone ?? '' }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not load your profile.' }
  finally { loading.value = false }
})
async function save() {
  error.value = ''; success.value = ''; saving.value = true
  try { await backend.updateProfile(form.display_name, form.phone); success.value = 'Profile saved.' }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not save your profile.' }
  finally { saving.value = false }
}
async function logout() { await signOut(); location.href = '/login' }
</script>
<template>
  <main class="mx-auto max-w-3xl space-y-6 px-5 py-10 sm:px-8"><div class="flex justify-between"><RouterLink to="/student" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft class="h-4 w-4"/>Dashboard</RouterLink><button class="text-sm text-muted-foreground hover:underline" @click="logout">Sign out</button></div><header><p class="eyebrow text-primary">Account</p><h1 class="text-display mt-2 text-4xl">Your profile</h1><p class="mt-2 text-sm text-muted-foreground">Your contact details are private and are not shown to case staff.</p></header><form class="space-y-5 rounded-2xl bg-card p-6 shadow-soft" @submit.prevent="save"><p v-if="error" role="alert" class="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{{ error }}</p><p v-if="success" role="status" class="rounded-xl bg-success/10 p-3 text-sm text-success">{{ success }}</p><label class="block"><span class="mb-2 block text-sm font-medium">Account email</span><input :value="authUser?.email" disabled class="w-full rounded-xl border border-input bg-muted px-4 py-3 text-base text-muted-foreground"/></label><label class="block"><span class="mb-2 block text-sm font-medium">Name</span><input v-model="form.display_name" required maxlength="100" :class="inputCls"/></label><label class="block"><span class="mb-2 block text-sm font-medium">Phone (optional)</span><input v-model="form.phone" maxlength="32" type="tel" :class="inputCls"/></label><button :disabled="loading||saving" class="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{{ saving?'Saving…':'Save profile' }}</button></form></main>
</template>
