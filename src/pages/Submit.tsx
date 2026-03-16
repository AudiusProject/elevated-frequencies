import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/store'
import { useAudiusOAuth } from '@/hooks/useAudiusOAuth'
import { getAudiusSdk } from '@/lib/audius'
import { api, type CreateSubmissionPayload } from '@/lib/api'
import styles from './Submit.module.css'

const GENRES = [
  'Electronic',
  'House',
  'Techno',
  'Tech House',
  'Deep House',
]

export function Submit() {
  const user = useAuthStore((s) => s.user)
  const { login, loading: authLoading } = useAudiusOAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const artRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [coverArt, setCoverArt] = useState<File | null>(null)
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ trackTitle: string; artistName: string } | null>(null)

  const [form, setForm] = useState({
    trackTitle: '',
    artistName: user?.name ?? '',
    genre: '',
    bpm: '',
    description: '',
    releaseStatus: '',
    location: '',
    instagram: '',
    tiktok: '',
    spotifyUrl: '',
  })

  const [checks, setChecks] = useState({
    original: false,
    liveOnAudius: false,
  })

  if (!user) {
    return (
      <section className={styles.authPrompt}>
        <h2>Sign In to Submit</h2>
        <p>Connect your Audius account to upload and submit a track for consideration.</p>
        <button onClick={login} className="btn-primary" disabled={authLoading} style={{ maxWidth: 320 }}>
          {authLoading ? <span className="spin" /> : null}
          Sign In with Audius &nbsp;&rarr;
        </button>
      </section>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (!f.type.startsWith('audio/')) {
        setError('Please select an audio file')
        return
      }
      setFile(f)
      setError(null)
      if (!form.trackTitle) {
        const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setForm((prev) => ({ ...prev, trackTitle: name }))
      }
    }
  }

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (!f.type.startsWith('image/')) {
        setError('Please select an image file for cover art')
        return
      }
      setCoverArt(f)
      setCoverArtPreview(URL.createObjectURL(f))
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError('Please select an audio file')
      return
    }
    if (!coverArt) {
      setError('Cover art is required by Audius. Please add an image.')
      return
    }
    if (!form.trackTitle || !form.genre) {
      setError('Track title and genre are required')
      return
    }
    if (!checks.original || !checks.liveOnAudius) {
      setError('Please confirm both checkboxes')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const audiusSdk = getAudiusSdk()

      const descriptionWithContext = [
        form.description,
        '',
        '---',
        `Submitted to Elevated Frequencies by @${user.handle}`,
        form.location ? `Location: ${form.location}` : '',
        form.instagram ? `Instagram: @${form.instagram}` : '',
        form.tiktok ? `TikTok: @${form.tiktok}` : '',
        form.spotifyUrl ? `Spotify: ${form.spotifyUrl}` : '',
        form.bpm ? `BPM: ${form.bpm}` : '',
        form.releaseStatus ? `Release Status: ${form.releaseStatus}` : '',
      ].filter(Boolean).join('\n')

      setUploadProgress(5)

      const imageUpload = audiusSdk.uploads.createImageUpload({
        file: coverArt!,
        onProgress: ({ loaded, total }) => {
          const pct = total > 0 ? (loaded / total) * 15 : 0
          setUploadProgress(Math.round(5 + pct))
        },
      })
      const coverArtCid = await imageUpload.start()

      setUploadProgress(20)

      const audioUpload = audiusSdk.uploads.createAudioUpload({
        file: file!,
        onProgress: ({ loaded, total }) => {
          const pct = total > 0 ? (loaded / total) * 60 : 0
          setUploadProgress(Math.round(20 + pct))
        },
      })
      const audioResult = await audioUpload.start()

      setUploadProgress(85)

      const createRes = await audiusSdk.tracks.createTrack({
        userId: user.id,
        metadata: {
          title: `[EF Submission] ${form.trackTitle}`,
          genre: form.genre as import('@audius/sdk').Genre,
          description: descriptionWithContext,
          mood: undefined,
          tags: 'elevated-frequencies,submission',
          isUnlisted: true,
          bpm: form.bpm ? Number(form.bpm) : undefined,
          trackCid: audioResult.trackCid ?? audioResult.origFileCid,
          origFileCid: audioResult.origFileCid,
          origFilename: audioResult.origFilename,
          duration: audioResult.duration,
          previewCid: audioResult.previewCid ?? undefined,
          coverArtSizes: coverArtCid,
        },
      })

      setUploadProgress(100)

      const trackId = createRes?.trackId ?? ''

      const payload: CreateSubmissionPayload = {
        trackId: String(trackId),
        trackTitle: form.trackTitle,
        artistName: form.artistName || user.name,
        genre: form.genre,
        bpm: form.bpm,
        description: form.description,
        releaseStatus: form.releaseStatus,
        location: form.location,
        instagram: form.instagram,
        tiktok: form.tiktok,
        spotifyUrl: form.spotifyUrl,
      }

      await api.createSubmission({
        ...payload,
        audiusHandle: user.handle,
      })

      setSuccess({ trackTitle: form.trackTitle, artistName: form.artistName || user.name })
    } catch (err: any) {
      console.error('Submit error:', err)
      setError(err.message ?? 'Failed to upload and submit track')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.successOverlay}>
        <div className={styles.successBox}>
          <div className={styles.successCheck}>&check;</div>
          <h2>Track Submitted</h2>
          <p>
            Your track is in the crate. Olivia will personally review it. If it has the energy,
            you'll hear back. Keep making music.
          </p>
          <div className={styles.successTrack}>
            &ldquo;{success.trackTitle}&rdquo; by {success.artistName}
          </div>
          <p style={{ fontSize: 11, marginBottom: 24 }}>
            Your music lives on Audius. Check your submission status anytime.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => navigate('/my-submissions')}>
              View My Submissions
            </button>
            <button className="btn-secondary" onClick={() => {
              setSuccess(null)
              setFile(null)
              setCoverArt(null)
              setCoverArtPreview(null)
              setForm({ trackTitle: '', artistName: user?.name ?? '', genre: '', bpm: '', description: '', releaseStatus: '', location: '', instagram: '', tiktok: '', spotifyUrl: '' })
              setChecks({ original: false, liveOnAudius: false })
              setCharCount(0)
            }}>
              Submit Another Track
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.mainLayout}>
      <div className={styles.formWrap}>
        <div className={styles.formTop}>
          <h2>Submit Your Track</h2>
          <p>Upload your audio file and fill in the details below.</p>
        </div>

        <div className={styles.connectedAs}>
          <div className={styles.avatar}>
            {user.profilePicture
              ? <img src={user.profilePicture} alt="" />
              : user.name.charAt(0).toUpperCase()
            }
          </div>
          <div>
            <strong>{user.name}</strong>
            <span>@{user.handle} on Audius</span>
          </div>
          <div className={styles.connectedTag}>&check; Connected</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fsec">Audio File</div>

          <div className="field-group">
            <label>Select Audio File <span className="req">*</span></label>
            <div
              className={styles.dropZone}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {file ? (
                <div className={styles.filePreview}>
                  <span className={styles.fileIcon}>&#9835;</span>
                  <div>
                    <strong>{file.name}</strong>
                    <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>
              ) : (
                <div className={styles.dropPrompt}>
                  <span>&#8593;</span>
                  Click to select an audio file (MP3, WAV, FLAC, etc.)
                </div>
              )}
            </div>
          </div>

          <div className="field-group">
            <label>Cover Art <span className="req">*</span></label>
            <div
              className={styles.dropZone}
              onClick={() => artRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px' }}
            >
              <input
                ref={artRef}
                type="file"
                accept="image/*"
                onChange={handleCoverArtChange}
                style={{ display: 'none' }}
              />
              {coverArtPreview ? (
                <div className={styles.filePreview}>
                  <img src={coverArtPreview} alt="Cover art" style={{ width: 64, height: 64, objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <strong>{coverArt?.name}</strong>
                    <span>Click to change</span>
                  </div>
                </div>
              ) : (
                <div className={styles.dropPrompt}>
                  <span style={{ fontSize: 18 }}>&#128247;</span>
                  Click to add cover art (JPG, PNG)
                </div>
              )}
            </div>
          </div>

          <hr className="fdiv" />
          <div className="fsec">Artist Information</div>

          <div className="field-row">
            <div className="field-group" style={{ margin: 0 }}>
              <label>Artist Name <span className="req">*</span></label>
              <input
                type="text"
                value={form.artistName}
                onChange={(e) => setForm((f) => ({ ...f, artistName: e.target.value }))}
                placeholder="Your artist alias"
                required
              />
            </div>
            <div className="field-group" style={{ margin: 0 }}>
              <label>City / Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Chicago, IL"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group" style={{ margin: 0 }}>
              <label>Instagram</label>
              <div className="icon-input">
                <span className="iico">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  placeholder="yourhandle"
                />
              </div>
            </div>
            <div className="field-group" style={{ margin: 0 }}>
              <label>TikTok</label>
              <div className="icon-input">
                <span className="iico">@</span>
                <input
                  type="text"
                  value={form.tiktok}
                  onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))}
                  placeholder="yourhandle"
                />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label>
              Spotify Artist URL{' '}
              <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font)', fontWeight: 300 }}>
                &nbsp;profile only, not for submission
              </span>
            </label>
            <input
              type="url"
              value={form.spotifyUrl}
              onChange={(e) => setForm((f) => ({ ...f, spotifyUrl: e.target.value }))}
              placeholder="open.spotify.com/artist/..."
            />
          </div>

          <hr className="fdiv" />
          <div className="fsec">Track Details</div>

          <div className="field-row">
            <div className="field-group" style={{ margin: 0 }}>
              <label>Track Title <span className="req">*</span></label>
              <input
                type="text"
                value={form.trackTitle}
                onChange={(e) => setForm((f) => ({ ...f, trackTitle: e.target.value }))}
                placeholder="Your track title"
                required
              />
            </div>
            <div className="field-group" style={{ margin: 0 }}>
              <label>BPM</label>
              <input
                type="text"
                value={form.bpm}
                onChange={(e) => setForm((f) => ({ ...f, bpm: e.target.value }))}
                placeholder="e.g. 126"
              />
            </div>
          </div>

          <div className="field-group">
            <label>Genre <span className="req">*</span></label>
            <select
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
              required
            >
              <option value="" disabled>Select a genre</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Release Status <span className="req">*</span></label>
            <select
              value={form.releaseStatus}
              onChange={(e) => setForm((f) => ({ ...f, releaseStatus: e.target.value }))}
              required
            >
              <option value="" disabled>Is this track released?</option>
              <option value="released">Released on Audius</option>
              <option value="unreleased">Unreleased</option>
              <option value="signed">Signed / Label Release</option>
            </select>
          </div>

          <div className="field-group">
            <label>Tell Olivia About Your Track</label>
            <textarea
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }))
                setCharCount(e.target.value.length)
              }}
              placeholder="What inspired it? What do you want listeners to feel? Any context about the production..."
              maxLength={500}
            />
            <div className="char-row"><span>{charCount}</span> / 500</div>
          </div>

          <hr className="fdiv" />

          <label className="rights-block" onClick={() => setChecks((c) => ({ ...c, original: !c.original }))}>
            <input type="checkbox" checked={checks.original} onChange={() => {}} />
            <p>
              <strong>I confirm this is 100% original music.</strong> No uncleared samples or
              third-party content. I own all rights and grant Elevated Frequencies permission to
              feature this track and share the Audius link. If the track is signed after submission,
              I will notify Olivia before any exclusivity takes effect.
            </p>
          </label>

          <label className="rights-block" onClick={() => setChecks((c) => ({ ...c, liveOnAudius: !c.liveOnAudius }))}>
            <input type="checkbox" checked={checks.liveOnAudius} onChange={() => {}} />
            <p>
              <strong>I understand my track will be uploaded privately to Audius</strong> via the
              Open Audio Protocol. The track remains my property and I can manage it from my Audius account.
            </p>
          </label>

          {error ? (
            <div className={styles.error}>{error}</div>
          ) : null}

          <button
            type="submit"
            className="btn-primary"
            disabled={uploading || !checks.original || !checks.liveOnAudius}
          >
            {uploading ? (
              <>
                <span className="spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>Submit for Consideration &nbsp;&rarr;</>
            )}
          </button>
        </form>
      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.scard}>
          <div className={styles.scardHead}>Your Curator</div>
          <div className={styles.scardBody}>
            <div className={styles.hostRow}>
              <div className={styles.hostAvatar}>O</div>
              <div>
                <div className={styles.hostName}>Olivia Mancuso</div>
                <div className={styles.hostRole}>Host &middot; Chicago Music Nexus</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.scard}>
          <div className={styles.scardHead}>What Olivia Looks For</div>
          <div className={styles.scardBody}>
            <ul className={styles.criteria}>
              <li>Original tracks only, no uncleared samples</li>
              <li>Music with genuine underground energy</li>
              <li>Tracks that tell a story or create a feeling</li>
              <li>Completed, production-ready tracks</li>
            </ul>
          </div>
        </div>

        <div className={`${styles.scard} ${styles.audiusScard}`}>
          <div className={styles.scardHead}>Powered by Audius</div>
          <div className={styles.scardBody}>
            <p>
              Your track is uploaded privately via the Audius protocol. You maintain full ownership
              and control. Olivia can review your track and communicate via comments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
