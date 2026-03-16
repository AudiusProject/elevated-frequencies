-- Run this only if you have an existing database created with the old schema.
-- New projects: use schema.sql only.

-- Map old statuses to new: queued/listened -> in_review, chosen -> accepted, passed -> rejected
update public.submissions set status = 'in_review' where status in ('queued', 'listened');
update public.submissions set status = 'accepted' where status = 'chosen';
update public.submissions set status = 'rejected' where status = 'passed';

alter table public.submissions drop constraint if exists submissions_status_check;
alter table public.submissions add constraint submissions_status_check
  check (status in ('in_review', 'accepted', 'rejected'));
alter table public.submissions alter column status set default 'in_review';

-- Optional: drop moods column
alter table public.submissions drop column if exists moods;

-- Add internal comments table
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
alter table public.submission_comments enable row level security;
create policy "Service role full access to submission_comments"
  on public.submission_comments for all to service_role using (true) with check (true);
