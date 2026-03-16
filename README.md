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

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Express + better-sqlite3
- **Auth:** Audius OAuth (PKCE with write scope)
- **Upload:** Audius SDK (`tracks.uploadTrack`)
- **Comments:** Audius SDK (`comments.postComment`)
- **State:** Zustand with persist
- **Styling:** CSS Modules with Elevated Frequencies design system

### Unlisted tracks

Submitted tracks are uploaded as **unlisted** on Audius. The API allows fetching and streaming unlisted tracks by track id. Comment posting uses a numeric `entityId` derived from the string track id (base36 decode).

## Setup

### 1. Prerequisites

- Node.js 18+
- An Audius developer app (get API key at [api.audius.co/plans](https://api.audius.co/plans))

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
VITE_AUDIUS_API_KEY=your_api_key
VITE_AUDIUS_API_SECRET=your_api_secret
VITE_ARTIST_USER_ID=olivias_audius_user_id
PORT=3001
```

### 3. Install & Run

```bash
npm install
npm run dev
```

This starts both the Vite dev server (port 3000) and the Express API (port 3001).

### 4. Build for Production

```bash
npm run build
```

## Architecture

```
├── src/                    # React frontend
│   ├── pages/              # Landing, Submit, MySubmissions, Dashboard, TrackDetail
│   ├── components/         # Header, Footer, Logo, StatusBadge
│   ├── hooks/              # useAudiusOAuth
│   ├── lib/                # SDK setup, API client, Zustand store
│   └── styles/             # Global CSS theme
├── server/                 # Express backend
│   ├── index.ts            # API routes
│   └── db.ts               # SQLite schema
└── index.html              # Vite entry
```

## How It Works

1. User authenticates via Audius OAuth (write scope)
2. User selects an audio file and fills in submission metadata
3. Track is uploaded privately to Audius via the SDK
4. Submission record is saved to the local SQLite database
5. The curator (identified by `VITE_ARTIST_USER_ID`) can view all submissions
6. Curator updates status and communicates via Audius track comments
7. Submitters see real-time status updates on their dashboard
