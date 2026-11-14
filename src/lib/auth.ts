import { computed, ref } from "vue";
import type { Role } from "./store";
import { isSupabaseMode, supabase } from "./supabase";

export type HelpdeskUser = {
  id: string;
  email: string;
  name: string;
  role: Role | null;
  emailVerified: boolean;
  demo: boolean;
};

const DEMO_SESSION_KEY = "aust-helpdesk-demo-session";

export const authUser = ref<HelpdeskUser | null>(null);
export const authReady = ref(false);
export const isSignedIn = computed(() => authUser.value !== null);

let listening = false;

/**
 * AUST EMAIL VALIDATION
 * Accepts:
 * student@aust.edu.ng
 * student@cs.aust.edu.ng
 *
 * Rejects:
 * student@gmail.com
 * student@yahoo.com
 * student@fake-aust.edu.ng
 */
export function isValidAustEmail(value: string): boolean {
  const email = value.trim().toLowerCase();

  const pattern = /^[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)*aust\.edu\.ng$/;

  return email.length <= 254 && pattern.test(email);
}

/**
 * Validate full name.
 */
function isValidFullName(value: string): boolean {
  const name = value.trim();

  return name.length >= 2 && name.length <= 100 && /[a-zA-Z]/.test(name);
}

/**
 * Validate password.
 */
function isValidPassword(value: string): boolean {
  return value.length >= 12 && value.length <= 128;
}

/**
 * DEMO SESSION
 */
function readDemoSession(): HelpdeskUser | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);

    if (!raw) return null;

    const value = JSON.parse(raw) as HelpdeskUser;

    if (value.demo !== true || typeof value.id !== "string") {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

/**
 * SET SUPABASE USER
 *
 * Admin permissions are retrieved from the database.
 * Registration metadata cannot assign administrator privileges.
 */
async function setSupabaseUser(
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null,
) {
  if (!user) {
    authUser.value = null;
    return;
  }

  // Do not allow non-AUST accounts into the Helpdesk.
  if (!isValidAustEmail(user.email ?? "")) {
    authUser.value = null;

    if (supabase) {
      await supabase.auth.signOut({ scope: "local" });
    }

    return;
  }

  let role: Role | null = null;

  if (supabase) {
    const { data, error } = await supabase.rpc("current_admin_role");

    if (
      !error &&
      [
        "Super Admin",
        "Complaint Admin",
        "Venue Admin",
        "Read-Only Admin",
      ].includes(data)
    ) {
      role = data as Role;
    }
  }

  authUser.value = {
    id: user.id,
    email: user.email ?? "",
    name: String(user.user_metadata?.full_name ?? user.email ?? "Student"),
    role,
    emailVerified: Boolean(user.email_confirmed_at),
    demo: false,
  };
}

/**
 * INITIALISE AUTHENTICATION
 */
export async function initAuth() {
  if (authReady.value) return;

  if (!isSupabaseMode) {
    authUser.value = readDemoSession();
    authReady.value = true;
    return;
  }

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  await setSupabaseUser(data.session?.user ?? null);

  if (!listening) {
    listening = true;

    supabase.auth.onAuthStateChange((_event, session) => {
      void setSupabaseUser(session?.user ?? null);
    });
  }

  authReady.value = true;
}

/**
 * REGISTER STUDENT
 */
export async function register(
  email: string,
  password: string,
  fullName: string,
) {
  if (!supabase || !isSupabaseMode) {
    return {
      error:
        "Use the demo sign-in button to preview the app. Demo mode does not create real accounts.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = fullName.trim();

  if (!isValidAustEmail(normalizedEmail)) {
    return {
      error: "Registration is restricted to official AUST email addresses.",
    };
  }

  if (!isValidFullName(normalizedName)) {
    return {
      error: "Please enter a valid full name.",
    };
  }

  if (!isValidPassword(password)) {
    return {
      error: "Your password must contain between 12 and 128 characters.",
    };
  }

  const { error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: normalizedName,
      },
      emailRedirectTo: `${window.location.origin}/auth/verify`,
    },
  });

  return {
    error: error
      ? "Could not create the account. Check your details or try again."
      : null,
  };
}

/**
 * SIGN IN
 */
export async function signIn(email: string, password: string) {
  if (!supabase || !isSupabaseMode) {
    return {
      error: "Use the demo sign-in button to preview the app.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidAustEmail(normalizedEmail)) {
    return {
      error: "Please use your official AUST email address.",
    };
  }

  if (!password) {
    return {
      error: "Please enter your password.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.user) {
    await setSupabaseUser(data.user);

    if (!authUser.value) {
      return {
        error: "Your account is not eligible to access the Helpdesk.",
      };
    }

    authReady.value = true;
  }

  return { error: null };
}

/**
 * SEND PASSWORD RESET EMAIL
 */
export async function sendPasswordReset(email: string) {
  if (!supabase || !isSupabaseMode) {
    return {
      error: "Password reset is available after you connect Supabase.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidAustEmail(normalizedEmail)) {
    return {
      error: "Please enter a valid AUST email address.",
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  return {
    error: error
      ? "Could not send the reset email. Check the address and try again."
      : null,
  };
}

/**
 * UPDATE PASSWORD
 */
export async function updatePassword(password: string) {
  if (!supabase) {
    return {
      error: "Password reset is available after you connect Supabase.",
    };
  }

  if (!isValidPassword(password)) {
    return {
      error: "Your password must contain between 12 and 128 characters.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  return {
    error: error?.message ?? null,
  };
}

/**
 * RESEND VERIFICATION EMAIL
 */
export async function resendVerification(email: string) {
  if (!supabase || !isSupabaseMode) {
    return {
      error: "Connect Supabase to send verification emails.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidAustEmail(normalizedEmail)) {
    return {
      error: "Please enter a valid AUST email address.",
    };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
  });

  return {
    error: error
      ? "Could not resend verification. Wait a moment and try again."
      : null,
  };
}

/**
 * DEMO SIGN IN
 */
export function signInDemo(role: "student" | "admin" = "student") {
  if (isSupabaseMode) return;

  const user: HelpdeskUser =
    role === "admin"
      ? {
          id: "demo-admin-fixed",
          email: "demo-admin@example.invalid",
          name: "Demo Admin",
          role: "Super Admin",
          emailVerified: true,
          demo: true,
        }
      : {
          id: "demo-student-fixed",
          email: "demo-student@example.invalid",
          name: "Demo Student",
          role: null,
          emailVerified: true,
          demo: true,
        };

  authUser.value = user;

  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));

  authReady.value = true;
}

/**
 * SIGN OUT
 */
export async function signOut() {
  if (isSupabaseMode && supabase) {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  } else {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }

  authUser.value = null;
}
