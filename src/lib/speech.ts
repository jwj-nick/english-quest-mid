/**
 * Web Speech API 헬퍼 — 브라우저 내장 TTS.
 * W4까지의 V1 사운드 솔루션. Kokoro mp3가 준비되면 mp3 우선, fallback으로 TTS.
 */

let cachedVoices: SpeechSynthesisVoice[] | null = null

/**
 * 세션 토큰 — cancel() 호출 시마다 증가. 진행 중인 dialogue가 자신의 세션이
 * 무효화됐는지 체크해서 중단할 수 있도록 사용.
 */
let currentSession = 0

function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (cachedVoices && cachedVoices.length > 0) return Promise.resolve(cachedVoices)
  return new Promise((resolve) => {
    const tryGet = () => {
      const list = window.speechSynthesis.getVoices()
      if (list.length > 0) {
        cachedVoices = list
        resolve(list)
      }
    }
    tryGet()
    if (!cachedVoices) {
      window.speechSynthesis.onvoiceschanged = () => tryGet()
      setTimeout(() => {
        if (!cachedVoices) {
          cachedVoices = window.speechSynthesis.getVoices()
          resolve(cachedVoices)
        }
      }, 600)
    }
  })
}

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function cancel() {
  currentSession++
  if (!isTTSAvailable()) return
  window.speechSynthesis.cancel()
}

interface SpeakOptions {
  rate?: number
  pitch?: number
  lang?: string
  onEnd?: () => void
  onError?: (e: SpeechSynthesisErrorEvent) => void
}

export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (!isTTSAvailable()) return
  cancel()
  const voices = await getVoices()
  const lang = opts.lang ?? 'en-US'
  const preferred =
    voices.find((v) => v.lang === lang && /natural|google|samantha|alex|enhanced/i.test(v.name)) ??
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(lang.slice(0, 2))) ??
    voices[0]

  const utter = new SpeechSynthesisUtterance(text)
  if (preferred) utter.voice = preferred
  utter.lang = preferred?.lang ?? lang
  utter.rate = opts.rate ?? 0.95
  utter.pitch = opts.pitch ?? 1
  if (opts.onEnd) utter.onend = opts.onEnd
  if (opts.onError) utter.onerror = opts.onError
  window.speechSynthesis.speak(utter)
}

// ─── Dialogue ─────────────────────────────────────────────────────────────

export interface DialogueSegment {
  /** 'M' / 'W' / 'F' / 'A' / 'B' / null. null=화자 미지정(독백) */
  speaker: string | null
  text: string
}

/**
 * Transcript를 화자별 segment로 파싱.
 * 예) "M: Hey... W: I'm trying... M: Does it work?"
 * 화자 라벨이 없으면 전체를 단일 segment로 반환.
 */
export function parseDialogue(transcript: string): DialogueSegment[] {
  const text = transcript.trim()
  if (!text) return []

  // 화자 라벨 패턴: 줄 시작 또는 공백 다음 1-3자 대문자 + 콜론
  // (M:, W:, F:, A:, B:, MOM:, DAD: 등)
  const re = /(?:^|\s)([A-Z]{1,4}):\s/g
  const matches: { speaker: string; start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    // m.index는 (^|\s) 시작점. 실제 라벨 시작은 그 다음.
    const labelStart = m.index + (m[0].length - m[1].length - 2)
    matches.push({
      speaker: m[1],
      start: labelStart,
      end: m.index + m[0].length,
    })
  }

  if (matches.length === 0) {
    return [{ speaker: null, text }]
  }

  // 첫 라벨 이전 텍스트가 있다면 화자 미지정 segment로 추가
  const segments: DialogueSegment[] = []
  if (matches[0].start > 0) {
    const pre = text.slice(0, matches[0].start).trim()
    if (pre) segments.push({ speaker: null, text: pre })
  }
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i]
    const nextStart = i + 1 < matches.length ? matches[i + 1].start : text.length
    const body = text.slice(cur.end, nextStart).trim()
    if (body) segments.push({ speaker: cur.speaker, text: body })
  }
  return segments
}

interface VoicePair {
  male: SpeechSynthesisVoice | null
  female: SpeechSynthesisVoice | null
  fallback: SpeechSynthesisVoice | null
}

function pickVoicePair(voices: SpeechSynthesisVoice[]): VoicePair {
  const en = voices.filter((v) => v.lang.startsWith('en'))
  const enUs = en.filter((v) => v.lang === 'en-US')
  const pool = enUs.length > 0 ? enUs : en

  const femaleNames = /female|samantha|karen|moira|tessa|fiona|victoria|allison|ava|susan|zira|jenny|aria|emma/i
  const maleNames = /male|daniel|alex|fred|aaron|nathan|tom|david|guy|brian|mark/i

  const female =
    pool.find((v) => femaleNames.test(v.name) && !maleNames.test(v.name)) ??
    pool.find((v) => /female/i.test(v.name)) ??
    null
  let male =
    pool.find((v) => maleNames.test(v.name) && !femaleNames.test(v.name)) ??
    pool.find((v) => /male/i.test(v.name) && !/female/i.test(v.name)) ??
    null

  // 둘이 같으면 male을 다른 voice로 바꿔보기
  if (male && female && male.voiceURI === female.voiceURI) {
    male = pool.find((v) => v.voiceURI !== female!.voiceURI) ?? null
  }

  const fallback = pool[0] ?? voices[0] ?? null

  return { male, female, fallback }
}

function classifySpeaker(label: string | null): 'male' | 'female' | 'other' {
  if (!label) return 'other'
  const s = label.toUpperCase()
  if (s === 'M' || s === 'B' || s.startsWith('MAN') || s === 'DAD' || s.startsWith('BOY')) return 'male'
  if (s === 'W' || s === 'F' || s === 'A' || s.startsWith('WOM') || s === 'MOM' || s.startsWith('GIRL')) return 'female'
  return 'other'
}

interface SpeakDialogueOptions {
  rate?: number
  onSegment?: (index: number, segment: DialogueSegment) => void
  onEnd?: () => void
  onError?: (e: SpeechSynthesisErrorEvent) => void
}

export async function speakDialogue(
  segments: DialogueSegment[],
  opts: SpeakDialogueOptions = {}
): Promise<void> {
  if (!isTTSAvailable() || segments.length === 0) {
    opts.onEnd?.()
    return
  }
  cancel()
  const mySession = currentSession
  const voices = await getVoices()
  const pair = pickVoicePair(voices)

  const voiceFor = (speaker: string | null): { voice: SpeechSynthesisVoice | null; pitch: number } => {
    const cls = classifySpeaker(speaker)
    if (cls === 'male') return { voice: pair.male ?? pair.fallback, pitch: 0.82 }
    if (cls === 'female') return { voice: pair.female ?? pair.fallback, pitch: 1.18 }
    return { voice: pair.fallback, pitch: 1.0 }
  }

  const speakOne = (i: number) => {
    if (mySession !== currentSession) return
    if (i >= segments.length) {
      opts.onEnd?.()
      return
    }
    const seg = segments[i]
    const { voice, pitch } = voiceFor(seg.speaker)
    const utter = new SpeechSynthesisUtterance(seg.text)
    if (voice) utter.voice = voice
    utter.lang = voice?.lang ?? 'en-US'
    utter.rate = opts.rate ?? 0.95
    utter.pitch = pitch
    utter.onend = () => speakOne(i + 1)
    utter.onerror = (e) => {
      if (opts.onError) opts.onError(e)
      else opts.onEnd?.()
    }
    opts.onSegment?.(i, seg)
    window.speechSynthesis.speak(utter)
  }

  speakOne(0)
}
