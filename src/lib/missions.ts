import type { SessionLog } from '@/types/game'
import type { AreaKey } from '@/types/content'

/**
 * 일일 미션 — 매일 자정에 리셋. 3개 슬롯.
 * 미션 완료 조건: 오늘 학습한 세션이 조건을 만족하면 자동 ✓
 */

export type MissionKind = 'area_session' | 'any_session' | 'streak_keep' | 'perfect_score'

export interface DailyMission {
  id: string
  kind: MissionKind
  title: string
  emoji: string
  /** 완료 조건의 영역 (area_session 일 때) */
  area?: AreaKey
  /** 보너스 XP */
  bonusXp: number
}

const TODAY_MISSIONS: DailyMission[] = [
  {
    id: 'daily_vocab',
    kind: 'area_session',
    area: 'vocabulary',
    title: '어휘의 숲 1회',
    emoji: '🌳',
    bonusXp: 10,
  },
  {
    id: 'daily_any',
    kind: 'any_session',
    title: '아무 던전 1회',
    emoji: '✨',
    bonusXp: 5,
  },
  {
    id: 'daily_perfect',
    kind: 'perfect_score',
    title: '100% 정답 1회',
    emoji: '🎯',
    bonusXp: 15,
  },
]

export function getDailyMissions(): DailyMission[] {
  return TODAY_MISSIONS
}

/** 미션이 오늘 완료됐는지 체크 */
export function isMissionComplete(mission: DailyMission, sessions: SessionLog[]): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter((s) => s.startedAt.slice(0, 10) === today)

  switch (mission.kind) {
    case 'area_session':
      return todaySessions.some((s) => s.area === mission.area)
    case 'any_session':
      return todaySessions.length > 0
    case 'perfect_score':
      return todaySessions.some((s) => s.score >= 0.999)
    case 'streak_keep':
      return todaySessions.length > 0
  }
}

export interface DailyMissionsState {
  missions: DailyMission[]
  completed: number
  total: number
  totalBonusXp: number
  earnedBonusXp: number
}

export function computeDailyMissions(sessions: SessionLog[]): DailyMissionsState {
  const missions = getDailyMissions()
  let completed = 0
  let earned = 0
  for (const m of missions) {
    if (isMissionComplete(m, sessions)) {
      completed++
      earned += m.bonusXp
    }
  }
  return {
    missions,
    completed,
    total: missions.length,
    totalBonusXp: missions.reduce((sum, m) => sum + m.bonusXp, 0),
    earnedBonusXp: earned,
  }
}
