import { useEffect, useState } from 'react'
import { Play, Pause, ChevronLeft, ChevronRight, Mic, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ResultScreen } from '@/components/shared/ResultScreen'
import { cancel, speak } from '@/lib/speech'
import { useGameStore } from '@/store/game.store'
import { cn } from '@/lib/utils'

interface ShadowItem {
  id: string
  sentence_en: string
  sentence_ko: string
  phonetics_focus: string[]
  difficulty: number
  tags: string[]
}

interface Props {
  items: ShadowItem[]
  xpWeight: number
}

export function ShadowingMode({ items, xpWeight }: Props) {
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(0.85)
  const [startedAt] = useState(() => Date.now())
  const [finished, setFinished] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const recordSession = useGameStore((s) => s.recordSession)

  useEffect(() => () => cancel(), [])

  const current = items[idx]
  const totalDone = done.size

  const play = (text: string) => {
    if (playing) {
      cancel()
      setPlaying(false)
      return
    }
    setPlaying(true)
    void speak(text, { rate, onEnd: () => setPlaying(false), onError: () => setPlaying(false) })
  }

  const markDone = async () => {
    const next = new Set(done)
    next.add(current.id)
    setDone(next)

    // Auto-advance or finish
    if (idx + 1 < items.length) {
      setIdx((i) => i + 1)
    } else {
      // finish
      cancel()
      const timeSec = Math.round((Date.now() - startedAt) / 1000)
      const ratio = next.size / items.length
      const earned = Math.max(2, Math.round(xpWeight * ratio + 3))
      await recordSession({
        area: 'speaking_shadowing',
        itemId: 'shadow_session',
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
          { label: '시간', value: `${Math.round((Date.now() - startedAt) / 1000)}초` },
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
    return <p className="text-center text-sm text-slate-500 py-8">문장이 없어요.</p>
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
          <span>{idx + 1} / {items.length}</span>
          <span className="tabular-nums">완료 {totalDone}</span>
        </div>
        <ProgressBar value={totalDone} max={items.length} color="rose" />
      </div>

      {/* Sentence card */}
      <Card className="p-5 bg-gradient-to-br from-rose-50 to-white border-rose-200">
        <p className="text-base sm:text-lg font-semibold text-slate-900 leading-[1.7]">
          {current.sentence_en}
        </p>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">{current.sentence_ko}</p>

        {current.phonetics_focus.length > 0 && (
          <div className="mt-4 pt-4 border-t border-rose-100">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-700 mb-1.5">
              발음 포인트
            </div>
            <div className="flex flex-wrap gap-1.5">
              {current.phonetics_focus.map((p) => (
                <Badge key={p} tone="rose" className="text-[10px]">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Player */}
      <Card className="p-4">
        <div className="flex items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => play(current.sentence_en)}
            className={cn(
              'w-16 h-16 rounded-full',
              playing ? 'bg-rose-500 hover:bg-rose-400' : 'bg-rose-400 hover:bg-rose-300'
            )}
            aria-label="듣기"
          >
            {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600">
          <span>속도</span>
          {([0.65, 0.85, 1.0] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className={cn(
                'px-2.5 py-1 rounded-full font-semibold',
                rate === r ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              )}
            >
              {r === 1.0 ? '1.0x' : `${r}x`}
            </button>
          ))}
        </div>

        <div className="mt-3 p-3 bg-rose-50/60 rounded-xl border border-rose-200/60 flex items-start gap-2">
          <Mic className="h-3.5 w-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            소리를 듣고 같은 문장을 따라 말해보세요. 잘 따라했다 싶으면 "완료" 버튼.
          </p>
        </div>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="secondary"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
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
          onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
          disabled={idx === items.length - 1}
        >
          다음
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
