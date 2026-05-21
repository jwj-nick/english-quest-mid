import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, RotateCcw, Eye, EyeOff, ArrowRight, Check, X, Languages } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { cancel, speakDialogue, parseDialogue, isTTSAvailable } from '@/lib/speech'
import type { DialogueSegment } from '@/lib/speech'
import { cn } from '@/lib/utils'
import type { ListeningItem, ListeningQuestion } from '@/types/content'

interface Props {
  item: ListeningItem
  onComplete: (r: { correct: number; total: number; timeSec: number }) => void
}

export function ListeningPlayer({ item, onComplete }: Props) {
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(0.95)
  const [phase, setPhase] = useState<'listening' | 'quiz'>('listening')
  const [showTranscript, setShowTranscript] = useState(false)
  const [showKo, setShowKo] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [fillInput, setFillInput] = useState('')
  const [startedAt] = useState(() => Date.now())
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number | null>(null)

  const segments = useMemo(() => parseDialogue(item.transcript_en), [item.transcript_en])
  const isDialogue = segments.some((s) => s.speaker !== null)

  useEffect(() => () => cancel(), [])

  const handlePlay = () => {
    if (playing) {
      cancel()
      setPlaying(false)
      setActiveSegmentIdx(null)
      return
    }
    setPlaying(true)
    void speakDialogue(segments, {
      rate,
      onSegment: (i) => setActiveSegmentIdx(i),
      onEnd: () => {
        setPlaying(false)
        setActiveSegmentIdx(null)
      },
      onError: () => {
        setPlaying(false)
        setActiveSegmentIdx(null)
      },
    })
  }

  const q = item.questions[qIdx]

  const checkAnswer = (i: number | null, input: string): boolean => {
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      return i === q.correct_index
    }
    if (q.type === 'fill_blank') {
      const ans = (q.answer ?? '').trim().toLowerCase()
      const alts = (q.alternatives ?? []).map((a) => a.toLowerCase())
      const user = input.trim().toLowerCase()
      return user === ans || alts.includes(user)
    }
    return false
  }

  const onPick = (i: number) => {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    if (checkAnswer(i, '')) setCorrect((c) => c + 1)
  }

  const onSubmitFill = () => {
    if (revealed) return
    setRevealed(true)
    if (checkAnswer(null, fillInput)) setCorrect((c) => c + 1)
  }

  const onNext = () => {
    if (qIdx + 1 >= item.questions.length) {
      const timeSec = Math.round((Date.now() - startedAt) / 1000)
      cancel()
      onComplete({ correct, total: item.questions.length, timeSec })
      return
    }
    setQIdx((i) => i + 1)
    setSelected(null)
    setRevealed(false)
    setFillInput('')
  }

  if (phase === 'listening') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>

        {/* Player */}
        <Card className="p-5 bg-gradient-to-br from-sky-50 to-white">
          {!isTTSAvailable() && (
            <p className="text-xs text-rose-600 mb-2">
              이 브라우저는 음성 합성을 지원하지 않아요. 대본을 직접 읽어주세요.
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={handlePlay}
              className={cn(
                'w-20 h-20 rounded-full',
                playing ? 'bg-rose-500 hover:bg-rose-400' : 'bg-sky-500 hover:bg-sky-400'
              )}
            >
              {playing ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
          </div>

          {/* Now speaking indicator */}
          {playing && isDialogue && activeSegmentIdx !== null && (
            <div className="mt-3 flex items-center justify-center gap-2 animate-pop">
              <SpeakerBadge speaker={segments[activeSegmentIdx]?.speaker ?? null} />
              <span className="text-[11px] text-slate-500">말하는 중...</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
            <span>속도</span>
            {([0.7, 0.85, 1.0] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRate(r)}
                className={cn(
                  'px-2.5 py-1 rounded-full font-semibold',
                  rate === r ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                )}
              >
                {r === 1.0 ? '1.0x' : `${r}x`}
              </button>
            ))}
          </div>

          {isDialogue && (
            <div className="mt-3 text-center text-[11px] text-slate-500">
              👥 {segments.filter((s) => s.speaker).length}개 대사 · 화자별로 다른 목소리
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={showTranscript ? 'primary' : 'secondary'}
            onClick={() => setShowTranscript((v) => !v)}
            size="sm"
          >
            {showTranscript ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            대본
          </Button>
          <Button
            variant={showKo ? 'primary' : 'secondary'}
            onClick={() => setShowKo((v) => !v)}
            size="sm"
            disabled={!showTranscript}
          >
            <Languages className="h-3.5 w-3.5" />
            번역
          </Button>
        </div>

        {showTranscript && (
          <Card className="p-4 bg-white">
            {isDialogue ? (
              <div className="space-y-2.5">
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2 rounded-xl px-2 py-1.5 transition-colors',
                      activeSegmentIdx === i && 'bg-sky-50 ring-1 ring-sky-200'
                    )}
                  >
                    <SpeakerBadge speaker={seg.speaker} compact />
                    <p className="text-sm text-slate-800 leading-[1.7] flex-1">{seg.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-800 leading-[1.85] whitespace-pre-wrap">
                {item.transcript_en}
              </p>
            )}
            {showKo && (
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-relaxed whitespace-pre-wrap">
                {item.transcript_ko}
              </p>
            )}
          </Card>
        )}

        <Button onClick={() => setPhase('quiz')} className="w-full" size="lg">
          문제 풀기 ({item.questions.length}문항)
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Quiz phase
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between text-sm text-slate-600 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Badge tone="sky" className="text-[10px]">
              {q.type}
            </Badge>
          </span>
          <span className="tabular-nums">
            {qIdx + 1} / {item.questions.length}
          </span>
        </div>
        <ProgressBar value={qIdx + (revealed ? 1 : 0)} max={item.questions.length} color="sky" />
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={handlePlay}>
          <RotateCcw className="h-3.5 w-3.5" />
          다시 듣기
        </Button>
      </div>

      <Card className="p-5 bg-white">
        <p className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap">
          {q.question_ko}
        </p>
      </Card>

      <QuizBody
        q={q}
        revealed={revealed}
        selected={selected}
        onPick={onPick}
        fillInput={fillInput}
        setFillInput={setFillInput}
        onSubmitFill={onSubmitFill}
      />

      {revealed && (
        <div className="animate-pop space-y-3">
          <Card className="p-4 bg-sky-50/60 border-sky-200">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-sky-700 mb-1">
              해설
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{q.explanation_ko}</p>
          </Card>
          <Button onClick={onNext} className="w-full" size="lg">
            {qIdx + 1 >= item.questions.length ? '결과 보기' : '다음 문제'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function SpeakerBadge({ speaker, compact }: { speaker: string | null; compact?: boolean }) {
  const cls = classifySpeaker(speaker)
  const emoji = cls === 'male' ? '🧑' : cls === 'female' ? '👩' : '🗣️'
  const tone = cls === 'male' ? 'bg-sky-100 text-sky-700' : cls === 'female' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
  const label = speaker ?? '—'

  if (compact) {
    return (
      <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-sm flex-shrink-0', tone)}>
        {emoji}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', tone)}>
      <span className="text-sm">{emoji}</span>
      {label}
    </span>
  )
}

function classifySpeaker(label: string | null): 'male' | 'female' | 'other' {
  if (!label) return 'other'
  const s = label.toUpperCase()
  if (s === 'M' || s === 'B' || s.startsWith('MAN') || s === 'DAD' || s.startsWith('BOY')) return 'male'
  if (s === 'W' || s === 'F' || s === 'A' || s.startsWith('WOM') || s === 'MOM' || s.startsWith('GIRL')) return 'female'
  return 'other'
}

function QuizBody({
  q,
  revealed,
  selected,
  onPick,
  fillInput,
  setFillInput,
  onSubmitFill,
}: {
  q: ListeningQuestion
  revealed: boolean
  selected: number | null
  onPick: (i: number) => void
  fillInput: string
  setFillInput: (v: string) => void
  onSubmitFill: () => void
}) {
  if (q.type === 'fill_blank') {
    const isCorrect = revealed && fillInput.trim().toLowerCase() === (q.answer ?? '').toLowerCase()
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={fillInput}
          onChange={(e) => setFillInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !revealed && onSubmitFill()}
          disabled={revealed}
          placeholder="답을 영어로 입력"
          className={cn(
            'w-full h-12 rounded-2xl border px-4 text-base font-medium focus:outline-none focus:ring-2',
            revealed && isCorrect && 'border-emerald-300 bg-emerald-50 text-emerald-700',
            revealed && !isCorrect && 'border-rose-300 bg-rose-50 text-rose-700 animate-shake',
            !revealed && 'border-slate-200 focus:ring-sky-300'
          )}
        />
        {!revealed && (
          <Button onClick={onSubmitFill} className="w-full" disabled={!fillInput.trim()}>
            확인
          </Button>
        )}
        {revealed && (
          <Card className="p-3 bg-emerald-50/40 border-emerald-200">
            <div className="text-xs text-slate-500">정답</div>
            <div className="text-base font-bold text-emerald-700">{q.answer}</div>
          </Card>
        )}
      </div>
    )
  }

  if (q.options && q.options.length > 0) {
    return (
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === q.correct_index
          return (
            <button
              key={i}
              onClick={() => onPick(i)}
              disabled={revealed}
              className={cn(
                'w-full text-left rounded-2xl border p-3.5 text-sm font-medium transition-all',
                'flex items-start gap-3',
                !revealed && 'bg-white border-slate-200 hover:bg-slate-50 active:scale-[0.99]',
                revealed && isCorrect && 'bg-emerald-50 border-emerald-300 text-emerald-700',
                revealed && isSelected && !isCorrect && 'bg-rose-50 border-rose-300 text-rose-700 animate-shake',
                revealed && !isSelected && !isCorrect && 'bg-white border-slate-200 text-slate-400'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0',
                  revealed && isCorrect && 'bg-emerald-200 text-emerald-700',
                  revealed && isSelected && !isCorrect && 'bg-rose-200 text-rose-700',
                  !revealed && 'bg-slate-100 text-slate-600'
                )}
              >
                {revealed && isCorrect ? (
                  <Check className="h-3.5 w-3.5" />
                ) : revealed && isSelected ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return <p className="text-sm text-slate-500">지원하지 않는 문제 유형이에요.</p>
}
