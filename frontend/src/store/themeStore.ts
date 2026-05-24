import { create } from 'zustand'

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const initDark = localStorage.getItem('theme') === 'dark'
applyTheme(initDark)

interface ThemeState {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: initDark,
  toggle: () =>
    set((s) => {
      const next = !s.isDark
      applyTheme(next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return { isDark: next }
    }),
}))
