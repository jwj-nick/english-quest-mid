import { useEffect, useState } from 'react'
import { content, FALLBACK_WEEK } from '@/lib/content'
import { useSessionStore } from '@/store/session.store'
import type {
  ListeningFile,
  ReadingFile,
} from '@/types/content'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useFetcher<T>(fetcher: () => Promise<T>, deps: unknown[]): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })
  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : 'unknown error',
          })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

function useCurrentWeek(weekOverride?: string): string {
  const sessionWeek = useSessionStore((s) => s.week)
  return weekOverride ?? sessionWeek ?? FALLBACK_WEEK
}

export function useListening(weekOverride?: string): State<ListeningFile> {
  const week = useCurrentWeek(weekOverride)
  return useFetcher(() => content.listening(week), [week])
}

export function useReading(weekOverride?: string): State<ReadingFile> {
  const week = useCurrentWeek(weekOverride)
  return useFetcher(() => content.reading(week), [week])
}

interface WritingFile {
  week: string
  items: {
    id: string
    type: 'topic' | 'image' | 'translation' | 'grammar'
    prompt_ko: string
    prompt_en: string
    target_length_words: [number, number]
    grammar_focus: string[]
    vocabulary_suggestions: string[]
    sample_answer_en: string
    difficulty: number
    tags: string[]
  }[]
}

interface ShadowingFile {
  week: string
  items: {
    id: string
    sentence_en: string
    sentence_ko: string
    audio_normal: string
    audio_slow: string
    phonetics_focus: string[]
    difficulty: number
    tags: string[]
  }[]
}

interface QAFile {
  week: string
  items: {
    id: string
    question_en: string
    question_ko: string
    audio_question: string
    expected_keywords: string[]
    sample_answer_en: string
    difficulty: number
    tags: string[]
  }[]
}

interface RoleplayFile {
  week: string
  items: {
    id: string
    title: string
    scenario_ko: string
    your_role: string
    ai_role: string
    ai_persona: string
    opening_line_en: string
    opening_audio: string
    goal: string
    min_turns: number
    max_turns: number
    vocabulary_hints: string[]
    system_prompt_for_llm: string
    difficulty: number
    tags: string[]
  }[]
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json() as Promise<T>
}

function url(week: string, file: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/content/${week}/${file}`
}

export function useWriting(weekOverride?: string): State<WritingFile> {
  const week = useCurrentWeek(weekOverride)
  return useFetcher(() => fetchJson<WritingFile>(url(week, 'writing.json')), [week])
}
export function useShadowing(weekOverride?: string): State<ShadowingFile> {
  const week = useCurrentWeek(weekOverride)
  return useFetcher(() => fetchJson<ShadowingFile>(url(week, 'speaking-shadowing.json')), [week])
}
export function useQA(weekOverride?: string): State<QAFile> {
  const week = useCurrentWeek(weekOverride)
  return useFetcher(() => fetchJson<QAFile>(url(week, 'speaking-qa.json')), [week])
}
export function useRoleplay(weekOverride?: string): State<RoleplayFile> {
  const week = useCurrentWeek(weekOverride)
  return useFetcher(() => fetchJson<RoleplayFile>(url(week, 'speaking-roleplay.json')), [week])
}
