-- Elevated Frequencies: Database Schema
-- Run this in your Supabase SQL Editor to initialize the database.

create table if not exists public.submissions (
  id bigint primary key generated always as identity,
  track_id text not null,
  track_title text not null,
  audius_user_id text not null,
  audius_handle text not null default '',
  artist_name text not null,
  genre text not null default '',
  bpm text default '',
  description text default '',
  release_status text default '',
  location text default '',
  instagram text default '',
  tiktok text default '',
  spotify_url text default '',
  status text not null default 'in_review'
    check (status in ('in_review', 'accepted', 'rejected')),
  artist_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.submissions.track_id is 'Audius track id (unlisted track)';
comment on column public.submissions.audius_user_id is 'Submitting artist Audius user id';

create index if not exists idx_submissions_audius_user_id on public.submissions(audius_user_id);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_submissions_created_at on public.submissions(created_at desc);

-- Internal comments (curator ↔ artist), not Audius track comments
create table if not exists public.submission_comments (
  id bigint primary key generated always as identity,
  submission_id bigint not null references public.submissions(id) on delete cascade,
  user_id text not null,
  user_handle text not null default '',
  user_name text default '',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_submission_comments_submission_id on public.submission_comments(submission_id);

alter table public.submissions enable row level security;
alter table public.submission_comments enable row level security;

create policy "Service role full access to submissions"
  on public.submissions for all to service_role using (true) with check (true);

create policy "Service role full access to submission_comments"
  on public.submission_comments for all to service_role using (true) with check (true);
