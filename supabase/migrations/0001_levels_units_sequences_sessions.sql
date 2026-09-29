-- Curriculum hierarchy: Niveau -> Unite -> Sequence -> Seance

create table levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on levels
  for each row execute function set_updated_at();

create table units (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references levels(id) on delete cascade,
  title text not null,
  description text,
  order_index int not null default 0,
  image_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index units_level_id_idx on units(level_id);
create trigger set_updated_at before update on units
  for each row execute function set_updated_at();

create table sequences (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  title text not null,
  description text,
  order_index int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sequences_unit_id_idx on sequences(unit_id);
create trigger set_updated_at before update on sequences
  for each row execute function set_updated_at();

create table sessions (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references sequences(id) on delete cascade,
  title text not null,
  description text,
  duration_minutes int,
  order_index int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sessions_sequence_id_idx on sessions(sequence_id);
create trigger set_updated_at before update on sessions
  for each row execute function set_updated_at();
