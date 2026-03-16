# Elevated Frequencies — Setup & Deploy

> Track submission portal for the Elevated Frequencies podcast. Same backend and deploy pattern as [Crate](https://github.com/your-org/crate): **Supabase** (PostgreSQL) + **Vercel**.

---

## Quick Start

### Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) project (free tier works)
- [Vercel](https://vercel.com) account (for deployment)
- Audius developer app ([api.audius.co/plans](https://api.audius.co/plans))

### 1. Clone & Install

```bash
git clone <repo-url> elevated-frequencies
cd elevated-frequencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run **`lib/supabase/schema.sql`** (creates `submissions` table and RLS).
3. Go to **Settings → API** and note:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure Environment

Copy env and fill in values:

```bash
cp .env.example .env
```

Edit `.env`:

- **Audius:** `VITE_AUDIUS_API_KEY`, `VITE_AUDIUS_BEARER_TOKEN`, `VITE_ARTIST_USER_ID` (curator’s Audius user id).
- **Supabase:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Local server:** `PORT=3001` (optional; default 3001).

### 4. Run Locally

```bash
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001) (Vite proxies `/api` to 3001 in dev)

### 5. Build & Run (production-like)

```bash
npm run build
npm run start
```

Serves built frontend and API (e.g. from a single Node process when not on Vercel).

---

## Deployment (Vercel)

Same pattern as Crate: one Vercel project, static frontend + serverless API.

### First-time setup

1. **Import** the repo in [Vercel](https://vercel.com) (e.g. “Import Git Repository”).
2. **Build settings** (usually auto-detected):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. **Environment variables** (Vercel → Project → Settings → Environment Variables):

   | Variable | Required | Description |
   | -------- | -------- | ----------- |
   | `VITE_AUDIUS_API_KEY` | Yes | Audius API key |
   | `VITE_AUDIUS_BEARER_TOKEN` | Yes | Audius bearer token |
   | `VITE_ARTIST_USER_ID` | Optional | Curator Audius user id (if using main-site dashboard) |
   | `VITE_CURATOR_SUBDOMAIN` | Optional | Subdomain for curator app (default `curator`) |
   | `VITE_CURATOR_KEY` | For curator subdomain | Same secret as `CURATOR_KEY` (any string) |
   | `CURATOR_KEY` | For curator subdomain | Same secret as `VITE_CURATOR_KEY` |
   | `SUPABASE_URL` | Yes | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (secret) |

   Add for **Production**, **Preview**, and **Development** as needed.

4. **Deploy** (push to main or click “Deploy” in the dashboard). Your app will live at `your-project.vercel.app` (or your custom domain).

5. **Curator subdomain (optional):** To use `curator.yourdomain.com`:
   - In Vercel → Project → Settings → Domains, add your main domain (e.g. `elevatedfrequencies.com`) and the subdomain `curator.elevatedfrequencies.com`.
   - Vercel will show the DNS records to add (usually a CNAME for `curator` → `cname.vercel-dns.com`). Add them at your DNS provider.
   - Once DNS propagates, open `https://curator.yourdomain.com` for the no-login curator dashboard.

### How it works on Vercel

- **Static:** Vite build output in `dist/` is served as the site.
- **API:** Requests to `/api/*` are handled by the serverless function in `api/[[...path]].ts`, which runs the same Express app (built to `dist-server/`) so all existing routes (`/api/auth/verify`, `/api/submissions`, etc.) work unchanged.

### After changing env vars

Redeploy so new values are applied (and for `VITE_*`, so they’re inlined into the client build).

---

## Architecture

| Layer        | Technology |
| ------------ | ---------- |
| Frontend     | React 19, Vite, TypeScript |
| Backend API  | Express (Node) |
| Database     | Supabase (PostgreSQL) |
| Auth         | Audius OAuth (client); API uses Bearer `userId:handle` |
| Deploy       | Vercel (static + serverless API) |

- **DB:** Single `submissions` table; RLS allows service role full access; app enforces “current user” and “artist only” in API code.
- **No Supabase Auth** for submitters; identity is Audius user id from OAuth.

---

## Commands

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server (Vite + Express) |
| `npm run build` | Build frontend + server |
| `npm run start` | Run built server (Node) |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run verify` | typecheck + lint + test |
