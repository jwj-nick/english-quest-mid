import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Sparkles } from 'lucide-react'
import { useGameStore, totalXp as calcTotalXp, levelInfo, streakDays } from '@/store/game.store'
import { levelTitle } from '@/lib/level'
import { Button } from '@/components/ui/Button'

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const profile = useGameStore((s) => s.profile)
  const sessions = useGameStore((s) => s.sessions)
  const totalXp = useMemo(() => calcTotalXp(sessions), [sessions])
  const lv = useMemo(() => levelInfo(sessions), [sessions])
  const streak = useMemo(() => streakDays(sessions), [sessions])

  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-20 glass border-b border-slate-200/60 dark:border-slate-700/60 safe-top">
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3">
        {!isHome ? (
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} aria-label="뒤로">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          // 데스크탑에선 사이드바가 캐릭터 카드 담당. 모바일에서만 표시.
          <Link to="/profile" className="md:hidden flex items-center gap-2 select-none">
            <span className="text-2xl">{profile.avatar}</span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {profile.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Lv.{lv.level} · {levelTitle(lv.level)}
              </div>
            </div>
          </Link>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="tabular-nums">{totalXp}</span>
            <span className="text-amber-500 dark:text-amber-400 font-normal">XP</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 h-8 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-semibold md:hidden">
            <Flame className="h-3.5 w-3.5" />
            <span className="tabular-nums">{streak}</span>
            <span className="text-rose-500 dark:text-rose-400 font-normal">일</span>
          </div>
        </div>
      </div>
    </header>
  )
}
