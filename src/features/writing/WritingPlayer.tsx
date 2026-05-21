import { useMemo, useState } from 'react'
import { Eye, EyeOff, Sparkles, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

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
  item: WritingItem
  onComplete: (r: { wordCount: number; inTarget: boolean; selfRating: number; timeSec: number }) => void
}

export function WritingPlayer({ item, onComplete }: Props) {
  const [text, setText] = useState('')
  const [showSample, setShowSample] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selfRating, setSelfRating] = useState(3)
  const [startedAt] = useState(() => Date.now())

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text]
  )
  const [minW, maxW] = item.target_length_words
  const inTarget = wordCount >= minW && wordCount <= maxW
  const isShort = wordCount < minW
  const isLong = wordCount > maxW

  const onSubmit = () => {
    if (text.trim().length === 0) return
    setSubmitted(true)
    setShowSample(true)
  }

  const onFinish = () => {
    const timeSec = Math.round((Date.now() - startedAt) / 1000)
    onComplete({
      wordCount,
      inTarget,
      selfRating,
      timeSec,
    })
  }

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-white border-violet-200">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <Badge tone="violet" className="text-[10px]">
            {item.type}
          </Badge>
          {item.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] text-slate-500">
              #{t}
            </span>
          ))}
        </div>
        <p className="text-[15px] font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
          {item.prompt_ko}
        </p>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-wrap">
          {item.prompt_en}
        </p>
      </Card>

      {/* Hints */}
      {(item.grammar_focus.length > 0 || item.vocabulary_suggestions.length > 0) && (
        <div>
          <button
            onClick={() => setShowHints((v) => !v)}
            className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            힌트 {showHints ? '숨기기' : '보기'}
          </button>
          {showHints && (
            <Card className="p-3 mt-2 bg-amber-50/60 border-amber-200">
              {item.grammar_focus.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-1">
                    어법 포인트
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.grammar_focus.map((g) => (
                      <Badge key={g} tone="amber" className="text-[10px]">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.vocabulary_suggestions.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-1">
                    추천 어휘
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.vocabulary_suggestions.map((v) => (
                      <Badge key={v} tone="amber" className="text-[10px]">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Editor */}
      <Card className="p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitted}
          rows={8}
          placeholder="여기에 영어로 작성해보세요..."
          className={cn(
            'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed',
            'focus:outline-none focus:ring-2 focus:ring-violet-300 resize-y min-h-[180px]',
            'placeholder:text-slate-400'
          )}
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span
            className={cn(
              'tabular-nums font-semibold',
              inTarget ? 'text-emerald-600' : isShort ? 'text-amber-600' : 'text-rose-600'
            )}
          >
            {wordCount} words
          </span>
          <span className="text-slate-500">
            목표: {minW}–{maxW} words {inTarget ? '✓' : isShort ? '(조금만 더!)' : '(짧게 줄여보기)'}
          </span>
        </div>
      </Card>

      {!submitted ? (
        <Button onClick={onSubmit} className="w-full" size="lg" disabled={text.trim().length === 0}>
          작성 완료 → 모범답안 비교
        </Button>
      ) : (
        <>
          {/* Sample reveal */}
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                모범답안
              </div>
              <button
                onClick={() => setShowSample((v) => !v)}
                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                {showSample ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showSample ? '숨기기' : '보기'}
              </button>
            </div>
            {showSample ? (
              <p className="text-sm text-slate-800 leading-[1.85] whitespace-pre-wrap">
                {item.sample_answer_en}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">먼저 본인 답을 충분히 다듬어보세요.</p>
            )}
          </Card>

          {/* Self rating */}
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
              본인 평가
            </div>
            <p className="text-xs text-slate-600 mb-2">스스로 별점을 매겨주세요 (모범답안과 비교해서)</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSelfRating(n)}
                  className={cn(
                    'flex-1 h-12 rounded-xl border transition-all flex items-center justify-center',
                    selfRating >= n
                      ? 'bg-amber-400 border-amber-500 text-white'
                      : 'bg-white border-slate-200 text-slate-300'
                  )}
                >
                  <Star className={cn('h-5 w-5', selfRating >= n && 'fill-white')} />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              {selfRating === 5 && '아주 잘 썼어요!'}
              {selfRating === 4 && '잘 썼어요. 자잘한 부분만 다듬으면 완벽'}
              {selfRating === 3 && '괜찮아요. 한두 가지 개선점 있음'}
              {selfRating === 2 && '의미는 통하지만 어법/어휘 보완 필요'}
              {selfRating === 1 && '많이 다시 써봐야 할 것 같아요'}
            </p>
          </Card>

          <Button onClick={onFinish} className="w-full" size="lg">
            완료 → XP 받기
          </Button>
        </>
      )}
    </div>
  )
}
