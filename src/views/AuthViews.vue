```vue
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  UserRoundPlus,
} from "lucide-vue-next";

import logo from "@/lib/aust-logo.png";

import {
  register,
  resendVerification,
  sendPasswordReset,
  updatePassword,
} from "@/lib/auth";

import { supabase } from "@/lib/supabase";

const route = useRoute();
const router = useRouter();

const page = computed(() => String(route.meta.authPage ?? "register"));

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const message = ref("");
const busy = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// AUST email restriction: accepts root and departmental subdomains.
function isValidAustEmail(value: string): boolean {
  const normalizedEmail = value.trim().toLowerCase();

  const emailPattern = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)*aust\.edu\.ng$/;

  return emailPattern.test(normalizedEmail) && normalizedEmail.length <= 254;
}

const title = computed(
  () =>
    ({
      register: "Create your account",
      verify: "Check your email",
      forgot: "Reset your password",
      reset: "Choose a new password",
    })[page.value] ?? "Account",
);

const heading = computed(
  () =>
    ({
      register: "Create your account.",
      verify: "Check your inbox.",
      forgot: "Forgot your password?",
      reset: "Secure your account.",
    })[page.value] ?? "Your account",
);

const description = computed(
  () =>
    ({
      register:
        "Join the AUST Helpdesk to submit requests and keep track of updates.",
      verify: "Check your inbox for your email verification link.",
      forgot: "Enter your AUST email address to request a password reset link.",
      reset: "Choose a new password to regain access to your account.",
    })[page.value] ?? "Manage your AUST Helpdesk account securely.",
);

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push("/");
  }
}

async function submit() {
  error.value = "";
  message.value = "";

  const normalizedEmail = email.value.trim().toLowerCase();

  // Restrict registration and password recovery to AUST email addresses.
  if (
    (page.value === "register" || page.value === "forgot") &&
    !isValidAustEmail(normalizedEmail)
  ) {
    error.value =
      "Access restricted. Please use an official AUST email address ending in .aust.edu.ng.";
    return;
  }

  if (page.value === "register" && password.value.length < 12) {
    error.value = "Use at least 12 characters for your password.";
    return;
  }

  if (page.value === "reset") {
    if (password.value.length < 12) {
      error.value = "Use at least 12 characters for your password.";
      return;
    }

    if (password.value !== confirmPassword.value) {
      error.value = "The passwords do not match.";
      return;
    }
  }

  busy.value = true;

  try {
    if (page.value === "register") {
      const result = await register(
        normalizedEmail,
        password.value,
        name.value.trim(),
      );

      if (result.error) {
        error.value = result.error;
        return;
      }

      message.value =
        "Registration successful! Check your AUST inbox for your verification link.";
    } else if (page.value === "forgot") {
      const result = await sendPasswordReset(normalizedEmail);

      if (result.error) {
        error.value = result.error;
        return;
      }

      message.value =
        "If an account matches that email, a password reset link is on its way.";
    } else if (page.value === "reset") {
      const result = await updatePassword(password.value);

      if (result.error) {
        error.value = result.error;
        return;
      }

      await router.replace("/login?passwordReset=1");
    }
  } catch {
    error.value = "Something went wrong. Please try again.";
  } finally {
    busy.value = false;
  }
}

// Resend verification email.
async function resend() {
  error.value = "";
  message.value = "";

  const normalizedEmail = email.value.trim().toLowerCase();

  if (!isValidAustEmail(normalizedEmail)) {
    error.value =
      "Please enter a valid AUST email address ending in .aust.edu.ng.";
    return;
  }

  busy.value = true;

  try {
    const result = await resendVerification(normalizedEmail);

    if (result.error) {
      error.value = result.error;
      return;
    }

    message.value =
      "If registration was accepted, a verification link has been sent.";
  } catch {
    error.value = "Unable to resend the email. Please try again.";
  } finally {
    busy.value = false;
  }
}

/**
 * After successful verification:
 * 1. Clear the temporary Supabase session.
 * 2. Redirect to login.
 * 3. Display the verification success message.
 */
async function finishVerification() {
  if (!supabase) {
    error.value = "Connect Supabase before using email verification.";
    return;
  }

  try {
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });

    if (signOutError) {
      console.warn("Could not clear the temporary verification session.");
    }
  } catch {
    console.warn("Could not clear the temporary verification session.");
  }

  await router.replace({
    path: "/login",
    query: { verified: "1" },
  });
}

async function verifyCallback() {
  if (!supabase) {
    error.value = "Connect Supabase before using email verification.";
    return;
  }

  error.value = "";
  message.value = "";
  busy.value = true;

  try {
    // Handle Supabase confirmation links containing URL hash tokens.
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const hashType = hashParams.get("type");

    if (accessToken && refreshToken && hashType === "signup") {
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError || !data.user) {
        error.value =
          "We couldn't verify your email with this link. It may have expired. Please request a new verification email.";
        return;
      }

      if (!data.user.email_confirmed_at) {
        error.value =
          "Your email has not been confirmed yet. Please request a new verification email.";
        return;
      }

      await finishVerification();
      return;
    }

    // Handle PKCE confirmation links containing ?code=...
    const code = String(route.query.code ?? "");

    if (code) {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !data.user) {
        error.value =
          "We couldn't verify your email with this link. It may have expired. Please request a new verification email.";
        return;
      }

      if (!data.user.email_confirmed_at) {
        error.value =
          "Your email has not been confirmed yet. Please request a new verification email.";
        return;
      }

      await finishVerification();
      return;
    }

    // Handle links containing ?token_hash=...&type=signup
    const tokenHash = String(route.query.token_hash ?? "");
    const type = String(route.query.type ?? "");

    if (tokenHash && type === "signup") {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "signup",
      });

      if (verifyError || !data.user) {
        error.value =
          "We couldn't verify your email with this link. It may have expired. Please request a new verification email.";
        return;
      }

      if (!data.user.email_confirmed_at) {
        error.value =
          "Your email has not been confirmed yet. Please request a new verification email.";
        return;
      }

      await finishVerification();
      return;
    }

    // Supabase may automatically process the verification token
    // during client initialization. Check the resulting session.
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      error.value =
        "We couldn't confirm your verification status. Please try the link again.";
      return;
    }

    const user = sessionData.session?.user;

    // FIX: If Supabase has already established a session for a
    // confirmed user, redirect to login instead of showing the
    // redundant instruction to check their inbox.
    if (user?.email_confirmed_at) {
      await finishVerification();
      return;
    }

    // Only show this message if verification has not completed.
    message.value =
      "Your email verification has not been completed. Open the verification link sent to your AUST email, or request another link below.";
  } catch {
    error.value =
      "Something went wrong while verifying your email. Please try the link again or request a new one.";
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  if (page.value === "verify") {
    void verifyCallback();
  }
});
</script>

<template>
  <main
    class="auth-screen relative isolate flex min-h-svh items-center justify-center overflow-hidden px-4 py-8 sm:px-6"
    :aria-label="title"
  >
    <div
      :class="[
        'absolute inset-0 -z-20',
        page === 'register'
          ? 'auth-screen__register-image'
          : 'auth-screen__image',
      ]"
      aria-hidden="true"
    />

    <div
      class="absolute inset-0 -z-10 bg-gradient-to-br from-ink/75 via-ink/45 to-primary-deep/40"
      aria-hidden="true"
    />

    <div class="absolute inset-0 -z-10 bg-ink/15" aria-hidden="true" />

    <section
      class="w-full max-w-[480px] rounded-[1.75rem] border border-white/40 bg-card/95 p-6 shadow-2xl shadow-ink/25 backdrop-blur-md sm:p-9"
    >
      <button
        type="button"
        @click="goBack"
        class="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ArrowLeft class="h-4 w-4" />
        Go back
      </button>

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

      <div class="mt-8">
        <p class="eyebrow text-primary">Student Helpdesk</p>

        <h1
          class="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          {{ heading }}
        </h1>

        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {{ description }}
        </p>
      </div>

      <form class="mt-7 space-y-5" @submit.prevent="submit">
        <!-- Success message -->
        <p
          v-if="message"
          role="status"
          class="rounded-xl border border-success/20 bg-success/10 p-3.5 text-sm text-success"
        >
          {{ message }}
        </p>

        <!-- Error message -->
        <p
          v-if="error"
          role="alert"
          class="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive"
        >
          {{ error }}
        </p>

        <!-- REGISTRATION -->
        <template v-if="page === 'register'">
          <label class="block">
            <span class="mb-2 block text-sm font-medium"> Full name </span>

            <input
              v-model="name"
              required
              maxlength="100"
              autocomplete="name"
              placeholder="Enter your full name"
              class="field-control"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium">
              Official AUST Email Address
            </span>

            <input
              v-model="email"
              required
              type="email"
              autocomplete="email"
              placeholder="name@department.aust.edu.ng"
              pattern="[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)*aust\.edu\.ng"
              title="Only AUST email addresses ending in .aust.edu.ng are allowed."
              class="field-control"
            />

            <span class="mt-1.5 block text-xs leading-5 text-muted-foreground">
              Registration is exclusively available to AUST staff and students
              using an official email address ending in .aust.edu.ng.
            </span>
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium"> Password </span>

            <span class="relative block">
              <input
                v-model="password"
                required
                minlength="12"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 12 characters"
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

            <span class="mt-2 block text-xs leading-5 text-muted-foreground">
              Use at least 12 characters to help protect your account.
            </span>
          </label>
        </template>

        <!-- FORGOT PASSWORD / EMAIL VERIFICATION -->
        <template v-else-if="page === 'forgot' || page === 'verify'">
          <label class="block">
            <span class="mb-2 block text-sm font-medium">
              Official AUST Email Address
            </span>

            <input
              v-model="email"
              required
              type="email"
              autocomplete="email"
              placeholder="name@department.aust.edu.ng"
              pattern="[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)*aust\.edu\.ng"
              title="Only AUST email addresses ending in .aust.edu.ng are allowed."
              class="field-control"
            />

            <span class="mt-1.5 block text-xs leading-5 text-muted-foreground">
              Use your official AUST email address.
            </span>
          </label>
        </template>

        <!-- PASSWORD RESET -->
        <template v-else-if="page === 'reset'">
          <label class="block">
            <span class="mb-2 block text-sm font-medium"> New password </span>

            <span class="relative block">
              <input
                v-model="password"
                required
                minlength="12"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 12 characters"
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

          <label class="block">
            <span class="mb-2 block text-sm font-medium">
              Confirm new password
            </span>

            <span class="relative block">
              <input
                v-model="confirmPassword"
                required
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Enter your password again"
                class="field-control pr-12"
              />

              <button
                type="button"
                class="absolute inset-y-0 right-1.5 inline-grid w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                :aria-label="
                  showConfirmPassword ? 'Hide password' : 'Show password'
                "
                :aria-pressed="showConfirmPassword"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </span>
          </label>
        </template>

        <!-- SUBMIT BUTTON -->
        <button
          v-if="page !== 'verify'"
          type="submit"
          :disabled="busy"
          class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65"
        >
          <UserRoundPlus v-if="page === 'register' && !busy" class="h-4 w-4" />

          <ArrowRight v-if="page !== 'register' && !busy" class="h-4 w-4" />

          {{ busy ? "Please wait..." : title }}

          <ArrowRight v-if="page === 'register' && !busy" class="h-4 w-4" />
        </button>

        <!-- RESEND VERIFICATION -->
        <button
          v-else
          type="button"
          :disabled="busy"
          class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-65"
          @click="resend"
        >
          {{ busy ? "Please wait..." : "Resend verification email" }}
        </button>

        <!-- REGISTRATION FOOTER -->
        <p
          v-if="page === 'register'"
          class="text-center text-sm text-muted-foreground"
        >
          Already have an account?

          <RouterLink
            to="/login"
            class="font-semibold text-primary hover:underline"
          >
            Sign in
          </RouterLink>
        </p>

        <!-- OTHER AUTH PAGES FOOTER -->
        <p v-else class="text-center text-sm text-muted-foreground">
          <RouterLink
            to="/login"
            class="font-semibold text-primary hover:underline"
          >
            Back to sign in
          </RouterLink>
        </p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.auth-screen__image,
.auth-screen__register-image {
  background-color: #332b27;
  background-position: center;
  background-size: cover;
}

.auth-screen__image {
  background-image: url("/images/login-background.jpg");
}

.auth-screen__register-image {
  background-image: url("/images/register-background.jpg");
}
</style>
```
