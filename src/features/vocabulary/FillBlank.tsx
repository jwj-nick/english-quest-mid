import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn, pick, shuffle } from '@/lib/utils'
import type { VocabItem } from '@/types/content'

interface Props {
  items: VocabItem[]
  questionCount?: number
  onComplete: (result: { correct: number; total: number; mistakes: number; timeSec: number; weakIds: string[] }) => void
}

interface Question {
  item: VocabItem
  sentence: string
  options: string[]
  correctIndex: number
}

export function FillBlank({ items, questionCount = 6, onComplete }: Props) {
  const questions = useMemo(() => buildQuestions(items, questionCount), [items, questionCount])
  const [idx, setIdx] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [weakIds, setWeakIds] = useState<Set<string>>(new Set())
  const [startedAt] = useState(() => Date.now())
  const [finished, setFinished] = useState(false)

  const current = questions[idx]

  useEffect(() => {
    if (finished) {
      const timeSec = Math.round((Date.now() - startedAt) / 1000)
      onComplete({
        correct,
        total: questions.length,
        mistakes,
        timeSec,
        weakIds: Array.from(weakIds),
      })
    }
  }, [finished, correct, mistakes, weakIds, questions.length, startedAt, onComplete])

  const onPick = (i: number) => {
    if (revealed) return
    setSelectedIdx(i)
    setRevealed(true)
    if (i === current.correctIndex) {
      setCorrect((c) => c + 1)
    } else {
      setMistakes((m) => m + 1)
      setWeakIds((s) => new Set([...s, current.item.id]))
    }
  }

  const onNext = () => {
    if (idx + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setIdx((i) => i + 1)
    setSelectedIdx(null)
    setRevealed(false)
  }

  if (questions.length === 0) {
    return <p className="text-center text-slate-500 py-8">단어 데이터가 없어요.</p>
  }

  if (finished) {
    return (
      <Card className="p-6 text-center bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 animate-pop">
        <Sparkles className="h-6 w-6 text-violet-600 mx-auto mb-2" />
        <p className="text-lg font-bold text-violet-800">완료!</p>
        <p className="text-sm text-violet-700 mt-1">
          정답 {correct} / {questions.length} · 실수 {mistakes}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between text-sm text-slate-600 mb-1.5">
          <span>빈칸 채우기 — 문장에 들어갈 알맞은 단어를 고르세요</span>
          <span className="tabular-nums">
            {idx + 1} / {questions.length}
          </span>
        </div>
        <ProgressBar value={idx + (revealed ? 1 : 0)} max={questions.length} color="violet" />
      </div>

      <Card className="p-5 bg-gradient-to-br from-slate-50 to-white">
        <p className="text-[15px] sm:text-base text-slate-800 leading-relaxed">
          {renderSentence(current.sentence)}
        </p>
        {revealed && (
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">{current.item.example_ko}</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {current.options.map((opt, i) => {
          const isSelected = selectedIdx === i
          const isCorrect = i === current.correctIndex
          return (
            <button
              key={i}
              onClick={() => onPick(i)}
              disabled={revealed}
              className={cn(
                'rounded-2xl border p-3 text-sm font-semibold transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
                !revealed && 'bg-white border-slate-200 hover:bg-slate-50 active:scale-[0.98]',
                revealed && isCorrect && 'bg-emerald-50 border-emerald-300 text-emerald-700',
                revealed && isSelected && !isCorrect && 'bg-rose-50 border-rose-300 text-rose-700 animate-shake',
                revealed && !isSelected && !isCorrect && 'bg-white border-slate-200 text-slate-400'
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {revealed && isCorrect && <Check className="h-3.5 w-3.5" />}
                {revealed && isSelected && !isCorrect && <X className="h-3.5 w-3.5" />}
                {opt}
              </span>
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="animate-pop space-y-3">
          <Card className="p-4 bg-amber-50/60 border-amber-200">
            <p className="text-sm text-slate-800">
              <span className="font-bold text-amber-700">{current.item.word}</span>{' '}
              <span className="text-xs text-slate-500">{current.item.ipa}</span>
              <span className="ml-2 text-sm text-slate-700">{current.item.korean}</span>
            </p>
            <p className="text-xs text-slate-600 mt-1">{current.item.definition_en}</p>
          </Card>
          <Button onClick={onNext} className="w-full" size="lg">
            {idx + 1 >= questions.length ? '결과 보기' : '다음'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function renderSentence(sentence: string) {
  // sentence contains "_____" placeholder
  const parts = sentence.split('_____')
  if (parts.length < 2) return sentence
  return (
    <>
      {parts[0]}
      <span className="inline-block min-w-[60px] mx-1 px-2 border-b-2 border-violet-400 text-violet-500 font-bold tracking-widest text-center">
        _____
      </span>
      {parts[1]}
    </>
  )
}

function buildQuestions(items: VocabItem[], count: number): Question[] {
  const picks = pick(items, Math.min(count, items.length))
  return picks.map((target) => {
    const wrongs = shuffle(items.filter((x) => x.id !== target.id))
      .slice(0, 3)
      .map((x) => x.word)
    const options = shuffle([target.word, ...wrongs])
    const correctIndex = options.indexOf(target.word)
    const sentence = blankOutWord(target.example_en, target.word)
    return { item: target, sentence, options, correctIndex }
  })
}

function blankOutWord(sentence: string, word: string): string {
  // case-insensitive replace, preserve punctuation. Match word or its common inflections (s, ed, ing, ies).
  const stems = [word, `${word}s`, `${word}ed`, `${word}ing`, `${word}ies`, `${word}d`]
  for (const s of stems.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (re.test(sentence)) return sentence.replace(re, '_____')
  }
  return sentence + ` (단어: _____)`
}
