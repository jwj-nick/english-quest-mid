import type { DungeonInfo } from '@/types/game'

/**
 * 5개 영역 = 5개 던전. 모두 V1 동작.
 * 색 클래스는 light + dark 둘 다 포함 (Tailwind dark variant).
 */
export const DUNGEONS: readonly DungeonInfo[] = [
  {
    key: 'vocabulary',
    title: '어휘의 숲',
    subtitle: '카드 매칭 · 빈칸',
    emoji: '🌳',
    accent: 'text-emerald-700 dark:text-emerald-300',
    bg: 'from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/10',
    ring: 'ring-emerald-200 dark:ring-emerald-700/60',
    enabled: true,
  },
  {
    key: 'listening',
    title: '메아리 동굴',
    subtitle: '받아쓰기 · 듣기',
    emoji: '🎧',
    accent: 'text-sky-700 dark:text-sky-300',
    bg: 'from-sky-100 to-sky-50 dark:from-sky-900/40 dark:to-sky-900/10',
    ring: 'ring-sky-200 dark:ring-sky-700/60',
    enabled: true,
  },
  {
    key: 'reading',
    title: '책의 도서관',
    subtitle: '지문 · 빈칸 · 추론',
    emoji: '📖',
    accent: 'text-amber-700 dark:text-amber-300',
    bg: 'from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10',
    ring: 'ring-amber-200 dark:ring-amber-700/60',
    enabled: true,
  },
  {
    key: 'speaking_qa',
    title: '말의 무대',
    subtitle: '따라 읽기 · Q&A · 상황극',
    emoji: '🎤',
    accent: 'text-rose-700 dark:text-rose-300',
    bg: 'from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-900/10',
    ring: 'ring-rose-200 dark:ring-rose-700/60',
    enabled: true,
  },
  {
    key: 'writing',
    title: '글의 탑',
    subtitle: '영작 · 모범답안 비교',
    emoji: '✍️',
    accent: 'text-violet-700 dark:text-violet-300',
    bg: 'from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-900/10',
    ring: 'ring-violet-200 dark:ring-violet-700/60',
    enabled: true,
  },
] as const
