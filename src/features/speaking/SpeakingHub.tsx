import { useEffect, useState } from 'react'
import { Repeat, MessageCircle, Drama } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ShadowingMode } from './ShadowingMode'
import { QAMode } from './QAMode'
import { RoleplayMode } from './RoleplayMode'
import { useShadowing, useQA, useRoleplay } from '@/hooks/useContent'
import { cancel } from '@/lib/speech'
import { cn } from '@/lib/utils'

type Tab = 'shadow' | 'qa' | 'roleplay'

interface Props {
  xpWeight: number
  week: string
}

const TABS: { key: Tab; label: string; icon: typeof Repeat; desc: string }[] = [
  { key: 'shadow', label: '따라 읽기', icon: Repeat, desc: '들으면서 따라하기' },
  { key: 'qa', label: 'Q&A', icon: MessageCircle, desc: '짧은 질문에 답하기' },
  { key: 'roleplay', label: '상황극', icon: Drama, desc: '시나리오 + Claude Pro' },
]

export function SpeakingHub({ xpWeight, week }: Props) {
  const [tab, setTab] = useState<Tab>('shadow')
  const shadow = useShadowing(week)
  const qa = useQA(week)
  const roleplay = useRoleplay(week)

  useEffect(() => () => cancel(), [])

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs text-rose-600 font-semibold uppercase tracking-wider">
          말의 무대
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">말하기</h1>
        <p className="text-sm text-slate-600 mt-1">소리 내어 말해봐요</p>
      </header>

      <Card className="p-3 bg-slate-50 border-slate-200">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          💡 V1: 듣고 따라 말하기 중심. 음성 인식·AI 첨삭은 W5에 연동 예정. 자유 대화는 Claude Pro 안내 페이지로.
        </p>
      </Card>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => {
                cancel()
                setTab(t.key)
              }}
              className={cn(
                'rounded-xl py-2.5 text-xs font-semibold flex flex-col items-center gap-0.5 transition-all',
                tab === t.key
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'shadow' && (
        <TabBody loading={shadow.loading} error={shadow.error}>
          {shadow.data && <ShadowingMode items={shadow.data.items} xpWeight={xpWeight} />}
        </TabBody>
      )}
      {tab === 'qa' && (
        <TabBody loading={qa.loading} error={qa.error}>
          {qa.data && <QAMode items={qa.data.items} xpWeight={xpWeight} />}
        </TabBody>
      )}
      {tab === 'roleplay' && (
        <TabBody loading={roleplay.loading} error={roleplay.error}>
          {roleplay.data && <RoleplayMode items={roleplay.data.items} xpWeight={xpWeight} />}
        </TabBody>
      )}
    </div>
  )
}

function TabBody({
  loading,
  error,
  children,
}: {
  loading: boolean
  error: string | null
  children: React.ReactNode
}) {
  if (loading) return <p className="text-center text-sm text-slate-500 py-8">불러오는 중...</p>
  if (error) {
    return (
      <Card className="p-4 border-rose-200 bg-rose-50">
        <p className="text-sm text-rose-700">{error}</p>
      </Card>
    )
  }
  return <>{children}</>
}
