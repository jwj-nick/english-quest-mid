import { useMemo } from 'react'
import { Lock } from 'lucide-react'
import { useGameStore } from '@/store/game.store'
import { computeAllBadges } from '@/lib/badges'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

const RARITY_STYLES: Record<string, string> = {
  common: 'bg-slate-100 dark:bg-slate-700/60 ring-slate-200 dark:ring-slate-600',
  rare: 'bg-sky-100 dark:bg-sky-900/40 ring-sky-300 dark:ring-sky-700',
  epic: 'bg-violet-100 dark:bg-violet-900/40 ring-violet-300 dark:ring-violet-700',
}

const RARITY_LABEL: Record<string, string> = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
}

export function BadgeShelf() {
  const sessions = useGameStore((s) => s.sessions)
  const all = useMemo(() => computeAllBadges(sessions), [sessions])
  const earned = all.filter((b) => b.earned).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          배지 진열대
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {earned} / {all.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {all.map(({ badge, earned, progress }) => (
          <Card
            key={badge.id}
            className={cn(
              'p-3 text-center transition-all relative',
              earned
                ? cn('ring-2', RARITY_STYLES[badge.rarity], 'animate-pop')
                : 'opacity-60 bg-slate-50 dark:bg-slate-800/40'
            )}
            title={`${badge.title} — ${badge.description}`}
          >
            <div className="text-3xl mb-1 relative">
              {earned ? (
                badge.emoji
              ) : (
                <div className="opacity-40">
                  {badge.emoji}
                  <Lock className="absolute inset-0 m-auto h-4 w-4 text-slate-400" />
                </div>
              )}
            </div>
            <div
              className={cn(
                'text-[11px] font-semibold leading-tight',
                earned ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-500'
              )}
            >
              {badge.title}
            </div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
              {RARITY_LABEL[badge.rarity]}
            </div>

            {!earned && progress > 0 && (
              <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 dark:bg-slate-500 transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
