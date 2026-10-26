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
      forgot: "Enter your email address to request a password reset link.",
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
      const result = await register(email.value, password.value, name.value);

      if (result.error) {
        error.value = result.error;
        return;
      }

      message.value =
        "If registration was accepted, check your inbox for a verification link before signing in.";
    } else if (page.value === "forgot") {
      const result = await sendPasswordReset(email.value);

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

async function resend() {
  error.value = "";
  message.value = "";
  busy.value = true;

  try {
    const result = await resendVerification(email.value);

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
 * After successful verification, clear the temporary session
 * and send the student to the login page.
 */
async function finishVerification() {
  if (!supabase) {
    error.value = "Connect Supabase before using email verification.";
    return;
  }

  // Clear any temporary session established by the confirmation link.
  // Redirect even if signing out the temporary session fails.
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
    // Supabase confirmation links may contain tokens in the URL hash:
    // /auth/verify#access_token=...&refresh_token=...&type=signup
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

    // Supabase may process the URL fragment automatically during
    // client initialization. Check whether it established a session.
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      error.value =
        "We couldn't confirm your verification status. Please try the link again.";
      return;
    }

    const user = sessionData.session?.user;

    // Only treat this as successful if the user is confirmed and
    // the verification callback supplied an authentication session.
    // Otherwise, do not assume verification succeeded.
    if (
      user?.email_confirmed_at &&
      (window.location.hash.includes("access_token") ||
        route.query.code ||
        route.query.token_hash)
    ) {
      await finishVerification();
      return;
    }

    message.value =
      "Open the verification link sent to your email. If needed, enter your email below to request another link.";
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
        <p
          v-if="message"
          role="status"
          class="rounded-xl border border-success/20 bg-success/10 p-3.5 text-sm text-success"
        >
          {{ message }}
        </p>

        <p
          v-if="error"
          role="alert"
          class="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive"
        >
          {{ error }}
        </p>

        <template v-if="page === 'register'">
          <label class="block">
            <span class="mb-2 block text-sm font-medium">Full name</span>

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
            <span class="mb-2 block text-sm font-medium">Email address</span>

            <input
              v-model="email"
              required
              type="email"
              autocomplete="email"
              placeholder="you@aust.edu.ng"
              class="field-control"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium">Password</span>

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

        <template v-else-if="page === 'forgot' || page === 'verify'">
          <label class="block">
            <span class="mb-2 block text-sm font-medium">Email address</span>

            <input
              v-model="email"
              required
              type="email"
              autocomplete="email"
              placeholder="you@aust.edu.ng"
              class="field-control"
            />
          </label>
        </template>

        <template v-else-if="page === 'reset'">
          <label class="block">
            <span class="mb-2 block text-sm font-medium">New password</span>

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

        <button
          v-else
          type="button"
          :disabled="busy"
          class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-65"
          @click="resend"
        >
          {{ busy ? "Please wait..." : "Resend verification email" }}
        </button>

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
