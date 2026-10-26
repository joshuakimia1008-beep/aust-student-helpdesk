<script setup lang="ts">
import { BookOpen, CircleUserRound, FilePlus2, LayoutDashboard, LogOut, MessagesSquare } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import logo from '@/lib/aust-logo.png'
import { authUser, signOut } from '@/lib/auth'

const router = useRouter()
const links = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/complaint', label: 'Lodge a complaint', icon: MessagesSquare, exact: false },
  { to: '/facility-request', label: 'Request an item', icon: FilePlus2, exact: false },
  { to: '/venue-request', label: 'Book a venue', icon: BookOpen, exact: false },
  { to: '/student/profile', label: 'My profile', icon: CircleUserRound, exact: false },
]
async function exitToPublicSite() {
  try { await signOut() } finally { await router.replace('/') }
}
</script>

<template>
  <div class="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
    <aside class="border-b bg-card px-4 py-4 lg:fixed lg:inset-y-0 lg:w-[260px] lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <RouterLink to="/student" class="flex items-center gap-3">
        <span class="grid h-10 w-10 place-items-center rounded-full bg-background p-1 shadow-soft"><img :src="logo" alt="AUST logo" class="h-full w-full object-contain" /></span>
        <span class="text-sm font-semibold">AUST Helpdesk<span class="block text-xs font-normal text-muted-foreground">Student portal</span></span>
      </RouterLink>
      <nav class="mt-5 flex gap-1 overflow-x-auto lg:mt-10 lg:flex-col" aria-label="Student navigation">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" :exact-active-class="link.exact ? 'bg-primary text-primary-foreground shadow-soft' : ''" active-class="bg-primary text-primary-foreground shadow-soft" class="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted lg:w-full">
          <component :is="link.icon" class="h-4 w-4" />{{ link.label }}
        </RouterLink>
      </nav>
      <div class="mt-5 flex items-center gap-3 border-t pt-4 lg:absolute lg:inset-x-5 lg:bottom-5 lg:mt-0">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{{ authUser?.name.slice(0, 1) || 'S' }}</span>
        <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ authUser?.name }}</p><p class="truncate text-xs text-muted-foreground">{{ authUser?.email }}</p></div>
        <button class="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Sign out" title="Sign out" @click="exitToPublicSite"><LogOut class="h-4 w-4" /></button>
      </div>
      <button class="mt-3 flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted lg:mt-0 lg:absolute lg:inset-x-5 lg:bottom-[92px] lg:w-[calc(100%-2.5rem)]" @click="exitToPublicSite">Public site</button>
    </aside>
    <div class="min-w-0 lg:col-start-2"><RouterView /></div>
  </div>
</template>
