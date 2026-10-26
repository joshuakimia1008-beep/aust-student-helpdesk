```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ScrollText } from "lucide-vue-next";
import { backend, type LogRecord } from "@/lib/backend";

const logs = ref<LogRecord[]>([]);
const busy = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const result = await backend.logs();
    logs.value = result as LogRecord[];
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Could not load the activity log.";
  } finally {
    busy.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div>
      <p class="eyebrow text-primary">Audit trail</p>
      <h1 class="text-display mt-2 text-4xl">Activity Log</h1>
      <p class="mt-2 text-muted-foreground">
        Case actions recorded for your role. Student identities are not shown.
      </p>
    </div>

    <p
      v-if="error"
      role="alert"
      class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
    >
      {{ error }}
    </p>

    <div class="overflow-hidden rounded-2xl bg-card shadow-soft">
      <p v-if="busy" class="px-6 py-12 text-center text-muted-foreground">
        Loading…
      </p>

      <p
        v-else-if="logs.length === 0"
        class="flex flex-col items-center gap-3 px-6 py-16 text-muted-foreground"
      >
        <ScrollText class="h-8 w-8" />
        No activity recorded yet.
      </p>

      <ul v-else class="divide-y">
        <li
          v-for="log in logs"
          :key="log.id"
          class="flex flex-wrap items-center gap-3 px-6 py-4 text-sm"
        >
          <span class="text-muted-foreground">
            {{ log.action.replaceAll("_", " ") }}
          </span>

          <span
            v-if="log.reference_code"
            class="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs"
          >
            {{ log.reference_code }}
          </span>

          <span
            v-if="log.metadata?.status"
            class="rounded-full bg-muted px-2 py-0.5 text-xs"
          >
            {{ log.metadata.status }}
          </span>

          <span class="ml-auto text-xs text-muted-foreground">
            {{ new Date(log.created_at).toLocaleString() }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
```
