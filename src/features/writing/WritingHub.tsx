import { useState } from 'react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { WritingPlayer } from './WritingPlayer'
import { ResultScreen } from '@/components/shared/ResultScreen'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/store/game.store'

interface WritingItem {
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
}

interface Props {
  items: WritingItem[]
  xpWeight: number
}

interface PlayResult {
  wordCount: number
  inTarget: boolean
  selfRating: number // 1-5
  timeSec: number
  xpEarned: number
}

type View = { kind: 'list' } | { kind: 'play'; item: WritingItem } | { kind: 'result'; item: WritingItem; r: PlayResult }

const TYPE_BADGE = {
  topic: { tone: 'violet' as const, label: '주제' },
  image: { tone: 'sky' as const, label: '그림' },
  translation: { tone: 'amber' as const, label: '번역' },
  grammar: { tone: 'rose' as const, label: '어법' },
}

export function WritingHub({ items, xpWeight }: Props) {
  const [view, setView] = useState<View>({ kind: 'list' })
  const recordSession = useGameStore((s) => s.recordSession)

  const onComplete = async (item: WritingItem, r: Omit<PlayResult, 'xpEarned'>) => {
    // V1: XP = ratio × xpWeight where ratio uses self-rating + target-length completion
    const ratingScore = (r.selfRating - 1) / 4 // 0~1
    const lengthScore = r.inTarget ? 1 : 0.5
    const score = (ratingScore * 0.7 + lengthScore * 0.3)
    const xpEarned = Math.max(3, Math.round(xpWeight * score + 5))
    await recordSession({
      area: 'writing',
      itemId: item.id,
      durationSeconds: r.timeSec,
      score,
      xpEarned,
      details: { wordCount: r.wordCount, selfRating: r.selfRating },
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
        <WritingPlayer item={view.item} onComplete={(r) => void onComplete(view.item, r)} />
      </div>
    )
  }

  if (view.kind === 'result') {
    const ratio = (view.r.selfRating - 1) / 4
    return (
      <ResultScreen
        accent="violet"
        xpEarned={view.r.xpEarned}
        stats={[
          { label: '단어', value: view.r.wordCount },
          { label: '자평', value: `${view.r.selfRating}/5` },
          { label: '시간', value: `${view.r.timeSec}초` },
        ]}
        onAgain={() => setView({ kind: 'play', item: view.item })}
        onHome={() => setView({ kind: 'list' })}
        ratio={ratio}
      />
    )
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs text-violet-600 font-semibold uppercase tracking-wider">
          글의 탑
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">쓰기</h1>
        <p className="text-sm text-slate-600 mt-1">
          {items.length}개 주제 · 모범답안과 비교, 자가 평가 ⓘ
        </p>
      </header>

      <Card className="p-3 bg-slate-50 border-slate-200">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          💡 V1: AI 첨삭은 W5에 연동 예정. 지금은 모범답안 비교 + 본인이 별점 매기는 방식이에요.
        </p>
      </Card>

      {items.length === 0 ? (
        <Card className="p-6 text-center text-slate-500">
          <p className="text-sm">아직 주제가 없어요.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const typeInfo = TYPE_BADGE[it.type]
            return (
              <button
                key={it.id}
                onClick={() => setView({ kind: 'play', item: it })}
                className={cn(
                  'w-full text-left rounded-3xl border bg-white p-4 transition-all',
                  'border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 active:scale-[0.99]'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                    <Pencil className="h-5 w-5 text-violet-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <Badge tone={typeInfo.tone} className="text-[10px]">
                        {typeInfo.label}
                      </Badge>
                      <Badge tone="slate" className="text-[10px]">
                        {it.target_length_words[0]}-{it.target_length_words[1]} words
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                      {it.prompt_ko}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
