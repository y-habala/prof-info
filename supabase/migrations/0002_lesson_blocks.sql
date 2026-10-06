-- Polymorphic blocks for session content. The admin assembles a session
-- out of ordered blocks of different types instead of writing one big
-- markdown document. Exercises and interactive activities become
-- block types instead of top-level standalone entities.
--
-- Non-destructive: sessions.content_markdown stays (legacy; not read by
-- v2.1 code, but kept in case the admin had anything there).

create table lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  type text not null check (type in ('text','image','video','file','exercise','interactive')),
  title text,
  content jsonb not null default '{}',
  order_index int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_blocks_session_id_idx on lesson_blocks(session_id);
create trigger set_updated_at before update on lesson_blocks for each row execute function set_updated_at();

alter table lesson_blocks enable row level security;

-- Publicly readable if both the block itself and its parent session are
-- published. Pre-computed exists() avoids the "orphaned published block"
-- edge case where a session is unpublished but its blocks still return.
create policy "lesson_blocks_public_read"
  on lesson_blocks
  for select
  to anon, authenticated
  using (
    is_published = true
    and exists (
      select 1 from sessions s
      where s.id = lesson_blocks.session_id
        and s.is_published = true
    )
  );

create policy "lesson_blocks_admin_all"
  on lesson_blocks
  for all
  to authenticated
  using (true)
  with check (true);

-- Interactive block content shape:
--   { "html": "...", "css": "...", "js": "..." }
-- Exercise block content shape:
--   { "exercise_id": "<uuid>" }
-- Text block content shape:
--   { "markdown": "..." }
-- Image / Video / File block content shapes:
--   { "url": "...", "caption": "..." (optional) }
--   { "youtube_url": "..." } or { "video_url": "..." }
--   { "url": "...", "file_name": "..." }
-- All kept in jsonb — one row per block, admin cost is one small insert
-- per block, student cost is one query per session (list by session_id).
