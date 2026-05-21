import { useEffect, useState } from 'react'
import { Play, Pause, Copy, ExternalLink, Drama, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cancel, speak } from '@/lib/speech'

interface RoleplayItem {
  id: string
  title: string
  scenario_ko: string
  your_role: string
  ai_role: string
  ai_persona: string
  opening_line_en: string
  goal: string
  min_turns: number
  max_turns: number
  vocabulary_hints: string[]
  system_prompt_for_llm: string
  difficulty: number
  tags: string[]
}

interface Props {
  items: RoleplayItem[]
  xpWeight: number
}

export function RoleplayMode({ items }: Props) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => () => cancel(), [])

  const item = items[idx]

  if (!item) {
    return <p className="text-center text-sm text-slate-500 py-8">상황극이 없어요.</p>
  }

  const play = () => {
    if (playing) {
      cancel()
      setPlaying(false)
      return
    }
    setPlaying(true)
    void speak(item.opening_line_en, {
      rate: 0.95,
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    })
  }

  const fullPrompt = buildClaudePrompt(item)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-rose-50 to-white border-rose-200">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge tone="rose" className="text-[10px]">
            상황극 {idx + 1} / {items.length}
          </Badge>
          {item.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] text-slate-500">
              #{t}
            </span>
          ))}
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{item.scenario_ko}</p>

        <div className="mt-3 pt-3 border-t border-rose-100 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-700">
              내 역할
            </div>
            <p className="text-slate-700">{item.your_role}</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-700">
              AI 역할
            </div>
            <p className="text-slate-700">{item.ai_role}</p>
          </div>
        </div>

        {item.vocabulary_hints.length > 0 && (
          <div className="mt-3 pt-3 border-t border-rose-100">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-700 mb-1.5">
              사용할 만한 표현
            </div>
            <div className="flex flex-wrap gap-1.5">
              {item.vocabulary_hints.map((v) => (
                <Badge key={v} tone="rose" className="text-[10px]">
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Opening line */}
      <Card className="p-4 bg-white">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
          시작 대사 (AI)
        </div>
        <p className="text-base font-semibold text-slate-900 mb-2">"{item.opening_line_en}"</p>
        <Button size="sm" variant="secondary" onClick={play}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          듣기
        </Button>
      </Card>

      {/* Claude Pro path */}
      <Card className="p-4 bg-gradient-to-br from-violet-50 to-violet-100/60 border-violet-200">
        <div className="flex items-start gap-2 mb-3">
          <Drama className="h-5 w-5 text-violet-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-violet-900">실제 대화 진행하기</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              아래 프롬프트를 복사한 다음 Claude에서 음성 입력 모드로 시작하면 진짜 대화처럼 진행돼요.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button variant="primary" onClick={() => void copyPrompt()}>
            <Copy className="h-4 w-4" />
            {copied ? '복사됨!' : '프롬프트 복사'}
          </Button>
          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-violet-200 text-violet-700 h-11 px-4 text-sm font-semibold hover:bg-violet-50"
          >
            <ExternalLink className="h-4 w-4" />
            Claude 열기
          </a>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-violet-700 font-semibold">
            프롬프트 미리보기
          </summary>
          <pre className="mt-2 p-3 bg-white rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {fullPrompt}
          </pre>
        </details>
      </Card>

      {/* Nav */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          이전 시나리오
        </Button>
        <Button
          variant="secondary"
          onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
          disabled={idx === items.length - 1}
        >
          다음 시나리오
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function buildClaudePrompt(item: RoleplayItem): string {
  return `${item.system_prompt_for_llm}

시나리오: ${item.scenario_ko}

내 역할: ${item.your_role}
당신 역할: ${item.ai_role} (${item.ai_persona})
목표: ${item.goal}
대화 길이: ${item.min_turns}–${item.max_turns} turns

시작 대사를 그대로 사용해주세요: "${item.opening_line_en}"

대화가 끝나면 한국어로 짧은 피드백을 주세요:
1) 잘한 점 1가지
2) 문법·어휘 개선점 1가지`
}
