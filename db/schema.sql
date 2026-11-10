-- The Wellness Ascent — Supabase / PostgreSQL schema
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.submissions (
  id          uuid primary key,
  reference   text unique not null,
  collection  text not null check (collection in ('appointments', 'contact', 'testimonials', 'audit')),
  status      text not null default 'pending',
  created_at  timestamptz not null default now(),
  payload     jsonb not null          -- AES-256-GCM encrypted by the app when DATA_KEY is set
);

create index if not exists submissions_collection_created_idx
  on public.submissions (collection, created_at desc);

-- Lock the table down: Row Level Security on, with NO policies.
-- The public "anon" key can neither read nor write; only the server's
-- service-role key (kept secret in Vercel env vars) can access it.
alter table public.submissions enable row level security;
