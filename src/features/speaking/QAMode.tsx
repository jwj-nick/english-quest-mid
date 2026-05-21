import { useEffect, useState } from 'react'
import { Play, Pause, ChevronLeft, ChevronRight, Eye, Check, Mic } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ResultScreen } from '@/components/shared/ResultScreen'
import { cancel, speak } from '@/lib/speech'
import { useGameStore } from '@/store/game.store'

interface QAItem {
  id: string
  question_en: string
  question_ko: string
  expected_keywords: string[]
  sample_answer_en: string
  difficulty: number
  tags: string[]
}

interface Props {
  items: QAItem[]
  xpWeight: number
}

export function QAMode({ items, xpWeight }: Props) {
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [showSample, setShowSample] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const [finished, setFinished] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const recordSession = useGameStore((s) => s.recordSession)

  useEffect(() => () => cancel(), [])

  const current = items[idx]

  const play = (text: string) => {
    if (playing) {
      cancel()
      setPlaying(false)
      return
    }
    setPlaying(true)
    void speak(text, { rate: 0.95, onEnd: () => setPlaying(false), onError: () => setPlaying(false) })
  }

  const markDone = async () => {
    const next = new Set(done)
    next.add(current.id)
    setDone(next)
    setShowSample(false)

    if (idx + 1 < items.length) {
      setIdx((i) => i + 1)
    } else {
      cancel()
      const timeSec = Math.round((Date.now() - startedAt) / 1000)
      const ratio = next.size / items.length
      const earned = Math.max(3, Math.round(xpWeight * ratio + 4))
      await recordSession({
        area: 'speaking_qa',
        itemId: 'qa_session',
        durationSeconds: timeSec,
        score: ratio,
        xpEarned: earned,
        details: { completed: next.size, total: items.length },
      })
      setXpEarned(earned)
      setFinished(true)
    }
  }

  if (finished) {
    return (
      <ResultScreen
        accent="rose"
        xpEarned={xpEarned}
        ratio={done.size / items.length}
        stats={[
          { label: '완료', value: `${done.size}/${items.length}` },
        ]}
        onAgain={() => {
          setIdx(0)
          setDone(new Set())
          setFinished(false)
        }}
        onHome={() => {
          setIdx(0)
          setDone(new Set())
          setFinished(false)
        }}
      />
    )
  }

  if (items.length === 0) {
    return <p className="text-center text-sm text-slate-500 py-8">질문이 없어요.</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
          <span>{idx + 1} / {items.length}</span>
          <span>완료 {done.size}</span>
        </div>
        <ProgressBar value={done.size} max={items.length} color="rose" />
      </div>

      <Card className="p-5 bg-gradient-to-br from-rose-50 to-white border-rose-200">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="rose" className="text-[10px]">
            질문
          </Badge>
          <button
            onClick={() => play(current.question_en)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            듣기
          </button>
        </div>
        <p className="text-base font-semibold text-slate-900 leading-relaxed">
          {current.question_en}
        </p>
        <p className="text-xs text-slate-500 mt-1.5">{current.question_ko}</p>
      </Card>

      <Card className="p-4 bg-amber-50/40 border-amber-200">
        <div className="flex items-start gap-2">
          <Mic className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">생각 → 입으로 말하기</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              머릿속으로 문장을 만들어보고 소리 내어 말해보세요. 그 다음 아래 모범답안을 비교해보세요.
            </p>
          </div>
        </div>
        {current.expected_keywords.length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-1.5">
              포함하면 좋은 단어
            </div>
            <div className="flex flex-wrap gap-1.5">
              {current.expected_keywords.map((k) => (
                <Badge key={k} tone="amber" className="text-[10px]">
                  {k}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Sample */}
      {!showSample ? (
        <Button variant="secondary" onClick={() => setShowSample(true)} className="w-full">
          <Eye className="h-4 w-4" />
          모범답안 보기
        </Button>
      ) : (
        <Card className="p-4 bg-emerald-50/60 border-emerald-200 animate-pop">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 mb-1.5">
            모범답안
          </div>
          <p className="text-sm text-slate-800 leading-relaxed mb-2">
            {current.sample_answer_en}
          </p>
          <button
            onClick={() => play(current.sample_answer_en)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <Play className="h-3 w-3" />
            모범답안 듣기
          </button>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setShowSample(false)
            setIdx((i) => Math.max(0, i - 1))
          }}
          disabled={idx === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </Button>
        <Button variant="success" onClick={() => void markDone()}>
          <Check className="h-4 w-4" />
          완료
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setShowSample(false)
            setIdx((i) => Math.min(items.length - 1, i + 1))
          }}
          disabled={idx === items.length - 1}
        >
          다음
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
