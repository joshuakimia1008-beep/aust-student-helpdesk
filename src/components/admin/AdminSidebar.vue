<script setup lang="ts">
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from '@/lib/aust-logo.png'
import { adminSections, isSectionActive } from '@/lib/admin-nav'
import { authUser, signOut } from '@/lib/auth'
defineEmits<{ navigate: [] }>()
const route = useRoute()
const router = useRouter()
const sections = computed(() => adminSections.filter((section) => section.to !== '/admin/admins' || authUser.value?.role === 'Super Admin'))
async function logout() { await signOut(); await router.replace('/login') }
async function exitToPublicSite() { try { await signOut() } finally { await router.replace('/') } }
</script>
<template>
  <div class="flex h-full flex-col gap-6 bg-sidebar p-5">
    <RouterLink to="/admin" class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-full bg-card p-1 shadow-soft"><img :src="logo" alt="AUST logo" class="h-full w-full object-contain"/></span><span class="text-sm font-semibold leading-tight">AUST Helpdesk<span class="block text-xs font-normal text-muted-foreground">Admin console</span></span></RouterLink>
    <nav class="flex flex-1 flex-col gap-1"><RouterLink v-for="s in sections" :key="s.to" :to="s.to" class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" :class="isSectionActive(route.path,s.to,s.exact)?'bg-primary text-primary-foreground shadow-soft':'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'" @click="$emit('navigate')"><component :is="s.icon" class="h-4 w-4 shrink-0"/>{{ s.label }}</RouterLink></nav>
    <div class="mt-auto space-y-3 border-t border-sidebar-border pt-4"><div class="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-3"><span class="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{{ authUser?.name.slice(0,1) }}</span><div class="min-w-0"><p class="truncate text-sm font-medium">{{ authUser?.name }}</p><p class="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck class="h-3 w-3"/>{{ authUser?.role }}</p></div></div><button class="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm text-muted-foreground hover:bg-sidebar-accent" @click="logout"><LogOut class="h-4 w-4"/>Sign out</button><button class="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-sm text-muted-foreground hover:bg-sidebar-accent" @click="exitToPublicSite"><ArrowLeft class="h-4 w-4"/>Public site</button></div>
  </div>
</template>
