import { useMemo, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { useGameStore, levelInfo } from '@/store/game.store'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BadgeShelf } from '@/components/shared/BadgeShelf'
import { cn } from '@/lib/utils'
import { levelTitle } from '@/lib/level'

const AVATARS = ['🧙', '🦊', '🐯', '🐧', '🦉', '🐉', '🦁', '🐺', '🦄', '🐱', '🐰', '🐻'] as const
const ACCENTS = ['violet', 'rose', 'emerald', 'amber', 'sky'] as const
const CLASSES = [
  { key: 'mage', label: '마법사', emoji: '🔮' },
  { key: 'warrior', label: '전사', emoji: '⚔️' },
  { key: 'archer', label: '궁수', emoji: '🏹' },
  { key: 'scholar', label: '현자', emoji: '📚' },
] as const

const ACCENT_STYLES: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-800 ring-violet-300',
  rose: 'bg-rose-100 text-rose-800 ring-rose-300',
  emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  amber: 'bg-amber-100 text-amber-800 ring-amber-300',
  sky: 'bg-sky-100 text-sky-800 ring-sky-300',
}

export function ProfilePage() {
  const profile = useGameStore((s) => s.profile)
  const sessions = useGameStore((s) => s.sessions)
  const lv = useMemo(() => levelInfo(sessions), [sessions])
  const setProfile = useGameStore((s) => s.setProfile)
  const resetAll = useGameStore((s) => s.resetAll)
  const [name, setName] = useState(profile.name)
  const [resetConfirm, setResetConfirm] = useState(false)

  const onSaveName = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === profile.name) return
    await setProfile({ name: trimmed })
  }

  const onExport = async () => {
    const json = await storage.exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `english-quest-mid-log-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true)
      window.setTimeout(() => setResetConfirm(false), 5000)
      return
    }
    await resetAll()
    setResetConfirm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="text-center pt-2">
        <div className="text-7xl mb-2 animate-pop">{profile.avatar}</div>
        <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Lv.{lv.level} · {levelTitle(lv.level)}
        </p>
      </header>

      {/* Name */}
      <Card className="p-4">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          이름
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            className="flex-1 rounded-xl border border-slate-200 px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="이름을 적어주세요"
          />
          <Button variant="secondary" onClick={onSaveName} disabled={name.trim() === profile.name}>
            저장
          </Button>
        </div>
      </Card>

      {/* Avatar */}
      <Card className="p-4">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          아바타
        </label>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => void setProfile({ avatar: a })}
              className={cn(
                'aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all',
                profile.avatar === a
                  ? 'bg-violet-100 ring-2 ring-violet-400 scale-105'
                  : 'bg-slate-50 hover:bg-slate-100'
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>

      {/* Class */}
      <Card className="p-4">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          직업
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CLASSES.map((c) => (
            <button
              key={c.key}
              onClick={() => void setProfile({ classChoice: c.key })}
              className={cn(
                'rounded-2xl p-3 flex items-center gap-2 transition-all',
                profile.classChoice === c.key
                  ? 'bg-violet-100 ring-2 ring-violet-400'
                  : 'bg-slate-50 hover:bg-slate-100'
              )}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-sm font-semibold text-slate-800">{c.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          직업은 표시용이에요. 곧 직업별 보너스가 추가될 예정 :)
        </p>
      </Card>

      {/* Accent */}
      <Card className="p-4">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          포인트 색
        </label>
        <div className="mt-2 flex gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a}
              onClick={() => void setProfile({ themeAccent: a })}
              className={cn(
                'flex-1 h-12 rounded-2xl text-xs font-semibold ring-1 transition-all',
                ACCENT_STYLES[a],
                profile.themeAccent === a && 'ring-2 scale-105'
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-4">
        <BadgeShelf />
      </Card>

      {/* Theme */}
      <Card className="p-4">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          테마
        </label>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </Card>

      {/* Data */}
      <Card className="p-4">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          데이터
        </label>
        <div className="mt-2 space-y-2">
          <Button variant="secondary" onClick={onExport} className="w-full justify-start">
            <Download className="h-4 w-4" />
            학습 로그 JSON 내보내기
          </Button>
          <Button
            variant={resetConfirm ? 'danger' : 'secondary'}
            onClick={onReset}
            className="w-full justify-start"
          >
            <Trash2 className="h-4 w-4" />
            {resetConfirm ? '한 번 더 누르면 정말 초기화돼요' : '모든 기록 초기화'}
          </Button>
        </div>
      </Card>

      <p className="text-center text-[11px] text-slate-400 pb-4">
        English Quest · 모든 기록은 이 브라우저에만 저장돼요
      </p>
      <div className="text-center">
        <Badge tone="slate">v0.1 · MVP</Badge>
      </div>
    </div>
  )
}
