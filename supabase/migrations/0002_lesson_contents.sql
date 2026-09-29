-- Content blocks within a Seance. `content` shape depends on `type`:
--   text        -> { "text": string }
--   image       -> { "url": string, "caption"?: string }
--   video       -> { "youtube_url"?: string, "video_url"?: string }
--   pdf/file    -> { "file_url": string, "file_name": string }
--   exercise    -> { "exercise_id": uuid }
--   interactive -> { "html_page_id": uuid }
--   html        -> { "html_page_id": uuid }

create table lesson_contents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  type text not null check (type in ('text','image','video','pdf','file','exercise','interactive','html')),
  title text,
  content jsonb not null default '{}',
  order_index int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_contents_session_id_idx on lesson_contents(session_id);
create trigger set_updated_at before update on lesson_contents
  for each row execute function set_updated_at();
