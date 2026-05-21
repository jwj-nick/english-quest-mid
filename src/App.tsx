import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useGameStore } from '@/store/game.store'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const DungeonPage = lazy(() => import('@/pages/DungeonPage').then((m) => ({ default: m.DungeonPage })))
const ProgressPage = lazy(() => import('@/pages/ProgressPage').then((m) => ({ default: m.ProgressPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))

function PageLoading() {
  return (
    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
      불러오는 중...
    </div>
  )
}

export default function App() {
  const load = useGameStore((s) => s.load)
  const loaded = useGameStore((s) => s.loaded)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  return (
    <AppShell>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dungeon/:area" element={<DungeonPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
