/**
 * XP → Level 매핑. 부드러운 곡선:
 *   Lv1→Lv2: 80 XP, 이후 단계마다 +30 (Lv2→3: 110, Lv3→4: 140, ...)
 * 친화적 보상 곡선 — 초반 빠른 레벨업으로 동기부여
 */

const BASE = 80
const STEP = 30

export function xpForLevel(lv: number): number {
  if (lv <= 1) return 0
  let total = 0
  for (let i = 2; i <= lv; i++) {
    total += BASE + (i - 2) * STEP
  }
  return total
}

export function levelFromXp(xp: number): { level: number; intoLevel: number; needForNext: number } {
  let lv = 1
  let acc = 0
  while (acc + (BASE + (lv - 1) * STEP) <= xp) {
    acc += BASE + (lv - 1) * STEP
    lv++
  }
  const needForNext = BASE + (lv - 1) * STEP
  return { level: lv, intoLevel: xp - acc, needForNext }
}

export function levelTitle(lv: number): string {
  if (lv >= 30) return '전설'
  if (lv >= 20) return '대마법사'
  if (lv >= 15) return '현자'
  if (lv >= 10) return '베테랑'
  if (lv >= 5) return '도전자'
  return '신참 모험가'
}
