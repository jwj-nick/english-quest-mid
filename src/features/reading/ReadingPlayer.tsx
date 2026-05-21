import { useMemo, useState } from 'react'
import { Languages, Eye, EyeOff, Check, X, ArrowRight, BookMarked } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { ReadingItem } from '@/types/content'

interface Props {
  item: ReadingItem
  onComplete: (r: { correct: number; total: number; timeSec: number }) => void
}

export function ReadingPlayer({ item, onComplete }: Props) {
  const [phase, setPhase] = useState<'reading' | 'quiz'>('reading')
  const [showKo, setShowKo] = useState(false)
  const [showVocab, setShowVocab] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [startedAt] = useState(() => Date.now())

  const q = item.questions[qIdx]

  const onPick = (i: number) => {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    if (i === q.correct_index) setCorrect((c) => c + 1)
  }

  const onNext = () => {
    if (qIdx + 1 >= item.questions.length) {
      const timeSec = Math.round((Date.now() - startedAt) / 1000)
      onComplete({ correct, total: item.questions.length, timeSec })
      return
    }
    setQIdx((i) => i + 1)
    setSelected(null)
    setRevealed(false)
  }

  if (phase === 'reading') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant={showKo ? 'primary' : 'secondary'}
              onClick={() => setShowKo((v) => !v)}
            >
              <Languages className="h-3.5 w-3.5" />
              {showKo ? '번역 끄기' : '번역 보기'}
            </Button>
            <Button
              size="sm"
              variant={showVocab ? 'primary' : 'secondary'}
              onClick={() => setShowVocab((v) => !v)}
            >
              <BookMarked className="h-3.5 w-3.5" />
              어휘
            </Button>
          </div>
        </div>

        <Card className="p-5 bg-gradient-to-br from-amber-50/50 to-white">
          <p className="text-[15px] sm:text-base text-slate-800 leading-[1.85] whitespace-pre-wrap">
            {item.passage_en}
          </p>
          {showKo && (
            <div className="mt-4 pt-4 border-t border-amber-200">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {item.passage_ko}
              </p>
            </div>
          )}
        </Card>

        {showVocab && item.vocabulary_notes.length > 0 && (
          <Card className="p-4 bg-slate-50">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
              지문 속 어휘
            </div>
            <div className="grid gap-1.5">
              {item.vocabulary_notes.map((v) => (
                <div key={v.word} className="text-sm flex justify-between gap-3">
                  <span className="font-semibold text-slate-900">{v.word}</span>
                  <span className="text-slate-600">{v.meaning_ko}</span>
                </div>
              ))}
            </div>
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
            <Badge tone="amber" className="text-[10px]">
              {q.type}
            </Badge>
            <span>{item.title}</span>
          </span>
          <span className="tabular-nums">
            {qIdx + 1} / {item.questions.length}
          </span>
        </div>
        <ProgressBar value={qIdx + (revealed ? 1 : 0)} max={item.questions.length} color="amber" />
      </div>

      <Card className="p-5 bg-white">
        <p className="text-[15px] sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
          {q.question_ko}
        </p>
      </Card>

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
                  isSelected && isCorrect && 'bg-emerald-200 text-emerald-700',
                  isSelected && !isCorrect && revealed && 'bg-rose-200 text-rose-700',
                  !isSelected && revealed && isCorrect && 'bg-emerald-200 text-emerald-700',
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

      {revealed && (
        <div className="animate-pop space-y-3">
          <Card className="p-4 bg-amber-50/60 border-amber-200">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-1">
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
