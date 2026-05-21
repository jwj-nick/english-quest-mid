import { useMemo } from 'react'
import {
  useGameStore,
  totalXp as calcTotalXp,
  xpByArea as calcXpByArea,
  streakDays,
  levelInfo,
} from '@/store/game.store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DUNGEONS } from '@/lib/dungeons'
import { levelTitle } from '@/lib/level'

export function ProgressPage() {
  const sessions = useGameStore((s) => s.sessions)
  const lv = useMemo(() => levelInfo(sessions), [sessions])
  const totalXp = useMemo(() => calcTotalXp(sessions), [sessions])
  const xpByArea = useMemo(() => calcXpByArea(sessions), [sessions])
  const streak = useMemo(() => streakDays(sessions), [sessions])

  const last7 = last7DaysXP(sessions)
  const maxDayXp = Math.max(1, ...last7.map((d) => d.xp))

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">기록</h1>
        <p className="text-sm text-slate-600">지금까지의 모험 기록</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="총 XP" value={totalXp} accent="amber" />
        <StatCard label="레벨" value={`Lv.${lv.level}`} sub={levelTitle(lv.level)} accent="violet" />
        <StatCard label="연속 일수" value={`${streak}일`} accent="rose" />
      </div>

      {/* Last 7 days */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-2">최근 7일</h2>
        <Card className="p-4">
          <div className="flex items-end gap-2 h-32">
            {last7.map((d) => {
              const h = (d.xp / maxDayXp) * 100
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-violet-400 to-violet-300 transition-all"
                      style={{ height: `${h}%`, minHeight: d.xp > 0 ? '4px' : '0' }}
                      title={`${d.xp} XP`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums">{d.label}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      {/* By area */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-2">영역별</h2>
        <div className="space-y-2">
          {DUNGEONS.map((d) => {
            const xp = xpByArea[d.key] ?? 0
            return (
              <Card key={d.key} className="p-3.5 flex items-center gap-3">
                <div className="text-2xl">{d.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{d.title}</span>
                    <span className="text-xs text-slate-500 tabular-nums">{xp} XP</span>
                  </div>
                  <ProgressBar
                    value={xp}
                    max={Math.max(50, totalXp)}
                    color="violet"
                    className="mt-1.5"
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Recent sessions */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-2">최근 세션</h2>
        {sessions.length === 0 ? (
          <Card className="p-6 text-center bg-slate-50">
            <p className="text-sm text-slate-500">아직 기록이 없어요. 첫 던전을 클리어해봐요!</p>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {sessions.slice(0, 10).map((s) => {
              const d = DUNGEONS.find((x) => x.key === s.area)
              return (
                <Card key={s.id} className="p-3 flex items-center gap-3">
                  <div className="text-lg">{d?.emoji ?? '🎯'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {d?.title ?? s.area}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(s.startedAt).toLocaleString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {Math.round(s.score * 100)}%
                    </div>
                  </div>
                  <Badge tone="amber">+{s.xpEarned} XP</Badge>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent: 'amber' | 'violet' | 'rose'
}) {
  const bg = {
    amber: 'from-amber-50 to-amber-100 border-amber-200',
    violet: 'from-violet-50 to-violet-100 border-violet-200',
    rose: 'from-rose-50 to-rose-100 border-rose-200',
  }[accent]
  const text = {
    amber: 'text-amber-800',
    violet: 'text-violet-800',
    rose: 'text-rose-800',
  }[accent]
  return (
    <Card className={`p-3.5 bg-gradient-to-br ${bg}`}>
      <div className={`text-[10px] uppercase tracking-wider font-semibold ${text}`}>{label}</div>
      <div className={`text-xl font-bold ${text} mt-0.5 tabular-nums`}>{value}</div>
      {sub && <div className={`text-[10px] ${text} opacity-70`}>{sub}</div>}
    </Card>
  )
}

function last7DaysXP(sessions: { startedAt: string; xpEarned: number }[]): { date: string; label: string; xp: number }[] {
  const today = new Date()
  const days: { date: string; label: string; xp: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    days.push({ date: iso, label, xp: 0 })
  }
  for (const s of sessions) {
    const day = days.find((d) => d.date === s.startedAt.slice(0, 10))
    if (day) day.xp += s.xpEarned
  }
  return days
}
