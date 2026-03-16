# Elevated Frequencies — Track Submission Portal

Web app for artists to submit tracks for the Elevated Frequencies podcast. Audius OAuth, unlisted track uploads, curator dashboard, and feedback via Audius comments.

## Stack

- **Frontend:** React 19, TypeScript (strict), Vite
- **Backend:** Express (API) + **Supabase** (PostgreSQL)
- **Auth:** Audius OAuth (PKCE, write scope)
- **Upload/Comments:** Audius SDK
- **State:** Zustand (with persist)
- **Styling:** Tailwind CSS v4, CSS Modules, Elevated Frequencies design system (custom properties in `src/styles/global.css`)
- **Deploy:** **Vercel** (static from `dist` + serverless API from `api/`, same pattern as Crate)

## Commands

```bash
npm run dev      # Dev server (Vite :3000 + Express API :3001)
npm run build    # Production build
npm run start    # Run built server (after build)
npm run lint     # ESLint
npm test         # Vitest
npm run verify   # typecheck + lint + test
```

## Code Style

- TypeScript strict — no `any`
- Functional components only
- 2-space indentation
- User-facing strings in a `messages` object at top of components where it helps

## Architecture

- **Client:** `src/` — React app, `@/` alias to `src/`
- **Server:** `server/` — Express API, **Supabase** via `lib/supabase/server.ts` (service role)
- **DB schema:** `lib/supabase/schema.sql` (run in Supabase SQL Editor)
- **Env:** `.env` from `.env.example` — `VITE_*` for client, `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for API, `PORT` for local server
- **Submission flow:** Sign in (Audius OAuth) → upload (unlisted track) → metadata + message → status (Queued → In Review → Listened → Chosen/Passed), feedback via Audius comments

## Things You Must Not Do

- Do not commit `.env` or hardcode API keys
- Do not change submission status semantics without updating both client and server

## Common Gotchas

- Dev runs two processes: Vite (client) and Express (API). API is proxied at `/api` in dev.
- Run `lib/supabase/schema.sql` in Supabase SQL Editor before using the API.
- On Vercel, `/api/*` is handled by `api/[[...path]].ts` (Express app built to `dist-server/`).
- Audius unlisted tracks use numeric `entityId` (base36 decode of track id) for comments.

## Workflow

1. Read this file at session start.
2. After features or fixes, run `npm run verify` (typecheck, lint, test).
