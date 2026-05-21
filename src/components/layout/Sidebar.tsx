import { useMemo } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  Home,
  Swords,
  BarChart3,
  Settings,
  ExternalLink,
  Flame,
} from 'lucide-react'
import {
  useGameStore,
  levelInfo,
  xpByArea as calcXpByArea,
  streakDays,
} from '@/store/game.store'
import { useSessionStore } from '@/store/session.store'
import { DUNGEONS } from '@/lib/dungeons'
import { levelTitle } from '@/lib/level'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'
import type { AreaKey } from '@/types/content'

export function Sidebar() {
  const profile = useGameStore((s) => s.profile)
  const sessions = useGameStore((s) => s.sessions)
  const lv = useMemo(() => levelInfo(sessions), [sessions])
  const xpByArea = useMemo(() => calcXpByArea(sessions), [sessions])
  const streak = useMemo(() => streakDays(sessions), [sessions])
  const weekMeta = useSessionStore((s) => s.weekMeta)
  const week = useSessionStore((s) => s.week)

  const targets = weekMeta?.targets ?? {}
  const startDate = weekMeta?.start_date ?? '0000-00-00'

  const completionByArea = useMemo(() => {
    const out: Record<string, number> = {}
    for (const s of sessions) {
      if (s.startedAt.slice(0, 10) >= startDate) {
        out[s.area] = (out[s.area] ?? 0) + 1
      }
    }
    return out
  }, [sessions, startDate])

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0',
        'glass border-r border-slate-200/60 dark:border-slate-700/60',
        'safe-top'
      )}
    >
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2">
        <span className="text-xl">🗡️</span>
        <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          English Quest <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 ml-1">Mid</span>
        </span>
      </div>

      {/* Profile mini card */}
      <Link
        to="/profile"
        className={cn(
          'mx-3 mb-3 p-3 rounded-2xl transition-all',
          'bg-gradient-to-br from-violet-50 to-amber-50 dark:from-violet-900/30 dark:to-amber-900/20',
          'hover:shadow-sm hover:scale-[1.01]'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl">{profile.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {profile.name}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Lv.{lv.level} · {levelTitle(lv.level)}
            </div>
          </div>
        </div>
        <ProgressBar
          value={lv.intoLevel}
          max={lv.needForNext}
          color="violet"
          className="mt-2"
        />
        <div className="mt-1.5 flex items-center justify-between text-[10px]">
          <span className="text-slate-500 dark:text-slate-400 tabular-nums">
            {lv.intoLevel}/{lv.needForNext} XP
          </span>
          <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
            <Flame className="h-3 w-3" />
            <span className="tabular-nums">{streak}일</span>
          </span>
        </div>
      </Link>

      {/* Nav groups */}
      <nav className="flex-1 px-2 overflow-y-auto pb-3">
        <Group title="HOME">
          <Item to="/" icon={Home} label="홈" end />
          <Item to="/boss" icon={Swords} label="보스전" disabled />
        </Group>

        <Group title="DUNGEONS">
          {DUNGEONS.map((d) => (
            <DungeonItem
              key={d.key}
              areaKey={d.key}
              to={`/dungeon/${d.key}`}
              emoji={d.emoji}
              title={d.title}
              xp={xpByArea[d.key] ?? 0}
              completed={completionByArea[d.key] ?? 0}
              goal={targets[d.key]?.goal_completions ?? 0}
            />
          ))}
        </Group>

        <Group title="MORE">
          <Item to="/progress" icon={BarChart3} label="기록" />
          <Item to="/profile" icon={Settings} label="설정" />
        </Group>
      </nav>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
        <ThemeToggle compact />
        <a
          href="https://claude.ai/new"
          target="_blank"
          rel="noreferrer noopener"
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs',
            'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors'
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          자유 대화 (Claude)
        </a>
        <div className="px-2 text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
          {week}
        </div>
      </div>
    </aside>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

interface ItemProps {
  to: string
  icon: typeof Home
  label: string
  end?: boolean
  disabled?: boolean
}

function Item({ to, icon: Icon, label, end, disabled }: ItemProps) {
  if (disabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm',
          'text-slate-400 dark:text-slate-600 cursor-not-allowed'
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
        <span className="ml-auto text-[10px] text-slate-400">곧</span>
      </div>
    )
  }
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors',
          isActive
            ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 font-semibold'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  )
}

interface DungeonItemProps {
  areaKey: AreaKey
  to: string
  emoji: string
  title: string
  xp: number
  completed: number
  goal: number
}

function DungeonItem({ to, emoji, title, xp, completed, goal }: DungeonItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors',
          isActive
            ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 font-semibold'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
        )
      }
    >
      <span className="text-base">{emoji}</span>
      <span className="flex-1 truncate">{title}</span>
      {goal > 0 ? (
        <span
          className={cn(
            'text-[10px] font-semibold tabular-nums',
            completed >= goal ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {completed}/{goal}
        </span>
      ) : (
        <span className="text-[10px] text-slate-400 tabular-nums">{xp} XP</span>
      )}
    </NavLink>
  )
}
