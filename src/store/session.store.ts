import { create } from 'zustand'
import { content, FALLBACK_WEEK, type ContentIndex } from '@/lib/content'
import type { WeekMeta, VocabularyFile } from '@/types/content'

interface SessionState {
  week: string
  weekMeta: WeekMeta | null
  vocab: VocabularyFile | null
  index: ContentIndex | null
  loading: boolean
  error: string | null
  /** index.json 을 먼저 읽어 현재 주차 자동 결정 후 콘텐츠 로드 */
  loadWeek: (week?: string) => Promise<void>
  /** 다른 주차로 전환 */
  switchWeek: (week: string) => Promise<void>
}

export const useSessionStore = create<SessionState>((set) => ({
  week: FALLBACK_WEEK,
  weekMeta: null,
  vocab: null,
  index: null,
  loading: false,
  error: null,

  loadWeek: async (weekOverride) => {
    set({ loading: true, error: null })
    try {
      let week = weekOverride ?? FALLBACK_WEEK
      let index: ContentIndex | null = null
      // index.json 시도 — 실패하면 fallback
      try {
        index = await content.index()
        if (!weekOverride) week = index.currentWeek
      } catch {
        index = null
      }
      const [meta, vocab] = await Promise.all([content.weekMeta(week), content.vocabulary(week)])
      set({ week, index, weekMeta: meta, vocab, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load week', loading: false })
    }
  },

  switchWeek: async (week) => {
    set({ loading: true, error: null })
    try {
      const [meta, vocab] = await Promise.all([content.weekMeta(week), content.vocabulary(week)])
      set({ week, weekMeta: meta, vocab, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to switch week', loading: false })
    }
  },
}))
