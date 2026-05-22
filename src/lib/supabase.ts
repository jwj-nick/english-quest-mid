/**
 * Supabase client + auth helpers.
 *
 * Q1=C 흐름: 익명 인증으로 시작 → 나중에 magic link 로 이메일 연결 시 user_id 유지.
 *
 * env 미설정 시 → client = null. game.store 가 이를 감지해 IndexedDB-only 모드로 동작.
 *   (예: 로컬 dev .env.local 없을 때, GH Actions Secrets 미설정 시)
 */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 디버그 — env 로드 상태 한눈에 (개발 시에만 보면 됨)
if (typeof window !== 'undefined') {
  console.log(
    `[supabase] init: url=${url ? url.slice(0, 30) + '…' : '(none)'}, key=${anonKey ? 'present' : '(none)'}`
  )
}

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // magic link 콜백
          storageKey: 'eq-auth', // localStorage 키 (앱별 충돌 방지)
        },
      })
    : null

if (typeof window !== 'undefined') {
  console.log(`[supabase] client=${supabase ? 'created' : 'NULL (env missing)'}`)
}

export function isSupabaseEnabled(): boolean {
  return supabase !== null
}

/**
 * 익명 로그인 보장. 기존 세션 있으면 그것 반환.
 * 미설정 시 null 반환 → 호출자가 IndexedDB-only 로 fallback.
 */
export async function ensureAuth(): Promise<User | null> {
  if (!supabase) {
    console.warn('[supabase] ensureAuth: client is null (env missing)')
    return null
  }

  const { data: existing } = await supabase.auth.getSession()
  if (existing.session?.user) {
    console.log('[supabase] reusing existing session:', existing.session.user.id)
    return existing.session.user
  }

  console.log('[supabase] no existing session, signing in anonymously…')
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('[supabase] anonymous sign-in failed:', error.message)
    return null
  }
  console.log('[supabase] signed in anonymously:', data.user?.id)
  return data.user
}

/**
 * 익명 → 이메일 영구 계정 승격 (Magic link).
 * 호출 시점: 사용자가 ProfilePage 에서 이메일 입력했을 때.
 *
 * 흐름:
 *   1. supabase.auth.updateUser({ email })
 *   2. Supabase 가 확인 메일 발송
 *   3. 사용자가 메일의 링크 클릭 → 영구 계정으로 승격, user_id 그대로 유지
 */
export async function linkEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' }
  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Magic link 발송 (이미 가입된 사용자가 다른 기기에서 로그인할 때).
 */
export async function sendMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
