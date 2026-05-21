import { useState } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ReadingPlayer } from './ReadingPlayer'
import { ResultScreen } from '@/components/shared/ResultScreen'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/store/game.store'
import type { ReadingItem } from '@/types/content'

interface Props {
  items: ReadingItem[]
  xpWeight: number
}

type View = { kind: 'list' } | { kind: 'play'; item: ReadingItem } | { kind: 'result'; item: ReadingItem; r: PlayResult }

interface PlayResult {
  correct: number
  total: number
  timeSec: number
  xpEarned: number
}

export function ReadingHub({ items, xpWeight }: Props) {
  const [view, setView] = useState<View>({ kind: 'list' })
  const recordSession = useGameStore((s) => s.recordSession)

  const onComplete = async (item: ReadingItem, r: Omit<PlayResult, 'xpEarned'>) => {
    const ratio = r.total === 0 ? 0 : r.correct / r.total
    const xpEarned = Math.max(2, Math.round(xpWeight * ratio + (ratio === 1 ? 5 : 0)))
    await recordSession({
      area: 'reading',
      itemId: item.id,
      durationSeconds: r.timeSec,
      score: ratio,
      xpEarned,
    })
    setView({ kind: 'result', item, r: { ...r, xpEarned } })
  }

  if (view.kind === 'play') {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setView({ kind: 'list' })}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </button>
        <ReadingPlayer item={view.item} onComplete={(r) => void onComplete(view.item, r)} />
      </div>
    )
  }

  if (view.kind === 'result') {
    return (
      <ResultScreen
        accent="amber"
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
        <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
          책의 도서관
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">독해</h1>
        <p className="text-sm text-slate-600 mt-1">{items.length}개 지문 · 천천히 읽고 추론해봐요</p>
      </header>

      {items.length === 0 ? (
        <Card className="p-6 text-center text-slate-500">
          <p className="text-sm">아직 지문이 없어요.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setView({ kind: 'play', item: it })}
              className={cn(
                'w-full text-left rounded-3xl border bg-white p-4 transition-all',
                'border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 active:scale-[0.99]'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <Badge tone="amber" className="text-[10px]">
                      {it.topic}
                    </Badge>
                    <Badge tone="slate" className="text-[10px]">
                      {it.word_count} words
                    </Badge>
                    <DotDifficulty level={it.difficulty} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{it.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{it.passage_en}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DotDifficulty({ level }: { level: number }) {
  const c = level <= 2 ? 'bg-emerald-400' : level === 3 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn('w-1 h-3 rounded-sm', i < level ? c : 'bg-slate-200')} />
      ))}
    </span>
  )
}
