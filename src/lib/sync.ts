/**
 * IndexedDB ⇄ Supabase 동기화.
 *
 * 설계:
 *   - IndexedDB 는 캐시(빠른 로컬 + 오프라인 백업)
 *   - Supabase 는 truth (다기기 sync, 영구 보존)
 *   - recordSession 시: IndexedDB 즉시 + Supabase 백그라운드 upsert (실패해도 큐잉)
 *   - load() 시: Supabase 우선 → 실패 시 IndexedDB fallback
 *   - 첫 로드: IndexedDB 의 V1 데이터를 Supabase 로 일괄 마이그레이션 (idempotent)
 */

import { supabase, ensureAuth, isSupabaseEnabled } from './supabase'
import { storage } from './storage'
import type { SessionLog, UserProfile } from '@/types/game'

// SessionLog row 1개를 Supabase 의 sessions 테이블 형태로 변환
function sessionToRow(s: SessionLog, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    started_at: s.startedAt,
    area: s.area,
    item_id: s.itemId,
    duration_seconds: s.durationSeconds,
    score: s.score,
    xp_earned: s.xpEarned,
    details: s.details ?? null,
  }
}

// Supabase row → SessionLog
function rowToSession(r: Record<string, unknown>): SessionLog {
  return {
    id: r.id as string,
    startedAt: r.started_at as string,
    area: r.area as SessionLog['area'],
    itemId: r.item_id as string,
    durationSeconds: r.duration_seconds as number,
    score: r.score as number,
    xpEarned: r.xp_earned as number,
    details: (r.details as Record<string, unknown> | null) ?? undefined,
  }
}

function profileToRow(p: UserProfile, userId: string) {
  return {
    user_id: userId,
    name: p.name,
    avatar: p.avatar,
    class_choice: p.classChoice,
    theme_accent: p.themeAccent,
    created_at: p.createdAt,
  }
}

function rowToProfile(r: Record<string, unknown>): UserProfile {
  return {
    name: r.name as string,
    avatar: r.avatar as string,
    classChoice: r.class_choice as UserProfile['classChoice'],
    themeAccent: r.theme_accent as UserProfile['themeAccent'],
    createdAt: (r.created_at as string) ?? new Date().toISOString(),
  }
}

/**
 * 한 세션을 Supabase 에 upsert. 실패해도 throw 안 함 (IndexedDB 는 이미 저장됨).
 */
export async function syncSessionUp(s: SessionLog): Promise<void> {
  if (!isSupabaseEnabled()) return
  const user = await ensureAuth()
  if (!user) return

  const { error } = await supabase!.from('sessions').upsert(sessionToRow(s, user.id))
  if (error) console.warn('[sync] session upsert failed:', error.message)
}

/**
 * 프로필 upsert.
 */
export async function syncProfileUp(p: UserProfile): Promise<void> {
  if (!isSupabaseEnabled()) return
  const user = await ensureAuth()
  if (!user) return

  const { error } = await supabase!.from('profiles').upsert(profileToRow(p, user.id))
  if (error) console.warn('[sync] profile upsert failed:', error.message)
}

/**
 * 첫 로드 또는 외부 기기 변경 시 호출.
 * Supabase 우선, 실패 시 IndexedDB.
 *
 * 추가로 — V1 시절 IndexedDB 에만 있던 데이터(아직 Supabase 에 없는 id) 를 push.
 */
export async function loadAndMigrate(): Promise<{
  sessions: SessionLog[]
  profile: UserProfile | null
}> {
  const localSessions = await storage.getAllSessions()
  const localProfile = await storage.getKv<UserProfile>('profile')

  if (!isSupabaseEnabled()) {
    return { sessions: localSessions, profile: localProfile ?? null }
  }

  const user = await ensureAuth()
  if (!user) {
    return { sessions: localSessions, profile: localProfile ?? null }
  }

  // 1) Supabase 에서 가져오기
  const { data: remoteSessions, error: e1 } = await supabase!
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false })

  const { data: remoteProfileRow, error: e2 } = await supabase!
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (e1) console.warn('[sync] load sessions failed:', e1.message)
  if (e2) console.warn('[sync] load profile failed:', e2.message)

  const remote = (remoteSessions ?? []).map(rowToSession)

  // 2) V1 마이그레이션 — 로컬에만 있는 세션을 Supabase 로 push
  const remoteIds = new Set(remote.map((r) => r.id))
  const orphanLocal = localSessions.filter((s) => !remoteIds.has(s.id))
  if (orphanLocal.length > 0) {
    const rows = orphanLocal.map((s) => sessionToRow(s, user.id))
    const { error: e3 } = await supabase!.from('sessions').upsert(rows)
    if (e3) console.warn('[sync] backfill orphan sessions failed:', e3.message)
    else console.log(`[sync] backfilled ${orphanLocal.length} local sessions to Supabase`)
  }

  // 3) Supabase 에만 있는 세션을 IndexedDB 에도 캐시 (다기기 sync)
  const localIds = new Set(localSessions.map((s) => s.id))
  const orphanRemote = remote.filter((r) => !localIds.has(r.id))
  for (const s of orphanRemote) {
    try {
      await storage.addSession(s)
    } catch {
      // duplicate or race — ignore
    }
  }

  // 4) profile 우선순위: remote > local. local 만 있으면 push.
  let profile = localProfile ?? null
  if (remoteProfileRow) {
    profile = rowToProfile(remoteProfileRow)
    if (localProfile) await storage.setKv('profile', profile)
  } else if (localProfile) {
    await syncProfileUp(localProfile)
  }

  // 5) 최종 세션 = remote + orphanLocal (방금 push 됨)
  const merged = [...remote, ...orphanLocal].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt)
  )

  return { sessions: merged, profile }
}
