import { useMemo, useState } from 'react'
import { BookOpen, Shuffle, ListChecks, ArrowLeft, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CardMatch } from './CardMatch'
import { FillBlank } from './FillBlank'
import { WordBrowser } from './WordBrowser'
import { useGameStore } from '@/store/game.store'
import { getDueWords, getWeakWordIds } from '@/lib/sr'
import { cn } from '@/lib/utils'
import type { VocabItem } from '@/types/content'

type Mode = 'menu' | 'match' | 'fill' | 'browse' | 'result'

interface Props {
  items: VocabItem[]
  theme: string
  xpWeight: number
  week: string
}

interface Result {
  mode: 'match' | 'fill'
  correct: number
  total: number
  mistakes: number
  timeSec: number
  xpEarned: number
  weakIds: string[]
}

type ItemSelector = 'all' | 'due' | 'weak'

export function VocabHub({ items, theme, xpWeight, week }: Props) {
  const [mode, setMode] = useState<Mode>('menu')
  const [selector, setSelector] = useState<ItemSelector>('all')
  const [lastResult, setLastResult] = useState<Result | null>(null)
  const recordSession = useGameStore((s) => s.recordSession)
  const sessions = useGameStore((s) => s.sessions)

  const allIds = useMemo(() => items.map((i) => i.id), [items])
  const { dueIds, newIds, reviewIds } = useMemo(
    () => getDueWords(allIds, sessions),
    [allIds, sessions]
  )
  const weakIds = useMemo(() => getWeakWordIds(sessions, 10), [sessions])

  const selectedItems = useMemo(() => {
    if (selector === 'due') {
      const set = new Set(dueIds)
      return items.filter((i) => set.has(i.id))
    }
    if (selector === 'weak') {
      const set = new Set(weakIds)
      return items.filter((i) => set.has(i.id))
    }
    return items
  }, [items, selector, dueIds, weakIds])

  const handleComplete = async (
    type: 'match' | 'fill',
    r: { correct: number; total: number; mistakes: number; timeSec: number; weakIds: string[] }
  ) => {
    const ratio = r.total === 0 ? 0 : r.correct / r.total
    // 가산점: 짧은 시간 보너스, 실수 페널티 (단, 0 미만으로 가지 않음)
    const baseXp = Math.round(xpWeight * ratio)
    const bonus = Math.max(0, Math.round((20 - r.mistakes * 2) * ratio * 0.3))
    const xpEarned = Math.max(1, baseXp + bonus)

    await recordSession({
      area: 'vocabulary',
      durationSeconds: r.timeSec,
      itemId: type === 'match' ? 'vocab_match' : 'vocab_fill',
      score: ratio,
      xpEarned,
      details: { mode: type, weakIds: r.weakIds, mistakes: r.mistakes },
    })

    setLastResult({ ...r, mode: type, xpEarned })
    setMode('result')
  }

  if (mode === 'match') {
    return (
      <Section
        title="짝 맞추기"
        onBack={() => setMode('menu')}
      >
        <CardMatch items={selectedItems.length > 0 ? selectedItems : items} onComplete={(r) => handleComplete('match', r)} />
      </Section>
    )
  }
  if (mode === 'fill') {
    return (
      <Section
        title="빈칸 채우기"
        onBack={() => setMode('menu')}
      >
        <FillBlank items={selectedItems.length > 0 ? selectedItems : items} onComplete={(r) => handleComplete('fill', r)} />
      </Section>
    )
  }
  if (mode === 'browse') {
    return (
      <Section title="단어 목록" onBack={() => setMode('menu')}>
        <WordBrowser items={selectedItems.length > 0 ? selectedItems : items} week={week} />
      </Section>
    )
  }
  if (mode === 'result' && lastResult) {
    return <ResultScreen result={lastResult} onAgain={() => setMode(lastResult.mode)} onMenu={() => setMode('menu')} />
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold uppercase tracking-wider">
          어휘의 숲
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{theme}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">단어 {items.length}개 · 모드를 선택하세요</p>
      </header>

      {/* SR selector */}
      {(dueIds.length > 0 || weakIds.length > 0) && (
        <Card className="p-3 bg-emerald-50/40 dark:bg-emerald-900/15 border-emerald-200/60 dark:border-emerald-700/40">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Repeat className="h-3.5 w-3.5" />
            오늘의 단어 풀
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <SelectorPill
              active={selector === 'all'}
              onClick={() => setSelector('all')}
              label="전체"
              count={items.length}
            />
            <SelectorPill
              active={selector === 'due'}
              onClick={() => setSelector('due')}
              label="오늘 복습"
              count={dueIds.length}
              disabled={dueIds.length === 0}
              hint={`새 ${newIds.length} · 재학습 ${reviewIds.length}`}
            />
            <SelectorPill
              active={selector === 'weak'}
              onClick={() => setSelector('weak')}
              label="약한 단어"
              count={weakIds.length}
              disabled={weakIds.length === 0}
            />
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          icon={<Shuffle className="h-5 w-5" />}
          title="짝 맞추기"
          subtitle="영어 ↔ 한국어 매칭"
          accent="emerald"
          onClick={() => setMode('match')}
        />
        <ModeCard
          icon={<ListChecks className="h-5 w-5" />}
          title="빈칸 채우기"
          subtitle="문장 속 단어 고르기"
          accent="violet"
          onClick={() => setMode('fill')}
        />
        <ModeCard
          icon={<BookOpen className="h-5 w-5" />}
          title="단어 둘러보기"
          subtitle="뜻 · 예문 · 발음"
          accent="amber"
          onClick={() => setMode('browse')}
          className="sm:col-span-2"
        />
      </div>
    </div>
  )
}

function SelectorPill({
  active,
  onClick,
  label,
  count,
  disabled,
  hint,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  disabled?: boolean
  hint?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl px-2 py-1.5 text-xs font-semibold transition-all border',
        active
          ? 'bg-emerald-500 text-white border-emerald-500'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title={hint}
    >
      <div>{label}</div>
      <div className={cn('text-[10px] mt-0.5 tabular-nums', active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400')}>
        {count}개
      </div>
    </button>
  )
}

function Section({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        모드 선택으로
      </button>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

function ModeCard({
  icon,
  title,
  subtitle,
  accent,
  onClick,
  className,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  accent: 'emerald' | 'violet' | 'amber'
  onClick: () => void
  className?: string
}) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800',
    violet: 'bg-violet-50 border-violet-200 hover:bg-violet-100 text-violet-800',
    amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800',
  }[accent]

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-5 rounded-3xl border text-left transition-all active:scale-[0.98]',
        colors,
        className
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/70 mb-2">
        {icon}
      </div>
      <h3 className="font-bold text-base">{title}</h3>
      <p className="text-xs opacity-80 mt-0.5">{subtitle}</p>
    </button>
  )
}

function ResultScreen({ result, onAgain, onMenu }: { result: Result; onAgain: () => void; onMenu: () => void }) {
  const ratio = result.total === 0 ? 0 : result.correct / result.total
  const star = ratio === 1 ? 3 : ratio >= 0.8 ? 2 : ratio >= 0.6 ? 1 : 0
  const msg =
    star === 3
      ? '완벽해요! 🎉'
      : star === 2
      ? '아주 잘했어요!'
      : star === 1
      ? '괜찮아요, 또 도전해봐요'
      : '다시 한번 가볍게 도전!'

  return (
    <div className="max-w-md mx-auto pt-6 space-y-6">
      <div className="text-center animate-pop">
        <div className="text-6xl mb-2">{star === 3 ? '🏆' : star === 2 ? '⭐' : star === 1 ? '💪' : '🌱'}</div>
        <p className="text-2xl font-bold text-slate-900">{msg}</p>
      </div>

      <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/70 border-amber-200">
        <div className="text-center">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">획득</div>
          <div className="text-3xl font-bold text-amber-700 mt-1">+{result.xpEarned} XP</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <Stat label="정답" value={`${result.correct}/${result.total}`} />
          <Stat label="실수" value={result.mistakes} />
          <Stat label="시간" value={`${result.timeSec}초`} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onMenu}>
          모드 선택
        </Button>
        <Button onClick={onAgain}>한 번 더</Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  )
}
