import { cn } from '@/lib/utils'

interface Props {
  value: number
  max: number
  className?: string
  color?: 'violet' | 'emerald' | 'amber' | 'rose' | 'sky'
  showLabel?: boolean
}

const COLORS = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
}

export function ProgressBar({ value, max, className, color = 'violet', showLabel }: Props) {
  const pct = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', COLORS[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-slate-500 tabular-nums">
          {value} / {max}
        </div>
      )}
    </div>
  )
}
