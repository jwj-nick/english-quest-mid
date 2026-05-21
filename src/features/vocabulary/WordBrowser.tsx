import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { contentAsset } from '@/lib/content'
import { cn } from '@/lib/utils'
import type { VocabItem } from '@/types/content'

interface Props {
  items: VocabItem[]
  week?: string
}

export function WordBrowser({ items, week }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (items.length === 0) {
    return <p className="text-center text-slate-500 py-8">단어가 없어요.</p>
  }

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const open = openId === it.id
        const imgUrl = week ? contentAsset(week, it.image_url) : undefined
        return (
          <Card key={it.id} className="overflow-hidden">
            <button
              onClick={() => setOpenId(open ? null : it.id)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">{it.word}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{it.ipa}</span>
                  <Badge tone="slate" className="text-[10px]">
                    {it.pos}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 truncate">{it.korean}</p>
              </div>
              <DifficultyBadge level={it.difficulty} />
              {open ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {open && (
              <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-slate-100 bg-slate-50/40">
                <Field label="정의">
                  <span className="text-sm text-slate-700">{it.definition_en}</span>
                </Field>
                <Field label="예문">
                  <p className="text-sm text-slate-800">{it.example_en}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{it.example_ko}</p>
                </Field>
                {it.synonyms.length > 0 && (
                  <Field label="동의어">
                    <div className="flex flex-wrap gap-1.5">
                      {it.synonyms.map((s) => (
                        <Badge key={s} tone="emerald" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </Field>
                )}
                {it.antonyms.length > 0 && (
                  <Field label="반의어">
                    <div className="flex flex-wrap gap-1.5">
                      {it.antonyms.map((s) => (
                        <Badge key={s} tone="rose" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </Field>
                )}
                {it.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {it.tags.map((t) => (
                      <span key={t} className="text-[10px] text-slate-500">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}

function DifficultyBadge({ level }: { level: number }) {
  // 1-2: emerald, 3: amber, 4-5: rose
  const dotColor =
    level <= 2 ? 'bg-emerald-400' : level === 3 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn('w-1 h-3 rounded-sm', i < level ? dotColor : 'bg-slate-200')}
        />
      ))}
    </span>
  )
}
