import { computed, ref } from 'vue'
import type { Role } from './store'
import { isSupabaseMode, supabase } from './supabase'

export type HelpdeskUser = {
  id: string
  email: string
  name: string
  role: Role | null
  emailVerified: boolean
  demo: boolean
}

const DEMO_SESSION_KEY = 'aust-helpdesk-demo-session'
export const authUser = ref<HelpdeskUser | null>(null)
export const authReady = ref(false)
export const isSignedIn = computed(() => authUser.value !== null)
let listening = false

function readDemoSession(): HelpdeskUser | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as HelpdeskUser
    if (value.demo !== true || typeof value.id !== 'string') return null
    return value
  } catch {
    return null
  }
}

async function setSupabaseUser(user: { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> } | null) {
  if (!user) {
    authUser.value = null
    return
  }
  let role: Role | null = null
  if (supabase) {
    const { data } = await supabase.rpc('current_admin_role')
    if (['Super Admin', 'Complaint Admin', 'Venue Admin', 'Read-Only Admin'].includes(data)) {
      role = data as Role
    }
  }
  authUser.value = {
    id: user.id,
    email: user.email ?? '',
    name: String(user.user_metadata?.full_name ?? user.email ?? 'Student'),
    role,
    emailVerified: Boolean(user.email_confirmed_at),
    demo: false,
  }
}

export async function initAuth() {
  if (authReady.value) return
  if (!isSupabaseMode) {
    authUser.value = readDemoSession()
    authReady.value = true
    return
  }
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  await setSupabaseUser(data.session?.user ?? null)
  if (!listening) {
    listening = true
    supabase.auth.onAuthStateChange((_event, session) => {
      void setSupabaseUser(session?.user ?? null)
    })
  }
  authReady.value = true
}

export async function register(email: string, password: string, fullName: string) {
  if (!supabase || !isSupabaseMode) {
    return { error: 'Use the demo sign-in button to preview the app. Demo mode does not create real accounts.' }
  }
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: fullName.trim() },
      emailRedirectTo: `${window.location.origin}/auth/verify`,
    },
  })
  return { error: error ? 'Could not create the account. Check the details or try signing in.' : null }
}

export async function signIn(email: string, password: string) {
  if (!supabase || !isSupabaseMode) {
    return { error: 'Use the demo sign-in button to preview the app.' }
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (!error && data.user) {
    await setSupabaseUser(data.user)
    authReady.value = true
  }
  return { error: error?.message ?? null }
}

export async function sendPasswordReset(email: string) {
  if (!supabase || !isSupabaseMode) {
    return { error: 'Password reset is available after you connect Supabase.' }
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  // Keep the response general so the page does not reveal whether an account exists.
  return { error: error ? 'Could not send the reset email. Check the address and try again.' : null }
}

export async function updatePassword(password: string) {
  if (!supabase) return { error: 'Password reset is available after you connect Supabase.' }
  const { error } = await supabase.auth.updateUser({ password })
  return { error: error?.message ?? null }
}

export async function resendVerification(email: string) {
  if (!supabase || !isSupabaseMode) return { error: 'Connect Supabase to send verification emails.' }
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() })
  return { error: error ? 'Could not resend verification. Wait a moment and try again.' : null }
}

export function signInDemo(role: 'student' | 'admin' = 'student') {
  if (isSupabaseMode) return
  const user: HelpdeskUser = role === 'admin'
    ? { id: 'demo-admin-fixed', email: 'demo-admin@example.invalid', name: 'Demo Admin', role: 'Super Admin', emailVerified: true, demo: true }
    : { id: 'demo-student-fixed', email: 'demo-student@example.invalid', name: 'Demo Student', role: null, emailVerified: true, demo: true }
  authUser.value = user
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user))
  authReady.value = true
}

export async function signOut() {
  if (isSupabaseMode && supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } else {
    localStorage.removeItem(DEMO_SESSION_KEY)
  }
  authUser.value = null
}
