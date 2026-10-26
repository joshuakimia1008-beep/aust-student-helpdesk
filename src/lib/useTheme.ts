import { onMounted, ref } from 'vue'

export type Theme = 'light' | 'dark'
const KEY = 'aust-admin-theme'

function initial(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
}

const theme = ref<Theme>(initial())

export function useTheme() {
  onMounted(() => apply(theme.value))

  function setTheme(t: Theme) {
    try {
      localStorage.setItem(KEY, t)
    } catch {
      /* ignore */
    }
    theme.value = t
    apply(t)
  }

  return { theme, setTheme, toggle: () => setTheme(theme.value === 'dark' ? 'light' : 'dark') }
}
