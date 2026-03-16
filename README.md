# Elevated Frequencies — Track Submission Portal

A web application for artists to submit tracks for consideration on the Elevated Frequencies podcast, built on the Audius / Open Audio Protocol.

## Features

**For Submitters:**
- Sign in with Audius OAuth
- Upload audio files directly (uploaded as private tracks on Audius)
- Fill in track metadata, mood tags, and a message to the curator
- Compliance checkboxes for originality and rights confirmation
- View submission status (Queued → In Review → Listened → Chosen/Passed)
- Receive feedback via Audius comments on your track

**For the Artist/Curator (Olivia):**
- Dashboard with all submissions, filterable by status
- Search by track name, artist, or handle
- Update submission status with one click
- Comment directly on submitted tracks via Audius protocol
- Stats overview (total, queued, chosen)

## Tech Stack

- **Frontend:** React 19 + TypeScript (strict) + Vite
- **Backend:** Express (API) + **Supabase** (PostgreSQL)
- **Auth:** Audius OAuth (PKCE with write scope)
- **Upload:** Audius SDK (`tracks.uploadTrack`)
- **Comments:** Audius SDK (`comments.postComment`)
- **State:** Zustand with persist
- **Styling:** Tailwind CSS v4, CSS Modules, Elevated Frequencies design system
- **Lint/Test:** ESLint 9 (flat config), Vitest
- **Deploy:** **Vercel** (same as [Crate](https://github.com/your-org/crate))

### Unlisted tracks

Submitted tracks are uploaded as **unlisted** on Audius. The API allows fetching and streaming unlisted tracks by track id. Comment posting uses a numeric `entityId` derived from the string track id (base36 decode).

## Setup

### 1. Prerequisites

- Node.js 18+
- An Audius developer app (get API key at [api.audius.co/plans](https://api.audius.co/plans))

### 2. Supabase & Environment

1. Create a [Supabase](https://supabase.com) project and run **`lib/supabase/schema.sql`** in the SQL Editor.
2. Copy env and fill in Audius + Supabase credentials:

```bash
cp .env.example .env
```

The **curator** and **submitter** experiences are separate. Two options:

- **Curator (no login):** Same secret in `VITE_CURATOR_KEY` and `CURATOR_KEY`. Then either:
  - **Path (e.g. Vercel default domain):** Open **https://elevated-frequencies.vercel.app/curator** — no subdomain or DNS needed.
  - **Subdomain:** Set `VITE_CURATOR_SUBDOMAIN=curator` and open **https://curator.yourdomain.com** (or **http://curator.localhost:3000** locally — add `127.0.0.1 curator.localhost` to `/etc/hosts`). The curator sees the dashboard with no sign-in; the shared key authenticates API requests.
- **Main site:** Submitters use the main URL and sign in with Audius. Optionally set `VITE_ARTIST_USER_ID` so that one Audius user can also open the dashboard from the main site after signing in.

See **SETUP.md** for full Supabase and Vercel deploy steps.

### 3. Install & Run

```bash
npm install
npm run dev
```

This starts both the Vite dev server (port 3000) and the Express API (port 3001).

open https://node1.oap.devnet/
### 4. Build for Production

```bash
npm run build
npm run start   # serve built app
```

### 5. Lint & Test

```bash
npm run lint    # ESLint
npm test        # Vitest
npm run verify  # typecheck + lint + test
```

## Architecture

```
├── src/                    # React frontend
│   ├── pages/              # Landing, Submit, MySubmissions, Dashboard, TrackDetail
│   ├── components/         # Header, Footer, Logo, StatusBadge
│   ├── hooks/              # useAudiusOAuth
│   ├── lib/                # SDK setup, API client, Zustand store
│   └── styles/             # Global CSS theme
├── server/                 # Express API (uses Supabase)
│   └── index.ts            # API routes
├── lib/supabase/           # Supabase client + schema + types
├── api/                    # Vercel serverless (forwards to Express)
└── index.html              # Vite entry
```

## How It Works

1. User authenticates via Audius OAuth (write scope)
2. User selects an audio file and fills in submission metadata
3. Track is uploaded as unlisted to Audius via the SDK
4. Submission record is saved to **Supabase** (PostgreSQL)
5. The curator (identified by `VITE_ARTIST_USER_ID`) can view all submissions
6. Curator updates status and communicates via Audius track comments
7. Submitters see status updates on their dashboard

For **deployment on Vercel**, see **SETUP.md**.
