<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import logo from '@/lib/aust-logo.png'
import { authUser, signOut } from '@/lib/auth'

withDefaults(defineProps<{ overlay?: boolean }>(), { overlay: false })

const router = useRouter()
const isStudent = computed(() => Boolean(authUser.value && !authUser.value.role))
const dashboardPath = computed(() => authUser.value?.role ? '/admin' : '/student')
const navigation = computed(() => {
  const links = [{ to: '/hostels', label: 'Hostels' }]
  if (isStudent.value) {
    links.push(
      { to: '/complaint', label: 'Lodge a complaint' },
      { to: '/facility-request', label: 'Request an item' },
      { to: '/venue-request', label: 'Book a venue' },
    )
  }
  return links
})

async function logout() {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <header
    :class="overlay
      ? 'absolute inset-x-0 top-0 z-30'
      : 'sticky top-0 z-30 border-b bg-background/85 backdrop-blur'"
  >
    <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
      <RouterLink to="/" class="flex items-center gap-3">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card p-1 shadow-soft sm:h-12 sm:w-12">
          <img :src="logo" alt="AUST logo" class="h-full w-full object-contain" />
        </span>
        <span class="text-sm font-medium leading-tight" :class="overlay ? 'text-ink-foreground' : 'text-foreground'">
          African University of<br />Science and Technology
        </span>
      </RouterLink>

      <nav class="-mx-1 flex flex-wrap items-center gap-1 sm:mx-0 sm:justify-end" aria-label="Main navigation">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          active-class="text-primary!"
          class="min-h-10 whitespace-nowrap rounded-full px-2.5 py-2 text-xs transition-colors sm:px-3 sm:text-sm"
          :class="overlay
            ? 'text-ink-foreground/85 hover:bg-ink-foreground/10 hover:text-ink-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
        >
          {{ item.label }}
        </RouterLink>

        <template v-if="authUser">
          <RouterLink
            :to="dashboardPath"
            class="ml-1 whitespace-nowrap rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-deep sm:px-4 sm:text-sm"
          >
            {{ authUser.role ? 'Admin dashboard' : 'My dashboard' }}
          </RouterLink>
          <button
            type="button"
            class="whitespace-nowrap rounded-full px-3 py-2 text-xs transition-colors sm:text-sm"
            :class="overlay
              ? 'text-ink-foreground/85 hover:bg-ink-foreground/10'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
            @click="logout"
          >
            Sign out
          </button>
        </template>
        <template v-else>
          <RouterLink
            to="/login"
            class="ml-1 whitespace-nowrap rounded-full px-3 py-2 text-xs transition-colors sm:text-sm"
            :class="overlay
              ? 'text-ink-foreground/85 hover:bg-ink-foreground/10'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
          >
            Sign in
          </RouterLink>
          <RouterLink
            to="/register"
            class="whitespace-nowrap rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-deep sm:px-4 sm:text-sm"
          >
            Create account
          </RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>
