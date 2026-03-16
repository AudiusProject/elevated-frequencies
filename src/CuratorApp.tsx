import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Dashboard } from '@/pages/Dashboard'
import { TrackDetail } from '@/pages/TrackDetail'
import { Logo } from '@/components/Logo'
import { NowPlayingBar } from '@/components/NowPlayingBar'

function getMainSiteUrl(): string {
  if (typeof window === 'undefined') return '/'
  const host = window.location.hostname
  const subdomain = (import.meta.env.VITE_CURATOR_SUBDOMAIN ?? 'curator').trim().toLowerCase()
  const mainHost =
    host === 'curator.localhost'
      ? 'localhost'
      : host.startsWith(`${subdomain}.`)
        ? host.slice(subdomain.length + 1)
        : host
  return `${window.location.protocol}//${mainHost}${window.location.port ? `:${window.location.port}` : ''}`
}

export function CuratorApp() {
  return (
    <BrowserRouter>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--off-black)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <Logo size={36} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--purple-light)' }}>
            Curator
          </span>
        </Link>
        <a
          href={getMainSiteUrl()}
          className="btn-secondary"
          style={{ fontSize: 11 }}
        >
          View submission site →
        </a>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/submission/:id" element={<TrackDetail />} />
        </Routes>
      </main>
      <NowPlayingBar />
    </BrowserRouter>
  )
}
