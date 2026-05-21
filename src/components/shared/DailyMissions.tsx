import { useMemo } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useGameStore } from '@/store/game.store'
import { computeDailyMissions, isMissionComplete } from '@/lib/missions'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function DailyMissions() {
  const sessions = useGameStore((s) => s.sessions)
  const state = useMemo(() => computeDailyMissions(sessions), [sessions])
  const allDone = state.completed === state.total

  return (
    <Card
      className={cn(
        'p-4 border',
        allDone
          ? 'bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:to-amber-900/20 border-emerald-200 dark:border-emerald-700/50'
          : 'bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-900/15 dark:to-slate-800/40 border-amber-200/60 dark:border-amber-700/40'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          오늘의 미션
        </h2>
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
          {state.completed}/{state.total}
          {state.earnedBonusXp > 0 && (
            <span className="ml-1.5 text-amber-600 dark:text-amber-400">+{state.earnedBonusXp} XP</span>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        {state.missions.map((m) => {
          const done = isMissionComplete(m, sessions)
          return (
            <div
              key={m.id}
              className={cn(
                'flex items-center gap-2.5 p-2 rounded-xl transition-all',
                done
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-700/60'
                  : 'bg-white/60 dark:bg-slate-800/40'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-xl text-base flex-shrink-0',
                  done
                    ? 'bg-emerald-100 dark:bg-emerald-800/60'
                    : 'bg-slate-100 dark:bg-slate-700/60'
                )}
              >
                {done ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" /> : m.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    'text-sm font-medium',
                    done
                      ? 'text-emerald-700 dark:text-emerald-300 line-through opacity-80'
                      : 'text-slate-800 dark:text-slate-200'
                  )}
                >
                  {m.title}
                </div>
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full',
                  done
                    ? 'bg-emerald-200 dark:bg-emerald-800/60 text-emerald-700 dark:text-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                )}
              >
                +{m.bonusXp}
              </span>
            </div>
          )
        })}
      </div>

      {allDone && (
        <p className="mt-3 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold text-center animate-pop">
          🎉 오늘 미션 모두 완료!
        </p>
      )}
    </Card>
  )
}
