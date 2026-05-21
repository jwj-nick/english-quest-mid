import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm shadow-slate-900/[0.02]',
        className
      )}
      {...rest}
    />
  )
}
