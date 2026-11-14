<script setup lang="ts">
import { ref } from 'vue'
import { BookOpen, CircleUserRound, FilePlus2, LayoutDashboard, LogOut, Menu, MessagesSquare, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import logo from '@/lib/aust-logo.png'
import { authUser, signOut } from '@/lib/auth'

const router = useRouter()
const mobileNavOpen = ref(false)
const links = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/complaint', label: 'Lodge a complaint', icon: MessagesSquare, exact: false },
  { to: '/facility-request', label: 'Request an item', icon: FilePlus2, exact: false },
  { to: '/venue-request', label: 'Book a venue', icon: BookOpen, exact: false },
  { to: '/student/profile', label: 'My profile', icon: CircleUserRound, exact: false },
]

async function exitToPublicSite() {
  mobileNavOpen.value = false
  try { await signOut() } finally { await router.replace('/') }
}
</script>

<template>
  <div class="min-h-screen bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]" @keydown.esc.window="mobileNavOpen = false">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-[260px] min-w-0 flex-col border-r bg-card px-5 py-6 lg:flex">
      <RouterLink to="/student" class="flex min-w-0 items-center gap-3">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background p-1 shadow-soft"><img :src="logo" alt="AUST logo" class="h-full w-full object-contain" /></span>
        <span class="min-w-0 text-sm font-semibold">AUST Helpdesk<span class="block text-xs font-normal text-muted-foreground">Student portal</span></span>
      </RouterLink>
      <nav class="mt-10 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" aria-label="Student navigation">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" :exact-active-class="link.exact ? 'bg-primary text-primary-foreground shadow-soft' : ''" active-class="bg-primary text-primary-foreground shadow-soft" class="flex min-w-0 shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted lg:w-full">
          <component :is="link.icon" class="h-4 w-4 shrink-0" />{{ link.label }}
        </RouterLink>
      </nav>
      <div class="mt-auto flex flex-col gap-3 border-t pt-4">
        <button class="flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted" @click="exitToPublicSite">Public site</button>
        <div class="flex min-w-0 items-center gap-3">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{{ authUser?.name.slice(0, 1) || 'S' }}</span>
          <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ authUser?.name }}</p><p class="truncate text-xs text-muted-foreground">{{ authUser?.email }}</p></div>
          <button class="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Sign out" title="Sign out" @click="exitToPublicSite"><LogOut class="h-4 w-4" /></button>
        </div>
      </div>
    </aside>

    <header class="flex min-w-0 items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-6 lg:hidden">
      <RouterLink to="/student" class="flex min-w-0 items-center gap-3" @click="mobileNavOpen = false">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background p-1 shadow-soft"><img :src="logo" alt="AUST logo" class="h-full w-full object-contain" /></span>
        <span class="min-w-0 text-sm font-semibold">AUST Helpdesk<span class="block text-xs font-normal text-muted-foreground">Student portal</span></span>
      </RouterLink>
      <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-muted-foreground hover:bg-muted" aria-label="Open student navigation" aria-controls="student-mobile-navigation" :aria-expanded="mobileNavOpen" @click="mobileNavOpen = true">
        <Menu class="h-5 w-5" />
      </button>
    </header>

    <div v-if="mobileNavOpen" class="fixed inset-0 z-50 lg:hidden">
      <button type="button" class="absolute inset-0 h-full w-full bg-foreground/30" aria-label="Close student navigation" @click="mobileNavOpen = false" />
      <aside id="student-mobile-navigation" class="relative z-10 flex h-full w-72 max-w-[calc(100vw-2rem)] min-w-0 flex-col bg-card p-5 shadow-soft" role="dialog" aria-modal="true" aria-label="Student navigation">
        <div class="flex items-center justify-between gap-3">
          <RouterLink to="/student" class="flex min-w-0 items-center gap-3" @click="mobileNavOpen = false">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background p-1 shadow-soft"><img :src="logo" alt="AUST logo" class="h-full w-full object-contain" /></span>
            <span class="min-w-0 text-sm font-semibold">AUST Helpdesk<span class="block text-xs font-normal text-muted-foreground">Student portal</span></span>
          </RouterLink>
          <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-muted-foreground hover:bg-muted" aria-label="Close student navigation" @click="mobileNavOpen = false"><X class="h-5 w-5" /></button>
        </div>
        <nav class="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" aria-label="Student navigation">
          <RouterLink v-for="link in links" :key="link.to" :to="link.to" :exact-active-class="link.exact ? 'bg-primary text-primary-foreground shadow-soft' : ''" active-class="bg-primary text-primary-foreground shadow-soft" class="flex min-w-0 shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition hover:bg-muted" @click="mobileNavOpen = false">
            <component :is="link.icon" class="h-4 w-4 shrink-0" />{{ link.label }}
          </RouterLink>
        </nav>
        <div class="mt-5 flex flex-col gap-3 border-t pt-4">
          <button class="flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted" @click="exitToPublicSite">Public site</button>
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{{ authUser?.name.slice(0, 1) || 'S' }}</span>
            <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ authUser?.name }}</p><p class="truncate text-xs text-muted-foreground">{{ authUser?.email }}</p></div>
            <button class="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Sign out" title="Sign out" @click="exitToPublicSite"><LogOut class="h-4 w-4" /></button>
          </div>
        </div>
      </aside>
    </div>

    <div class="min-w-0 w-full lg:col-start-2"><RouterView /></div>
  </div>
</template>
