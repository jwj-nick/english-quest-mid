import { NavLink } from 'react-router-dom'
import { Home, BarChart3, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: '홈', icon: Home, end: true },
  { to: '/progress', label: '기록', icon: BarChart3, end: false },
  { to: '/profile', label: '캐릭터', icon: User, end: false },
] as const

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-slate-200/60 safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium',
                isActive ? 'text-violet-600' : 'text-slate-500'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
