<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Fan,
  FileText,
  MailCheck,
  Play,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-vue-next";
import HeroSlideshow from "@/components/site/HeroSlideshow.vue";
import SiteFooter from "@/components/site/SiteFooter.vue";
import SiteHeader from "@/components/site/SiteHeader.vue";
import { authUser } from "@/lib/auth";
import { HOSTELS } from "@/lib/hostels";

const isStudent = computed(() =>
  Boolean(authUser.value && !authUser.value.role),
);
const videoElement = ref<HTMLVideoElement | null>(null);
const videoStarted = ref(false);
const videoUnavailable = ref(false);
const guideVideoUrl = "/videos/aust-helpdesk-submission-guide.mp4";
const services = [
  {
    to: "/complaint",
    icon: Wrench,
    title: "Lodge a complaint",
    text: "Something broken in your room, a lecture hall or anywhere on campus? Tell us what happened.",
  },
  {
    to: "/facility-request",
    icon: Fan,
    title: "Request an item",
    text: "Need a fan, an A/C, a mattress or other supplies? Send a request to the Operations office.",
  },
  {
    to: "/venue-request",
    icon: CalendarDays,
    title: "Book a venue",
    text: "Reserve a hall, field, classroom or open space for your event or club activity.",
  },
];
const features = [
  {
    icon: ShieldCheck,
    t: "Reviewed by the right office",
    d: "Complaints go to Operations; venue bookings to Student Affairs.",
  },
  {
    icon: MailCheck,
    t: "Clear email replies",
    d: "You'll receive the decision, the reason and the next steps by email.",
  },
  {
    icon: Clock,
    t: "A reference for everything",
    d: "Each submission gets a reference number so you can follow up.",
  },
];
const steps = [
  {
    icon: UserRound,
    title: "Sign in",
    text: "Use your student account to access the helpdesk.",
  },
  {
    icon: FileText,
    title: "Choose a request",
    text: "Select a complaint, facility request or venue booking.",
  },
  {
    icon: Wrench,
    title: "Add the details",
    text: "Complete the form and attach an image if it helps explain the issue.",
  },
  {
    icon: CheckCircle2,
    title: "Submit",
    text: "Send your request to the relevant university office.",
  },
  {
    icon: MailCheck,
    title: "Track updates",
    text: "Follow its status from your dashboard and check for system emails.",
  },
];
const fromPrice = (h: (typeof HOSTELS)[number]) =>
  [...h.rooms.map((r) => r.perSemester)].sort()[0];
async function playGuide() {
  if (!videoElement.value) return;
  try {
    await videoElement.value.play();
    videoStarted.value = true;
  } catch {
    videoUnavailable.value = true;
  }
}
function onVideoError() {
  videoUnavailable.value = true;
}
</script>

<template>
  <div>
    <SiteHeader overlay />
    <HeroSlideshow>
      <h1
        class="text-display mt-5 max-w-4xl animate-rise text-6xl text-ink-foreground sm:text-7xl lg:text-[7.5rem]"
      >
        Your campus,<br /><span class="text-primary">looked after.</span>
      </h1>
      <p class="mt-6 max-w-xl animate-rise text-lg text-ink-foreground/80">
        {{
          isStudent
            ? "Report issues, request essentials and book spaces across AUST."
            : authUser?.role
              ? "Review helpdesk cases for your admin team."
              : "Explore AUST's halls, hostels, rooms and amenities."
        }}
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <RouterLink
          v-if="isStudent"
          to="/complaint"
          class="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
          >Lodge a complaint</RouterLink
        >
        <RouterLink
          v-else-if="!authUser"
          to="/login"
          class="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
          >Sign in</RouterLink
        >
        <RouterLink
          v-else-if="authUser.role"
          to="/admin"
          class="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
          >Admin dashboard</RouterLink
        >
        <RouterLink
          to="/hostels"
          class="rounded-full border border-ink-foreground/40 px-7 py-3.5 font-medium text-ink-foreground transition hover:bg-ink-foreground/10"
          >Explore hostels</RouterLink
        >
        <RouterLink
          v-if="!authUser"
          to="/register"
          class="rounded-full border border-ink-foreground/40 px-7 py-3.5 font-medium text-ink-foreground transition hover:bg-ink-foreground/10"
          >Create account</RouterLink
        >
      </div>
    </HeroSlideshow>

    <section
      class="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20"
      aria-labelledby="guide-title"
    >
      <div
        class="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14"
      >
        <div>
          <p class="eyebrow text-primary">A simpler way to get support</p>
          <h2 id="guide-title" class="text-display mt-3 text-4xl sm:text-5xl">
            How the Helpdesk Works
          </h2>
          <p class="mt-5 max-w-lg leading-7 text-muted-foreground">
            See how to send a request, what details to include, and where to
            follow its progress once it reaches the right AUST team.
          </p>
          <ol class="mt-7 space-y-4">
            <li
              v-for="(step, index) in steps"
              :key="step.title"
              class="flex gap-3.5"
            >
              <span
                class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"
                ><component :is="step.icon" class="h-4 w-4"
              /></span>
              <div>
                <p class="text-sm font-semibold">
                  <span class="mr-1 text-primary">0{{ index + 1 }}</span>
                  {{ step.title }}
                </p>
                <p class="mt-0.5 text-sm leading-5 text-muted-foreground">
                  {{ step.text }}
                </p>
              </div>
            </li>
          </ol>
        </div>
        <div class="overflow-hidden rounded-3xl border bg-card shadow-soft">
          <div class="guide-video relative aspect-video overflow-hidden bg-ink">
            <video
              ref="videoElement"
              class="absolute inset-0 h-full w-full bg-ink object-cover"
              controls
              preload="none"
              @play="videoStarted = true"
              @error="onVideoError"
            >
              <source :src="guideVideoUrl" type="video/mp4" />
              Your browser does not support HTML video. Please use the steps
              alongside this player to learn how to submit a request.
            </video>
            <div
              v-if="!videoStarted"
              class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-ink/90 via-ink/75 to-primary-deep/55 px-6 text-center text-ink-foreground"
            >
              <span
                class="mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/10 shadow-soft"
                ><Play class="ml-1 h-7 w-7 fill-current"
              /></span>
              <p class="text-lg font-semibold">Your guide, in a few minutes</p>
              <p class="mt-1 text-sm text-ink-foreground/70">
                A quick walkthrough of submitting and tracking a request.
              </p>
            </div>
            <button
              v-if="!videoStarted"
              type="button"
              class="absolute inset-0 z-10 cursor-pointer rounded-none focus-visible:outline-4 focus-visible:outline-primary"
              aria-label="Play the AUST Helpdesk submission guide"
              @click="playGuide"
            />
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="isStudent"
      class="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20"
    >
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow text-primary">What can we help with?</p>
          <h2 class="text-display mt-3 text-4xl sm:text-5xl">
            Three ways to reach us.
          </h2>
        </div>
        <p class="max-w-md text-muted-foreground">
          Every submission goes straight to the Student Affairs or Operations
          office, and you'll get an email when it's reviewed.
        </p>
      </div>
      <div class="mt-10 grid gap-5 md:grid-cols-3">
        <RouterLink
          v-for="s in services"
          :key="s.to"
          :to="s.to"
          class="group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl border bg-card p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-lift sm:p-8"
        >
          <span
            class="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"
            ><component :is="s.icon" class="h-5 w-5"
          /></span>
          <div>
            <h3 class="text-xl font-semibold tracking-tight">{{ s.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ s.text }}
            </p>
          </div>
          <ArrowUpRight
            class="absolute right-7 top-7 h-5 w-5 text-muted-foreground transition group-hover:rotate-45 group-hover:text-primary"
          />
        </RouterLink>
      </div>
    </section>

    <section class="bg-ink py-16 text-ink-foreground sm:py-20">
      <div class="mx-auto max-w-7xl px-5 sm:px-8">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="eyebrow text-primary">Halls & hostels</p>
            <h2 class="text-display mt-3 text-4xl sm:text-5xl">
              Where AUST lives.
            </h2>
          </div>
          <RouterLink
            to="/hostels"
            class="rounded-full border border-ink-foreground/30 px-6 py-3 text-sm hover:bg-ink-foreground/10"
            >See rooms & fees</RouterLink
          >
        </div>
        <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <RouterLink
            v-for="h in HOSTELS"
            :key="h.name"
            to="/hostels"
            class="group overflow-hidden rounded-3xl bg-ink-foreground/5"
            ><div class="aspect-[4/5] overflow-hidden">
              <img
                :src="h.images[0]"
                :alt="h.name"
                loading="lazy"
                class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <div class="p-6">
              <h3 class="text-xl font-medium">{{ h.name }}</h3>
              <p class="mt-1 text-sm text-ink-foreground/60">
                {{ h.rooms.length }} room types · from {{ fromPrice(h) }}/sem
              </p>
            </div></RouterLink
          >
        </div>
      </div>
    </section>

    <section
      v-if="isStudent"
      class="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-3"
    >
      <div
        v-for="f in features"
        :key="f.t"
        class="border-t-2 border-primary pt-6"
      >
        <component :is="f.icon" class="h-6 w-6 text-primary" />
        <h3 class="mt-4 text-lg font-semibold tracking-tight">{{ f.t }}</h3>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ f.d }}</p>
      </div>
    </section>
    <div v-if="!authUser" class="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
      <RouterLink
        to="/login"
        class="group flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary p-6 sm:p-8"
        ><div>
          <p class="eyebrow text-primary">Need help?</p>
          <p class="mt-2 text-xl font-semibold">
            Sign in to send or track a request.
          </p>
        </div>
        <span
          class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >Open the Helpdesk
          <ArrowRight
            class="h-4 w-4 transition group-hover:translate-x-1" /></span
      ></RouterLink>
    </div>
    <SiteFooter />
  </div>
</template>
