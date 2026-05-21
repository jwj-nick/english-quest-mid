/**
 * 다크모드 관리 — class 기반 토글 + localStorage 저장.
 * 'system' 모드일 때만 prefers-color-scheme 따라감.
 */

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'eq:theme'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const v = window.localStorage.getItem(STORAGE_KEY)
  if (v === 'light' || v === 'dark' || v === 'system') return v
  return 'system'
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(mode)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    resolved === 'dark' ? '#0f172a' : '#6d28d9'
  )
}

export function setTheme(mode: ThemeMode) {
  window.localStorage.setItem(STORAGE_KEY, mode)
  applyTheme(mode)
}

/** 앱 로딩 직전(가능한 일찍) 호출. FOUC 방지. */
export function initTheme() {
  applyTheme(getStoredTheme())
  // system 모드일 때 OS 설정 변화 따라가기
  if (typeof window !== 'undefined' && getStoredTheme() === 'system') {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (getStoredTheme() === 'system') applyTheme('system')
      })
  }
}
