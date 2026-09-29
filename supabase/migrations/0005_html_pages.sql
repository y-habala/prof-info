-- Admin-authored interactive HTML/CSS/JS activities, rendered in a sandboxed iframe.

create table html_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  slug text not null unique,
  level_id uuid references levels(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  sequence_id uuid references sequences(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  html_content text not null default '',
  css_content text not null default '',
  javascript_content text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index html_pages_level_id_idx on html_pages(level_id);
create index html_pages_unit_id_idx on html_pages(unit_id);
create index html_pages_sequence_id_idx on html_pages(sequence_id);
create index html_pages_session_id_idx on html_pages(session_id);
create trigger set_updated_at before update on html_pages
  for each row execute function set_updated_at();
