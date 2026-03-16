import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import db from './db.js'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001
const ARTIST_USER_ID = process.env.VITE_ARTIST_USER_ID ?? ''

app.use(cors())
app.use(express.json())

function getAuthUser(req: express.Request): { userId: string } | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const parts = auth.slice(7).split(':')
  if (parts.length === 2) {
    return { userId: parts[0] }
  }
  return null
}

function isArtist(userId: string): boolean {
  return ARTIST_USER_ID !== '' && userId === ARTIST_USER_ID
}

// Verify auth (lightweight - real verification would validate against Audius)
app.post('/api/auth/verify', (req, res) => {
  const { audiusUserId } = req.body
  if (!audiusUserId) {
    res.status(400).json({ error: 'Missing audiusUserId' })
    return
  }
  res.json({ valid: true, isArtist: isArtist(audiusUserId) })
})

// Create submission
app.post('/api/submissions', (req, res) => {
  const user = getAuthUser(req)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const {
    trackId, trackTitle, artistName, genre, bpm,
    moods, description, releaseStatus, location,
    instagram, tiktok, spotifyUrl, audiusHandle,
  } = req.body

  if (!trackId || !trackTitle) {
    res.status(400).json({ error: 'trackId and trackTitle are required' })
    return
  }

  const stmt = db.prepare(`
    INSERT INTO submissions (
      track_id, track_title, audius_user_id, audius_handle, artist_name,
      genre, bpm, moods, description, release_status,
      location, instagram, tiktok, spotify_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')
  `)

  const result = stmt.run(
    trackId, trackTitle, user.userId, audiusHandle ?? '',
    artistName ?? '', genre ?? '', bpm ?? '',
    Array.isArray(moods) ? moods.join(',') : (moods ?? ''),
    description ?? '', releaseStatus ?? '', location ?? '',
    instagram ?? '', tiktok ?? '', spotifyUrl ?? ''
  )

  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ submission: formatSubmission(submission as any) })
})

// Get current user's submissions
app.get('/api/submissions/mine', (req, res) => {
  const user = getAuthUser(req)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const rows = db.prepare(
    'SELECT * FROM submissions WHERE audius_user_id = ? ORDER BY created_at DESC'
  ).all(user.userId)

  res.json({ submissions: rows.map((r: any) => formatSubmission(r)) })
})

// Get all submissions (artist only)
app.get('/api/submissions', (req, res) => {
  const user = getAuthUser(req)
  if (!user || !isArtist(user.userId)) {
    res.status(403).json({ error: 'Artist access only' })
    return
  }

  const { status, search } = req.query
  let query = 'SELECT * FROM submissions'
  const conditions: string[] = []
  const params: any[] = []

  if (status && status !== 'all') {
    conditions.push('status = ?')
    params.push(status)
  }
  if (search) {
    conditions.push('(track_title LIKE ? OR artist_name LIKE ? OR audius_handle LIKE ?)')
    const term = `%${search}%`
    params.push(term, term, term)
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  query += ' ORDER BY created_at DESC'

  const rows = db.prepare(query).all(...params)
  res.json({ submissions: rows.map((r: any) => formatSubmission(r)) })
})

// Get single submission
app.get('/api/submissions/:id', (req, res) => {
  const user = getAuthUser(req)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id) as any
  if (!row) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  if (row.audius_user_id !== user.userId && !isArtist(user.userId)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  res.json({ submission: formatSubmission(row) })
})

// Update submission status (artist only)
app.patch('/api/submissions/:id/status', (req, res) => {
  const user = getAuthUser(req)
  if (!user || !isArtist(user.userId)) {
    res.status(403).json({ error: 'Artist access only' })
    return
  }

  const { status, note } = req.body
  const validStatuses = ['queued', 'in_review', 'listened', 'chosen', 'passed']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  db.prepare(`
    UPDATE submissions SET status = ?, artist_note = COALESCE(?, artist_note), updated_at = datetime('now')
    WHERE id = ?
  `).run(status, note ?? null, req.params.id)

  const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id) as any
  if (!row) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  res.json({ submission: formatSubmission(row) })
})

function formatSubmission(row: any) {
  return {
    id: row.id,
    trackId: row.track_id,
    trackTitle: row.track_title,
    audiusUserId: row.audius_user_id,
    audiusHandle: row.audius_handle,
    artistName: row.artist_name,
    genre: row.genre,
    bpm: row.bpm,
    moods: row.moods,
    description: row.description,
    releaseStatus: row.release_status,
    location: row.location,
    instagram: row.instagram,
    tiktok: row.tiktok,
    spotifyUrl: row.spotify_url,
    status: row.status,
    artistNote: row.artist_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  if (ARTIST_USER_ID) {
    console.log(`Artist user ID: ${ARTIST_USER_ID}`)
  } else {
    console.log('Warning: VITE_ARTIST_USER_ID not set - no user will have artist access')
  }
})
