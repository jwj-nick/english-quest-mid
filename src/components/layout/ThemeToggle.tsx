import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { getStoredTheme, setTheme, type ThemeMode } from '@/lib/theme'
import { cn } from '@/lib/utils'

const MODES: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
  { key: 'light', label: '라이트', icon: Sun },
  { key: 'system', label: '시스템', icon: Monitor },
  { key: 'dark', label: '다크', icon: Moon },
]

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    setMode(getStoredTheme())
  }, [])

  const onPick = (m: ThemeMode) => {
    setMode(m)
    setTheme(m)
  }

  if (compact) {
    // 사이드바 하단용 — 한 줄 3 버튼
    return (
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100/60 dark:bg-slate-800/40">
        {MODES.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onPick(key)}
            title={label}
            aria-label={label}
            className={cn(
              'h-7 rounded-lg flex items-center justify-center transition-colors',
              mode === key
                ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-200 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    )
  }

  // 풀 버전 (Profile 페이지)
  return (
    <div className="grid grid-cols-3 gap-2">
      {MODES.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onPick(key)}
          className={cn(
            'h-12 rounded-2xl border flex items-center justify-center gap-1.5 transition-all',
            mode === key
              ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200 ring-2 ring-violet-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="text-sm font-semibold">{label}</span>
        </button>
      ))}
    </div>
  )
}
