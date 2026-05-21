import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { VocabHub } from '@/features/vocabulary/VocabHub'
import { ReadingHub } from '@/features/reading/ReadingHub'
import { ListeningHub } from '@/features/listening/ListeningHub'
import { WritingHub } from '@/features/writing/WritingHub'
import { SpeakingHub } from '@/features/speaking/SpeakingHub'
import { useSessionStore } from '@/store/session.store'
import { useReading, useListening, useWriting } from '@/hooks/useContent'
import { DUNGEONS } from '@/lib/dungeons'

export function DungeonPage() {
  const { area } = useParams<{ area: string }>()
  const dungeon = DUNGEONS.find((d) => d.key === area)
  const { vocab, weekMeta, loading, error, loadWeek, week } = useSessionStore()
  const reading = useReading(week)
  const listening = useListening(week)
  const writing = useWriting(week)

  useEffect(() => {
    if (!vocab) void loadWeek()
  }, [vocab, loadWeek])

  if (!dungeon) return <Navigate to="/" replace />

  if (!dungeon.enabled) {
    return <ComingSoon dungeon={dungeon} />
  }

  if (loading) {
    return <p className="text-center text-sm text-slate-500 py-8">던전 입장 중...</p>
  }
  if (error) {
    return (
      <Card className="p-4 border-rose-200 bg-rose-50">
        <p className="text-sm text-rose-700">{error}</p>
      </Card>
    )
  }

  const xpWeight = (key: string) => weekMeta?.xp_weights[key] ?? 10

  if (area === 'vocabulary') {
    if (!vocab) return <p className="text-center text-sm text-slate-500 py-8">콘텐츠 준비 중...</p>
    return <VocabHub items={vocab.items} theme={vocab.theme} xpWeight={xpWeight('vocabulary')} week={week} />
  }
  if (area === 'reading') {
    return (
      <AreaBody loading={reading.loading} error={reading.error}>
        {reading.data && <ReadingHub items={reading.data.items} xpWeight={xpWeight('reading')} />}
      </AreaBody>
    )
  }
  if (area === 'listening') {
    return (
      <AreaBody loading={listening.loading} error={listening.error}>
        {listening.data && (
          <ListeningHub items={listening.data.items} xpWeight={xpWeight('listening')} />
        )}
      </AreaBody>
    )
  }
  if (area === 'writing') {
    return (
      <AreaBody loading={writing.loading} error={writing.error}>
        {writing.data && <WritingHub items={writing.data.items} xpWeight={xpWeight('writing')} />}
      </AreaBody>
    )
  }
  if (area === 'speaking_qa' || area === 'speaking_shadowing' || area === 'speaking_roleplay') {
    // Speaking은 hub 하나에 3 sub-mode. Q&A 키로 들어와도 같은 hub.
    return (
      <SpeakingHub
        xpWeight={Math.max(
          xpWeight('speaking_qa'),
          xpWeight('speaking_shadowing'),
          xpWeight('speaking_roleplay')
        )}
        week={week}
      />
    )
  }

  return <Navigate to="/" replace />
}

function AreaBody({
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

function ComingSoon({ dungeon }: { dungeon: (typeof DUNGEONS)[number] }) {
  return (
    <div className="space-y-4">
      <header>
        <div className={`text-xs font-semibold uppercase tracking-wider ${dungeon.accent}`}>
          {dungeon.title}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">아직 잠겨있어요</h1>
      </header>
      <Card className="p-6 text-center bg-slate-50">
        <div className="text-5xl mb-2">{dungeon.emoji}</div>
        <p className="text-sm text-slate-600">곧 열릴 던전이에요. 조금만 기다려줘요!</p>
      </Card>
    </div>
  )
}
