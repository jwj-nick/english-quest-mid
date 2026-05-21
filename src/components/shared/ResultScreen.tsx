import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { celebratePerfect } from '@/lib/celebrate'
import { cn } from '@/lib/utils'

interface Stat {
  label: string
  value: string | number
}

interface Props {
  xpEarned: number
  stats: Stat[]
  ratio: number
  accent?: 'amber' | 'violet' | 'emerald' | 'rose' | 'sky'
  onAgain: () => void
  onHome: () => void
  message?: string
}

const ACCENTS = {
  amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700 dark:from-amber-900/30 dark:to-amber-900/10 dark:border-amber-700 dark:text-amber-300',
  violet: 'from-violet-50 to-violet-100 border-violet-200 text-violet-700 dark:from-violet-900/30 dark:to-violet-900/10 dark:border-violet-700 dark:text-violet-300',
  emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700 dark:from-emerald-900/30 dark:to-emerald-900/10 dark:border-emerald-700 dark:text-emerald-300',
  rose: 'from-rose-50 to-rose-100 border-rose-200 text-rose-700 dark:from-rose-900/30 dark:to-rose-900/10 dark:border-rose-700 dark:text-rose-300',
  sky: 'from-sky-50 to-sky-100 border-sky-200 text-sky-700 dark:from-sky-900/30 dark:to-sky-900/10 dark:border-sky-700 dark:text-sky-300',
}

export function ResultScreen({ xpEarned, stats, ratio, accent = 'amber', onAgain, onHome, message }: Props) {
  const star = ratio === 1 ? 3 : ratio >= 0.8 ? 2 : ratio >= 0.6 ? 1 : 0
  const defaultMsg =
    star === 3 ? '완벽해요! 🎉'
    : star === 2 ? '아주 잘했어요!'
    : star === 1 ? '괜찮아요, 또 도전해봐요'
    : '다시 한번 가볍게 도전!'
  const emoji = star === 3 ? '🏆' : star === 2 ? '⭐' : star === 1 ? '💪' : '🌱'

  // star=3 시 confetti
  useEffect(() => {
    if (star === 3) celebratePerfect()
  }, [star])

  return (
    <div className="max-w-md mx-auto pt-6 space-y-6">
      <div className="text-center animate-pop">
        <div className="text-6xl mb-2">{emoji}</div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{message ?? defaultMsg}</p>
      </div>

      <Card className={cn('p-5 bg-gradient-to-br border', ACCENTS[accent])}>
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">획득</div>
          <div className="text-3xl font-bold mt-1">+{xpEarned} XP</div>
        </div>
        {stats.length > 0 && (
          <div
            className="grid gap-3 mt-4 text-center"
            style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
          >
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onHome}>
          목록으로
        </Button>
        <Button onClick={onAgain}>한 번 더</Button>
      </div>
    </div>
  )
}
