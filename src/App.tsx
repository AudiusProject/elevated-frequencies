import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { NowPlayingBar } from '@/components/NowPlayingBar'
import { Landing } from '@/pages/Landing'
import { Submit } from '@/pages/Submit'
import { MySubmissions } from '@/pages/MySubmissions'
import { Dashboard } from '@/pages/Dashboard'
import { TrackDetail } from '@/pages/TrackDetail'

export function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/my-submissions" element={<MySubmissions />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submission/:id" element={<TrackDetail />} />
        </Routes>
      </main>
      <Footer />
      <NowPlayingBar />
    </BrowserRouter>
  )
}
