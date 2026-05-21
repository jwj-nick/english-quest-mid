import { useEffect, useState } from 'react'
import { ArrowLeft, Headphones } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ListeningPlayer } from './ListeningPlayer'
import { ResultScreen } from '@/components/shared/ResultScreen'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/store/game.store'
import { cancel } from '@/lib/speech'
import type { ListeningItem } from '@/types/content'

interface Props {
  items: ListeningItem[]
  xpWeight: number
}

type View =
  | { kind: 'list' }
  | { kind: 'play'; item: ListeningItem }
  | { kind: 'result'; item: ListeningItem; r: PlayResult }

interface PlayResult {
  correct: number
  total: number
  timeSec: number
  xpEarned: number
}

export function ListeningHub({ items, xpWeight }: Props) {
  const [view, setView] = useState<View>({ kind: 'list' })
  const recordSession = useGameStore((s) => s.recordSession)

  // Cancel any ongoing speech when leaving the page
  useEffect(() => () => cancel(), [])

  const onComplete = async (item: ListeningItem, r: Omit<PlayResult, 'xpEarned'>) => {
    const ratio = r.total === 0 ? 0 : r.correct / r.total
    const xpEarned = Math.max(2, Math.round(xpWeight * ratio + (ratio === 1 ? 5 : 0)))
    await recordSession({
      area: 'listening',
      itemId: item.id,
      durationSeconds: r.timeSec,
      score: ratio,
      xpEarned,
    })
    cancel()
    setView({ kind: 'result', item, r: { ...r, xpEarned } })
  }

  if (view.kind === 'play') {
    return (
      <div className="space-y-5">
        <button
          onClick={() => {
            cancel()
            setView({ kind: 'list' })
          }}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </button>
        <ListeningPlayer item={view.item} onComplete={(r) => void onComplete(view.item, r)} />
      </div>
    )
  }

  if (view.kind === 'result') {
    return (
      <ResultScreen
        accent="sky"
        xpEarned={view.r.xpEarned}
        stats={[
          { label: '정답', value: `${view.r.correct}/${view.r.total}` },
          { label: '시간', value: `${view.r.timeSec}초` },
        ]}
        onAgain={() => setView({ kind: 'play', item: view.item })}
        onHome={() => setView({ kind: 'list' })}
        ratio={view.r.correct / view.r.total}
      />
    )
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs text-sky-600 font-semibold uppercase tracking-wider">
          메아리 동굴
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">듣기</h1>
        <p className="text-sm text-slate-600 mt-1">
          {items.length}개 클립 · 브라우저 내장 TTS 사용 ⓘ
        </p>
      </header>

      <Card className="p-3 bg-slate-50 border-slate-200">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          💡 V1: 브라우저 내장 TTS로 재생합니다. W4에 자연스러운 음성(mp3)으로 업그레이드 예정.
        </p>
      </Card>

      {items.length === 0 ? (
        <Card className="p-6 text-center text-slate-500">
          <p className="text-sm">아직 클립이 없어요.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setView({ kind: 'play', item: it })}
              className={cn(
                'w-full text-left rounded-3xl border bg-white p-4 transition-all',
                'border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 active:scale-[0.99]'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-sky-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <Badge tone="sky" className="text-[10px]">
                      {it.type}
                    </Badge>
                    <Badge tone="slate" className="text-[10px]">
                      ~{it.duration_seconds}초
                    </Badge>
                    <Badge tone="slate" className="text-[10px]">
                      {it.questions.length}문항
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{it.title}</h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
