import type { SessionLog } from '@/types/game'
import type { AreaKey } from '@/types/content'
import { streakDays } from '@/store/game.store'

/**
 * 배지 시스템 V1 — 5-7개 배지.
 * 모든 배지는 sessions 에서 파생 계산 (별도 저장 X).
 * 추후 확장: 12종 카탈로그 (ideas/04 참조).
 */

export interface Badge {
  id: string
  title: string
  description: string
  emoji: string
  /** common | rare | epic */
  rarity: 'common' | 'rare' | 'epic'
  /** sessions 받아서 획득 여부 + 진행도(0-1) 반환 */
  check: (sessions: SessionLog[]) => { earned: boolean; progress: number }
}

function countByArea(sessions: SessionLog[], area: AreaKey): number {
  return sessions.filter((s) => s.area === area).length
}

function perfectCount(sessions: SessionLog[]): number {
  return sessions.filter((s) => s.score >= 0.999).length
}

export const BADGES: Badge[] = [
  {
    id: 'first_step',
    title: '첫 발걸음',
    description: '첫 던전을 클리어했어요',
    emoji: '🌱',
    rarity: 'common',
    check: (s) => {
      const c = s.length
      return { earned: c >= 1, progress: Math.min(1, c / 1) }
    },
  },
  {
    id: 'week_warrior',
    title: '일주일 모험가',
    description: '7일 연속 학습',
    emoji: '🔥',
    rarity: 'common',
    check: (s) => {
      const d = streakDays(s)
      return { earned: d >= 7, progress: Math.min(1, d / 7) }
    },
  },
  {
    id: 'month_legend',
    title: '한달 모험가',
    description: '30일 연속 학습',
    emoji: '🏔️',
    rarity: 'rare',
    check: (s) => {
      const d = streakDays(s)
      return { earned: d >= 30, progress: Math.min(1, d / 30) }
    },
  },
  {
    id: 'vocab_master',
    title: '어휘 마스터',
    description: '어휘의 숲 50회 클리어',
    emoji: '📚',
    rarity: 'common',
    check: (s) => {
      const c = countByArea(s, 'vocabulary')
      return { earned: c >= 50, progress: Math.min(1, c / 50) }
    },
  },
  {
    id: 'perfect_sniper',
    title: '정확한 사수',
    description: '100% 정답 5회',
    emoji: '🎯',
    rarity: 'rare',
    check: (s) => {
      const c = perfectCount(s)
      return { earned: c >= 5, progress: Math.min(1, c / 5) }
    },
  },
  {
    id: 'all_areas',
    title: '만능 모험가',
    description: '5개 던전 각 1회 이상',
    emoji: '🌟',
    rarity: 'rare',
    check: (s) => {
      const areas = new Set(s.map((x) => x.area))
      // speaking 은 3 sub area 중 하나라도 1회 → speaking 1로 카운트
      const speakingDone =
        areas.has('speaking_qa') ||
        areas.has('speaking_shadowing') ||
        areas.has('speaking_roleplay')
      const baseAreas = ['vocabulary', 'listening', 'reading', 'writing'] as const
      const done = baseAreas.filter((a) => areas.has(a)).length + (speakingDone ? 1 : 0)
      return { earned: done >= 5, progress: Math.min(1, done / 5) }
    },
  },
  {
    id: 'lv_ten',
    title: '베테랑',
    description: 'Lv.10 도달',
    emoji: '👑',
    rarity: 'epic',
    check: (s) => {
      const totalXp = s.reduce((sum, x) => sum + x.xpEarned, 0)
      // Lv 10 reached when totalXp >= xpForLevel(10) — inline calc to avoid circular import
      // base 80 + step 30: Lv2=80, 3=190, 4=330, 5=500, 6=700, 7=930, 8=1190, 9=1480, 10=1800
      const xpForLv10 = 1800
      return { earned: totalXp >= xpForLv10, progress: Math.min(1, totalXp / xpForLv10) }
    },
  },
]

export interface BadgeStatus {
  badge: Badge
  earned: boolean
  progress: number
}

export function computeAllBadges(sessions: SessionLog[]): BadgeStatus[] {
  return BADGES.map((badge) => {
    const { earned, progress } = badge.check(sessions)
    return { badge, earned, progress }
  })
}
