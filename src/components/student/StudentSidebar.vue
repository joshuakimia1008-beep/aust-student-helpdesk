<script setup lang="ts">
import { useRoute } from "vue-router";
import logo from "@/lib/aust-logo.png";
import { authUser } from "@/lib/auth";
import { isStudentSectionActive, studentSections } from "@/lib/student-nav";
defineEmits<{ navigate: [] }>();
const route = useRoute();
</script>
<template>
  <div class="flex h-full flex-col gap-6 bg-sidebar p-5">
    <RouterLink
      to="/student"
      class="flex items-center gap-3"
      @click="$emit('navigate')"
      ><span
        class="grid h-11 w-11 place-items-center rounded-full bg-card p-1 shadow-soft"
        ><img
          :src="logo"
          alt="AUST logo"
          class="h-full w-full object-contain" /></span
      ><span class="text-sm font-semibold leading-tight"
        >AUST Helpdesk<span
          class="block text-xs font-normal text-muted-foreground"
          >Student portal</span
        ></span
      ></RouterLink
    >
    <nav class="flex flex-1 flex-col gap-1" aria-label="Student navigation">
      <RouterLink
        v-for="s in studentSections"
        :key="s.to"
        :to="s.to"
        class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        :class="
          isStudentSectionActive(route.path, s.to, s.exact)
            ? 'bg-primary text-primary-foreground shadow-soft'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        "
        :aria-current="
          isStudentSectionActive(route.path, s.to, s.exact) ? 'page' : undefined
        "
        @click="$emit('navigate')"
        ><component :is="s.icon" class="h-4 w-4 shrink-0" />{{
          s.label
        }}</RouterLink
      >
    </nav>
    <div class="mt-auto border-t border-sidebar-border pt-4">
      <div class="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-3">
        <span
          class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >{{ authUser?.name?.slice(0, 1) || "S" }}</span
        >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">{{ authUser?.name }}</p>
          <p class="truncate text-xs text-muted-foreground">
            {{ authUser?.email }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
