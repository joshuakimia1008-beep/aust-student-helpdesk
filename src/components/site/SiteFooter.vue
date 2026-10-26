<script setup lang="ts">
import { computed } from 'vue'
import logo from '@/lib/aust-logo.png'
import { authUser } from '@/lib/auth'

const isStudent = computed(() => Boolean(authUser.value && !authUser.value.role))
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
</script>

<template>
  <footer class="bg-ink text-ink-foreground">
    <div class="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
      <div class="flex items-start gap-4">
        <span class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-card p-1">
          <img :src="logo" alt="AUST logo" class="h-full w-full object-contain" />
        </span>
        <div>
          <p class="font-medium">AUST Student Helpdesk</p>
          <p class="mt-1 text-sm text-ink-foreground/60">Student Affairs & Operations Office · Abuja</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-sm text-ink-foreground/70">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="hover:text-primary">
          {{ item.label }}
        </RouterLink>
        <template v-if="!authUser">
          <RouterLink to="/login" class="hover:text-primary">Sign in</RouterLink>
          <RouterLink to="/register" class="hover:text-primary">Create account</RouterLink>
        </template>
        <RouterLink v-else-if="authUser.role" to="/admin" class="hover:text-primary">Admin console</RouterLink>
        <RouterLink v-else to="/student" class="hover:text-primary">My dashboard</RouterLink>
      </div>

      <p class="text-sm italic text-ink-foreground/60 md:text-right">Knowledge is Freedom</p>
    </div>
  </footer>
</template>
