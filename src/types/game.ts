import type { AreaKey } from './content'

export interface UserProfile {
  name: string
  avatar: string
  classChoice: 'mage' | 'warrior' | 'archer' | 'scholar'
  themeAccent: 'violet' | 'rose' | 'emerald' | 'amber' | 'sky'
  createdAt: string
}

export interface SessionLog {
  id: string
  startedAt: string
  area: AreaKey
  durationSeconds: number
  itemId: string
  score: number
  xpEarned: number
  details?: Record<string, unknown>
}

export interface DungeonInfo {
  key: AreaKey
  title: string
  subtitle: string
  emoji: string
  accent: string
  bg: string
  ring: string
  enabled: boolean
}
