/**
 * Spaced Repetition — 간격 반복 (어휘 우선)
 *
 * SM-2 lite 알고리즘:
 *   각 단어에 대해 사용자 응답에 따라 다음 review 까지 일 수가 늘어남.
 *   - 처음 보면: 1일 후
 *   - 정답 1회: 3일 후
 *   - 정답 2회: 7일 후
 *   - 정답 3회: 14일 후
 *   - 정답 4회: 30일 후
 *   - 오답 시: 1일로 리셋
 *
 * 어느 단어가 weak 인지 (자주 틀린지) 학습 로그(SessionLog.details.weakIds)에서 추출.
 */

import type { SessionLog } from '@/types/game'

const INTERVALS_DAYS = [1, 3, 7, 14, 30, 60]

interface WordStats {
  itemId: string
  correctStreak: number
  wrongCount: number
  lastSeen: string // ISO date
}

/**
 * 학습 로그에서 단어별 통계 집계.
 * - 어휘 던전 vocabulary 세션의 details.weakIds 를 오답으로 카운트
 * - details.weakIds 에 없으면 정답으로 카운트 (해당 세션에서 본 단어들)
 *
 * 한계: 어떤 세션에서 어떤 단어들을 봤는지 정확한 정보가 없음 (현재 schema).
 * → V1 simplification: weakIds 가 있는 세션의 weakIds 만 "본 단어"로 가정.
 *   더 정확한 SR 은 다음 V (시간 추적이 정밀해진 후).
 */
function aggregateWordStats(sessions: SessionLog[]): Map<string, WordStats> {
  const map = new Map<string, WordStats>()
  const sortedSessions = [...sessions]
    .filter((s) => s.area === 'vocabulary' && s.details?.weakIds)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))

  for (const session of sortedSessions) {
    const weakIds = (session.details?.weakIds as string[]) ?? []
    const date = session.startedAt.slice(0, 10)
    for (const id of weakIds) {
      const cur = map.get(id) ?? { itemId: id, correctStreak: 0, wrongCount: 0, lastSeen: date }
      cur.wrongCount++
      cur.correctStreak = 0
      cur.lastSeen = date
      map.set(id, cur)
    }
  }
  return map
}

/** 오늘 날짜 기준 복습이 필요한 단어 ID 리스트 */
export function getDueWords(
  vocabIds: string[],
  sessions: SessionLog[],
  today: string = new Date().toISOString().slice(0, 10)
): { dueIds: string[]; newIds: string[]; reviewIds: string[] } {
  const stats = aggregateWordStats(sessions)
  const due: string[] = []
  const newOnes: string[] = []
  const review: string[] = []

  for (const id of vocabIds) {
    const stat = stats.get(id)
    if (!stat) {
      // 한 번도 안 본 단어 — 새 단어
      newOnes.push(id)
      due.push(id)
      continue
    }
    // 마지막으로 본 날짜로부터 며칠 지났는지
    const daysSince = daysBetween(stat.lastSeen, today)
    const interval = INTERVALS_DAYS[Math.min(stat.correctStreak, INTERVALS_DAYS.length - 1)]
    if (daysSince >= interval) {
      review.push(id)
      due.push(id)
    }
  }

  return { dueIds: due, newIds: newOnes, reviewIds: review }
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.floor(ms / 86_400_000)
}

/** 약점 단어 ID (오답 횟수 많은 순) */
export function getWeakWordIds(sessions: SessionLog[], top: number = 10): string[] {
  const stats = aggregateWordStats(sessions)
  return Array.from(stats.values())
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, top)
    .map((s) => s.itemId)
}
