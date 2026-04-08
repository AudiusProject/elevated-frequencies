import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/store'
import { isCuratorApp } from '@/lib/curator'
import { AudiusSessionSync } from '@/components/AudiusSessionSync'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { NowPlayingBar } from '@/components/NowPlayingBar'
import { CuratorApp } from '@/CuratorApp'
import { Landing } from '@/pages/Landing'
import { Submit } from '@/pages/Submit'
import { MySubmissions } from '@/pages/MySubmissions'
import { Dashboard } from '@/pages/Dashboard'
import { TrackDetail } from '@/pages/TrackDetail'

function SubmitterOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.isArtist) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function App() {
  if (isCuratorApp()) return <CuratorApp />

  return (
    <BrowserRouter>
      <AudiusSessionSync>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/submit" element={<SubmitterOnly><Submit /></SubmitterOnly>} />
            <Route path="/my-submissions" element={<SubmitterOnly><MySubmissions /></SubmitterOnly>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/submission/:id" element={<TrackDetail />} />
          </Routes>
        </main>
        <Footer />
        <NowPlayingBar />
      </AudiusSessionSync>
    </BrowserRouter>
  )
}
