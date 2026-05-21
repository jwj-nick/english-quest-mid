import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import type { DungeonInfo } from '@/types/game'
import { cn } from '@/lib/utils'

interface Props {
  dungeon: DungeonInfo
  to: string
  xpEarned: number
  goalCompletions: number
  completed: number
}

export function DungeonCard({ dungeon, to, xpEarned, goalCompletions, completed }: Props) {
  const isLocked = !dungeon.enabled
  const progress = goalCompletions === 0 ? 0 : Math.min(100, (completed / goalCompletions) * 100)
  const isDone = goalCompletions > 0 && completed >= goalCompletions

  const Wrapper = isLocked ? 'div' : Link
  const wrapperProps = isLocked ? {} : { to }

  return (
    <Wrapper
      {...(wrapperProps as { to: string })}
      className={cn(
        'group relative rounded-3xl p-5 transition-all',
        'bg-gradient-to-br',
        dungeon.bg,
        'ring-1',
        dungeon.ring,
        isLocked
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/[0.04] active:translate-y-0'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-2xl text-3xl shadow-sm',
            'bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm'
          )}
        >
          {dungeon.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn('font-bold text-base', dungeon.accent)}>{dungeon.title}</h3>
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded-full">
                <Lock className="h-3 w-3" />
                준비 중
              </span>
            )}
            {isDone && !isLocked && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-full">
                ✓ 클리어
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{dungeon.subtitle}</p>

          {!isLocked && goalCompletions > 0 && (
            <div className="mt-3">
              <div className="h-1.5 bg-white/60 dark:bg-slate-700/40 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isDone ? 'bg-emerald-500' : 'bg-slate-700/70 dark:bg-slate-300/70'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
                <span>
                  주간 {completed} / {goalCompletions}
                </span>
                <span className="font-semibold">{xpEarned} XP</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  )
}
