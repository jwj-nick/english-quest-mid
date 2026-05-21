import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Calendar, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DungeonCard } from '@/components/shared/DungeonCard'
import { DailyMissions } from '@/components/shared/DailyMissions'
import { DUNGEONS } from '@/lib/dungeons'
import { useGameStore, levelInfo, xpByArea as calcXpByArea } from '@/store/game.store'
import { useSessionStore } from '@/store/session.store'
import { levelTitle } from '@/lib/level'

export function HomePage() {
  const profile = useGameStore((s) => s.profile)
  const sessions = useGameStore((s) => s.sessions)
  const lv = useMemo(() => levelInfo(sessions), [sessions])
  const xpByArea = useMemo(() => calcXpByArea(sessions), [sessions])

  const { weekMeta, loading, error, loadWeek, week } = useSessionStore()

  useEffect(() => {
    if (!weekMeta) void loadWeek()
  }, [weekMeta, loadWeek])

  const todaySessions = sessions.filter((s) => s.startedAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
  const todayXp = todaySessions.reduce((sum, s) => sum + s.xpEarned, 0)

  const weekTargets = weekMeta?.targets ?? {}
  const weekXpWeights = weekMeta?.xp_weights ?? {}

  const completionByArea: Record<string, number> = {}
  // V1: count of vocabulary sessions, etc.
  for (const s of sessions) {
    if (s.startedAt.slice(0, 10) >= (weekMeta?.start_date ?? '0000-00-00')) {
      completionByArea[s.area] = (completionByArea[s.area] ?? 0) + 1
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero — Level + this week */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 via-white to-amber-50 border-violet-200/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
              안녕, {profile.name}!
            </p>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {todayXp > 0 ? `오늘 +${todayXp} XP` : '오늘 첫 던전, 가볼까?'}
            </h1>
            {weekMeta && (
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {week} · {weekMeta.theme}
              </p>
            )}
          </div>
          <Link
            to="/profile"
            className="text-5xl select-none hover:scale-110 transition-transform"
            aria-label="캐릭터"
          >
            {profile.avatar}
          </Link>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">
              Lv.{lv.level} · {levelTitle(lv.level)}
            </span>
            <span className="text-slate-500 tabular-nums">
              {lv.intoLevel} / {lv.needForNext} XP
            </span>
          </div>
          <ProgressBar value={lv.intoLevel} max={lv.needForNext} color="violet" />
        </div>
      </Card>

      {/* Daily missions */}
      <DailyMissions />

      {/* Status messages */}
      {loading && <p className="text-center text-sm text-slate-500 py-4">이번 주 던전 불러오는 중...</p>}
      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50">
          <p className="text-sm text-rose-700">콘텐츠를 불러오지 못했어요: {error}</p>
        </Card>
      )}

      {/* Dungeon cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            오늘의 던전
          </h2>
          <Link
            to="/progress"
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
          >
            전체 기록
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DUNGEONS.map((d) => {
            const target = weekTargets[d.key]?.goal_completions ?? 0
            const xpWeight = weekXpWeights[d.key] ?? 0
            void xpWeight
            const completed = completionByArea[d.key] ?? 0
            const xpEarned = xpByArea[d.key] ?? 0
            return (
              <DungeonCard
                key={d.key}
                dungeon={d}
                to={`/dungeon/${d.key}`}
                xpEarned={xpEarned}
                goalCompletions={target}
                completed={completed}
              />
            )
          })}
        </div>
      </section>

      {/* Encouragement */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <p className="text-xs text-slate-600 leading-relaxed">
          💡 <span className="font-semibold text-slate-700">팁:</span> 잘 모르는 단어는 "단어 둘러보기"에서 먼저 한 번 보고, "짝 맞추기"로 가볍게 시작해봐요.
        </p>
      </Card>
    </div>
  )
}
