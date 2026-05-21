import type {
  WeekMeta,
  VocabularyFile,
  ListeningFile,
  ReadingFile,
  BossBattle,
} from '@/types/content'

/**
 * 콘텐츠 로더 — `public/content/{week}/` 의 JSON 파일을 fetch.
 * 빌드 시 base path가 prepend됨 (Vite import.meta.env.BASE_URL).
 */

function contentUrl(week: string, file: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/content/${week}/${file}`
}

/** 콘텐츠 폴더 내 상대 경로(예: "images/vocab_w31_001.webp")를 절대 URL로 변환 */
export function contentAsset(week: string, relative: string | undefined): string | undefined {
  if (!relative) return undefined
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/content/${week}/${relative}`
}

function indexUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/content/index.json`
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Content fetch failed: ${url} (${res.status})`)
  return res.json() as Promise<T>
}

export const content = {
  index: () => fetchJson<ContentIndex>(indexUrl()),
  weekMeta: (week: string) => fetchJson<WeekMeta>(contentUrl(week, 'week-meta.json')),
  vocabulary: (week: string) => fetchJson<VocabularyFile>(contentUrl(week, 'vocabulary.json')),
  listening: (week: string) => fetchJson<ListeningFile>(contentUrl(week, 'listening.json')),
  reading: (week: string) => fetchJson<ReadingFile>(contentUrl(week, 'reading.json')),
  bossBattle: (week: string) => fetchJson<BossBattle>(contentUrl(week, 'boss-battle.json')),
}

export interface ContentIndex {
  generatedAt: string
  currentWeek: string
  weeks: { week: string; theme: string; startDate: string; endDate: string }[]
}

/**
 * Fallback 주차 — index.json 로딩 실패 시.
 * publish-week.py 가 index.json 을 자동 갱신함.
 */
export const FALLBACK_WEEK = '2026-W30'
