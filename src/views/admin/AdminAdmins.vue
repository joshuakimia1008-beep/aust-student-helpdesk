<script setup lang="ts">
import { ShieldCheck, UserPlus } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { inputCls } from '@/components/site/formkit'
import { authUser } from '@/lib/auth'
import { backend, type TeamRecord } from '@/lib/backend'
import { isSupabaseMode } from '@/lib/supabase'
import type { Role } from '@/lib/store'
const ROLES: Role[] = ['Super Admin', 'Complaint Admin', 'Venue Admin', 'Read-Only Admin']
const admins = ref<TeamRecord[]>([])
const busy = ref(false)
const loading = ref(true)
const error = ref('')
const notice = ref('')
const canManage = computed(() => authUser.value?.role === 'Super Admin' && isSupabaseMode)
const form = reactive({ name: '', email: '', role: 'Read-Only Admin' as Role })
async function load() {
  loading.value = true
  try { admins.value = await backend.team() }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not load team.' }
  finally { loading.value = false }
}
async function onSubmit() {
  error.value = ''; notice.value = ''; busy.value = true
  try {
    await backend.setAdminByEmail(form.email, form.role, true, form.name)
    notice.value = 'Staff role saved.'
    form.name = ''; form.email = ''; form.role = 'Read-Only Admin'
    await load()
  } catch (e) { error.value = e instanceof Error ? e.message : 'Could not save staff role.' }
  finally { busy.value = false }
}
async function toggleActive(member: TeamRecord) {
  error.value = ''; notice.value = ''; busy.value = true
  try { await backend.setAdminByEmail(member.email, member.role, !member.active, member.display_name); await load() }
  catch (e) { error.value = e instanceof Error ? e.message : 'Could not update staff access.' }
  finally { busy.value = false }
}
onMounted(load)
</script>
<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <div><p class="eyebrow text-primary">Access</p><h1 class="text-display mt-2 text-4xl">Team & Roles</h1><p class="mt-2 text-muted-foreground">Roles control which cases staff can see and change. Staff emails are shown here only to Super Admins.</p></div>
    <p v-if="error" role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{{ error }}</p><p v-if="notice" role="status" class="rounded-xl bg-success/10 p-4 text-sm text-success">{{ notice }}</p>
    <div v-if="!isSupabaseMode" class="rounded-2xl border border-warning/30 bg-card p-5 text-sm">Team management is turned off in demo mode. Demo users are not real admins.</div>
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="overflow-hidden rounded-2xl bg-card shadow-soft lg:col-span-2"><p v-if="loading" class="px-6 py-10 text-sm text-muted-foreground">Loading team…</p><p v-else-if="!admins.length" class="px-6 py-10 text-sm text-muted-foreground">No team members are available.</p><ul v-else class="divide-y"><li v-for="a in admins" :key="a.user_id" class="flex flex-wrap items-center gap-4 px-6 py-4"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary">{{ a.display_name.slice(0,1) }}</span><div class="min-w-0 flex-1"><p class="font-medium">{{ a.display_name }}</p><p class="truncate text-sm text-muted-foreground">{{ a.email }}</p></div><span class="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"><ShieldCheck class="h-3 w-3"/>{{ a.role }}</span><span class="rounded-full px-2 py-1 text-xs" :class="a.active?'bg-success/15 text-success':'bg-muted text-muted-foreground'">{{ a.active?'Active':'Disabled' }}</span><button v-if="canManage && a.user_id !== authUser?.id" :disabled="busy" class="rounded-full border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50" @click="toggleActive(a)">{{ a.active?'Disable':'Enable' }}</button></li></ul></div>
      <form v-if="canManage" class="h-fit space-y-4 rounded-2xl bg-card p-6 shadow-soft" @submit.prevent="onSubmit"><h2 class="flex items-center gap-2 font-medium"><UserPlus class="h-4 w-4 text-primary"/>Add or update staff</h2><p class="text-xs text-muted-foreground">The person must already have a verified account. Ask them to register and verify their email first.</p><input v-model="form.name" required maxlength="100" placeholder="Staff display name" :class="inputCls"/><input v-model="form.email" required type="email" placeholder="Verified staff email" :class="inputCls"/><select v-model="form.role" :class="inputCls"><option v-for="role in ROLES" :key="role">{{ role }}</option></select><button :disabled="busy" class="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{{ busy?'Saving…':'Save staff role' }}</button></form>
      <div v-else-if="isSupabaseMode" class="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-soft">Only a Super Admin can manage staff. Read-Only Admins cannot make changes.</div>
    </div>
  </div>
</template>
