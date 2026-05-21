import { create } from 'zustand'
import { storage } from '@/lib/storage'
import type { SessionLog, UserProfile } from '@/types/game'
import type { AreaKey } from '@/types/content'
import { levelFromXp } from '@/lib/level'
import { isoNow, todayKey } from '@/lib/utils'
import { celebrateLevelUp } from '@/lib/celebrate'
import { nanoid } from 'nanoid'

const DEFAULT_PROFILE: UserProfile = {
  name: '모험가',
  avatar: '🧙',
  classChoice: 'mage',
  themeAccent: 'violet',
  createdAt: isoNow(),
}

interface GameState {
  profile: UserProfile
  sessions: SessionLog[]
  loaded: boolean
  load: () => Promise<void>
  setProfile: (patch: Partial<UserProfile>) => Promise<void>
  recordSession: (s: Omit<SessionLog, 'id' | 'startedAt'>) => Promise<SessionLog>
  resetAll: () => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  sessions: [],
  loaded: false,

  load: async () => {
    const [profile, sessions] = await Promise.all([
      storage.getKv<UserProfile>('profile'),
      storage.getAllSessions(),
    ])
    set({
      profile: profile ?? DEFAULT_PROFILE,
      sessions: sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      loaded: true,
    })
  },

  setProfile: async (patch) => {
    const next = { ...get().profile, ...patch }
    await storage.setKv('profile', next)
    set({ profile: next })
  },

  recordSession: async (s) => {
    const prevSessions = get().sessions
    const prevLevel = levelFromXp(prevSessions.reduce((sum, x) => sum + x.xpEarned, 0)).level
    const full: SessionLog = {
      ...s,
      id: nanoid(10),
      startedAt: isoNow(),
    }
    await storage.addSession(full)
    const nextSessions = [full, ...prevSessions]
    set({ sessions: nextSessions })
    const nextLevel = levelFromXp(nextSessions.reduce((sum, x) => sum + x.xpEarned, 0)).level
    if (nextLevel > prevLevel) {
      // 레벨업 — 다음 tick에 confetti (DOM 준비 후)
      setTimeout(() => celebrateLevelUp(), 500)
    }
    return full
  },

  resetAll: async () => {
    await storage.clearAll()
    set({ profile: DEFAULT_PROFILE, sessions: [] })
  },
}))

/**
 * Derived selectors — return primitives or stable references so consumers
 * don't trigger infinite re-renders. Compute via useMemo in components when
 * returning objects.
 */
export function totalXp(sessions: SessionLog[]): number {
  return sessions.reduce((sum, s) => sum + s.xpEarned, 0)
}

export function xpByArea(sessions: SessionLog[]): Record<AreaKey, number> {
  const out: Record<string, number> = {}
  for (const s of sessions) {
    out[s.area] = (out[s.area] ?? 0) + s.xpEarned
  }
  return out as Record<AreaKey, number>
}

export function streakDays(sessions: SessionLog[]): number {
  const dates = new Set(sessions.map((s) => s.startedAt.slice(0, 10)))
  let streak = 0
  let cursor = todayKey()
  while (dates.has(cursor)) {
    streak++
    const d = new Date(cursor)
    d.setDate(d.getDate() - 1)
    cursor = d.toISOString().slice(0, 10)
  }
  return streak
}

export function levelInfo(sessions: SessionLog[]) {
  return levelFromXp(totalXp(sessions))
}
