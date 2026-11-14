```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  CircleCheck,
} from "lucide-vue-next";

import logo from "@/lib/aust-logo.png";
import { signIn } from "@/lib/auth";

const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);
const showPassword = ref(false);

// AUST email domain restriction.
// Accepts @aust.edu.ng and departmental subdomains.
function isValidAustEmail(value: string): boolean {
  const normalizedEmail = value.trim().toLowerCase();

  const emailPattern = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)*aust\.edu\.ng$/;

  return emailPattern.test(normalizedEmail) && normalizedEmail.length <= 254;
}

const successMessage = computed(() => {
  if (route.query.verified === "1") {
    return "Email verified successfully. You can now sign in.";
  }

  if (route.query.passwordReset === "1") {
    return "Your password has been changed successfully. You can now sign in.";
  }

  return "";
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push("/");
  }
}

async function submit() {
  error.value = "";

  const normalizedEmail = email.value.trim().toLowerCase();

  // Restrict login to official AUST email addresses.
  if (!isValidAustEmail(normalizedEmail)) {
    error.value =
      "Access restricted. Please use your official AUST email address ending in .aust.edu.ng.";

    return;
  }

  if (!password.value) {
    error.value = "Please enter your password.";
    return;
  }

  busy.value = true;

  try {
    // Real Supabase authentication.
    const result = await signIn(normalizedEmail, password.value);

    if (result.error) {
      error.value = result.error;
      return;
    }

    // Prevent external redirects.
    const next =
      typeof route.query.next === "string" &&
      route.query.next.startsWith("/") &&
      !route.query.next.startsWith("//")
        ? route.query.next
        : "/student";

    await router.replace(next);
  } catch {
    error.value = "Something went wrong while signing in. Please try again.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main
    class="login-screen relative isolate flex min-h-svh items-center justify-center overflow-hidden px-4 py-8 sm:px-6"
    aria-label="Sign in to AUST Helpdesk"
  >
    <!-- Background image -->
    <div
      class="login-screen__image absolute inset-0 -z-20"
      aria-hidden="true"
    />

    <!-- Background overlays -->
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-br from-ink/75 via-ink/45 to-primary-deep/40"
      aria-hidden="true"
    />

    <div class="absolute inset-0 -z-10 bg-ink/15" aria-hidden="true" />

    <!-- Login card -->
    <section
      class="w-full max-w-[440px] rounded-[1.75rem] border border-white/40 bg-card/95 p-6 shadow-2xl shadow-ink/25 backdrop-blur-md sm:p-9"
    >
      <!-- Go back -->
      <button
        type="button"
        @click="goBack"
        class="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ArrowLeft class="h-4 w-4" />
        Go back
      </button>

      <!-- AUST branding -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <span
          class="grid h-12 w-12 place-items-center rounded-full bg-background p-1.5 shadow-soft"
        >
          <img
            :src="logo"
            alt="AUST logo"
            class="h-full w-full object-contain"
          />
        </span>

        <span
          class="text-xs font-semibold uppercase leading-relaxed tracking-[0.12em] text-foreground"
        >
          African University of<br />
          Science and Technology
        </span>
      </RouterLink>

      <!-- Heading -->
      <div class="mt-8">
        <p class="eyebrow text-primary">Student Helpdesk</p>

        <h1
          class="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Good to have you back.
        </h1>

        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to follow your requests and updates from AUST.
        </p>
      </div>

      <!-- Login form -->
      <form class="mt-7 space-y-5" @submit.prevent="submit">
        <!-- Success message -->
        <p
          v-if="successMessage"
          role="status"
          class="flex items-start gap-2.5 rounded-xl border border-success/20 bg-success/10 p-3.5 text-sm leading-6 text-success"
        >
          <CircleCheck class="mt-0.5 h-5 w-5 shrink-0" />
          <span>{{ successMessage }}</span>
        </p>

        <!-- Error message -->
        <p
          v-if="error"
          role="alert"
          class="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive"
        >
          {{ error }}
        </p>

        <!-- Email -->
        <label class="block">
          <span class="mb-2 block text-sm font-medium">
            AUST Email Address
          </span>

          <input
            v-model="email"
            required
            type="email"
            autocomplete="email"
            placeholder="name@department.aust.edu.ng"
            pattern="[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)*aust\.edu\.ng"
            title="Please use your official AUST email address ending in .aust.edu.ng."
            class="field-control"
          />

          <span class="mt-1.5 block text-xs leading-5 text-muted-foreground">
            Only official AUST staff and student email addresses are permitted.
          </span>
        </label>

        <!-- Password -->
        <label class="block">
          <span class="mb-2 block text-sm font-medium"> Password </span>

          <span class="relative block">
            <input
              v-model="password"
              required
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Enter your password"
              class="field-control pr-12"
            />

            <button
              type="button"
              class="absolute inset-y-0 right-1.5 inline-grid w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </span>
        </label>

        <!-- Forgot password -->
        <div class="-mt-2 text-right">
          <RouterLink
            to="/forgot-password"
            class="text-sm font-medium text-primary hover:text-primary-deep hover:underline"
          >
            Forgot password?
          </RouterLink>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="busy"
          class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65"
        >
          <LockKeyhole v-if="!busy" class="h-4 w-4" />

          {{ busy ? "Signing in..." : "Sign in securely" }}

          <ArrowRight v-if="!busy" class="h-4 w-4" />
        </button>

        <!-- Registration -->
        <p class="text-center text-sm text-muted-foreground">
          New to the Helpdesk?

          <RouterLink
            to="/register"
            class="font-semibold text-primary hover:underline"
          >
            Create an account
          </RouterLink>
        </p>
      </form>
    </section>

    <span class="sr-only"> AUST campus background image. </span>
  </main>
</template>

<style scoped>
.login-screen__image {
  background-color: #332b27;
  background-image: url("/images/login-background.jpg");
  background-position: center;
  background-size: cover;
}
</style>
```
