<script setup lang="ts">
import { Bell, Menu, Moon, Sun, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import { adminSections, isSectionActive } from '@/lib/admin-nav'
import { useTheme } from '@/lib/useTheme'

const { theme, toggle } = useTheme()
const open = ref(false)
const route = useRoute()
const title = computed(() => adminSections.find((s) => isSectionActive(route.path, s.to, s.exact))?.label ?? 'Admin')
</script>

<template>
  <div class="flex min-h-screen bg-background">
    <!-- Desktop sidebar -->
    <aside class="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
      <AdminSidebar />
    </aside>

    <!-- Mobile sidebar -->
    <div v-if="open" class="fixed inset-0 z-50 lg:hidden">
      <div class="absolute inset-0 bg-ink/50" @click="open = false" />
      <aside class="absolute inset-y-0 left-0 w-[min(19rem,calc(100vw-2.5rem))] border-r border-sidebar-border shadow-2xl">
        <AdminSidebar @navigate="open = false" />
      </aside>
    </div>

    <div class="flex min-h-screen flex-1 flex-col lg:pl-64">
      <header class="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/85 px-5 py-3 backdrop-blur sm:px-8">
        <button class="grid h-10 w-10 place-items-center rounded-xl hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary lg:hidden" aria-label="Open menu" :aria-expanded="open" @click="open = true">
          <Menu class="h-5 w-5" />
        </button>
        <p class="text-sm font-medium text-muted-foreground">{{ title }}</p>
        <div class="ml-auto flex items-center gap-2">
          <RouterLink to="/admin/notifications" class="relative rounded-full p-2.5 hover:bg-muted" aria-label="Notifications">
            <Bell class="h-5 w-5" />
          </RouterLink>
          <button
            class="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            aria-label="Toggle theme"
            @click="toggle()"
          >
            <Sun v-if="theme === 'dark'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
            <span class="hidden sm:inline">{{ theme === 'dark' ? 'Light' : 'Dark' }}</span>
          </button>
        </div>
      </header>
      <main class="flex-1 px-5 py-8 sm:px-8">
        <RouterView />
      </main>
    </div>
    <button
      v-if="open"
      class="fixed bottom-5 right-5 z-50 rounded-full bg-card p-3 shadow-lift lg:hidden"
      aria-label="Close menu"
      @click="open = false"
    >
      <X class="h-5 w-5" />
    </button>
  </div>
</template>
