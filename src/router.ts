import { createRouter, createWebHistory } from 'vue-router'
import { applyHead, type HeadMeta } from '@/lib/head'
import { authReady, authUser, initAuth } from '@/lib/auth'

declare module 'vue-router' {
  interface RouteMeta {
    head?: HeadMeta
    requiresAuth?: boolean
    requiresStudent?: boolean
    requiresAdmin?: boolean
    authPage?: 'register' | 'verify' | 'forgot' | 'reset'
  }
}

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
      meta: {
        head: {
          title: 'AUST Student Helpdesk — Complaints, Requests & Venue Booking',
          description:
            'Report faults, request items like fans or A/C, and book halls and fields at the African University of Science and Technology, Abuja.',
          ogTitle: 'AUST Student Helpdesk',
          ogDescription: 'Lodge complaints, request items and book venues with AUST Student Affairs & Operations.',
        },
      },
    },
    {
      path: '/hostels',
      component: () => import('@/views/HostelsView.vue'),
      meta: {
        head: {
          title: 'AUST Hostels — Rooms, Amenities & Fees',
          description:
            'Nnamdi Azikiwe, Kwame Nkrumah, Julius Nyerere Halls and Knowledge Court: room types, amenities and fees at AUST Abuja.',
          ogTitle: 'AUST Hostels — Rooms & Fees',
          ogDescription: "Explore AUST's halls and hostels, room options and fees per semester.",
        },
      },
    },
    {
      path: '/complaint',
      component: () => import('@/views/ComplaintView.vue'),
      meta: {
        requiresStudent: true,
        head: {
          title: 'Lodge a Complaint — AUST Student Helpdesk',
          description: 'Report something broken or wrong in your room, a lecture hall or anywhere on the AUST campus.',
          ogTitle: 'Lodge a Complaint — AUST',
          ogDescription: 'Report faults and issues to AUST Operations.',
        },
      },
    },
    {
      path: '/facility-request',
      component: () => import('@/views/FacilityView.vue'),
      meta: {
        requiresStudent: true,
        head: {
          title: 'Request an Item — AUST Student Helpdesk',
          description: 'Request a fan, air conditioner, furniture or other supplies from AUST Student Affairs and Operations.',
          ogTitle: 'Request an Item — AUST',
          ogDescription: 'Ask for fans, A/C units and other room essentials.',
        },
      },
    },
    {
      path: '/venue-request',
      component: () => import('@/views/VenueView.vue'),
      meta: {
        requiresStudent: true,
        head: {
          title: 'Book a Venue — AUST Student Helpdesk',
          description: 'Request the use of a hall, field, classroom or open space at AUST for your event.',
          ogTitle: 'Book a Venue — AUST',
          ogDescription: 'Reserve AUST halls, fields and spaces for events.',
        },
      },
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: {
        requiresAdmin: true,
        head: {
          title: 'Admin Dashboard — AUST Student Helpdesk',
          description: 'Manage complaints, venue bookings and facility requests for AUST Student Affairs & Operations.',
          robots: 'noindex',
        },
      },
      children: [
        { path: '', component: () => import('@/views/admin/AdminOverview.vue') },
        { path: 'requests', component: () => import('@/views/admin/AdminRequests.vue') },
        { path: 'requests/:id', component: () => import('@/views/admin/AdminRequestDetail.vue') },
        { path: 'notifications', component: () => import('@/views/admin/AdminNotifications.vue') },
        { path: 'admins', component: () => import('@/views/admin/AdminAdmins.vue') },
        { path: 'logs', component: () => import('@/views/admin/AdminLogs.vue') },
        { path: 'settings', component: () => import('@/views/admin/AdminSettings.vue') },
      ],
    },
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    { path: '/register', component: () => import('@/views/AuthViews.vue'), meta: { authPage: 'register' } },
    { path: '/auth/verify', component: () => import('@/views/AuthViews.vue'), meta: { authPage: 'verify' } },
    { path: '/forgot-password', component: () => import('@/views/AuthViews.vue'), meta: { authPage: 'forgot' } },
    { path: '/reset-password', component: () => import('@/views/AuthViews.vue'), meta: { authPage: 'reset' } },
    {
      path: '/student', component: () => import('@/views/StudentLayout.vue'), meta: { requiresStudent: true },
      children: [
        { path: '', component: () => import('@/views/StudentDashboard.vue') },
        { path: 'profile', component: () => import('@/views/StudentProfile.vue') },
        { path: 'submissions/:reference', component: () => import('@/views/StudentSubmission.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
})

router.beforeEach(async (to) => {
  try {
    if (!authReady.value) await initAuth()
  } catch (error) {
    console.error('Could not initialize authentication', error)
    return { path: '/login', query: { next: to.fullPath, error: 'auth-unavailable' } }
  }
  const needsAuth = to.matched.some((record) => record.meta.requiresAuth || record.meta.requiresStudent || record.meta.requiresAdmin)
  if (needsAuth && !authUser.value) return { path: '/login', query: { next: to.fullPath } }
  if (to.matched.some((record) => record.meta.requiresAdmin) && !authUser.value?.role) return { path: '/student' }
  if (to.matched.some((record) => record.meta.requiresStudent) && authUser.value?.role) return { path: '/admin' }
  if (to.path === '/login' && authUser.value) return authUser.value.role ? '/admin' : '/student'
})

router.afterEach((to) => {
  const head = [...to.matched].reverse().find((r) => r.meta.head)?.meta.head
  applyHead(head)
})
