-- ============================================================================
-- Plateforme Informatique — reset DB and rebuild from v2 schema
-- ============================================================================
--
-- HOW TO USE:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste the ENTIRE contents of this file
--   3. Click "Run"
--
-- This will:
--   • Drop everything in the `public` schema (ALL v1 data is lost — this is
--     intentional, see REBUILD v2 plan)
--   • Recreate `public` schema fresh
--   • Apply the v2 schema (same as supabase/migrations/0001_v2_schema.sql)
--   • Re-create the `_migrations` tracking table so scripts/migrate.mjs
--     thinks the v2 migration is already applied (prevents double-apply)
--
-- Running this a second time is a no-op in effect (same reset + rebuild).
-- ============================================================================

drop schema public cascade;
create schema public;
grant all on schema public to postgres;
grant all on schema public to anon, authenticated, service_role;

-- Default privileges — any table created from here on grants the right
-- access to Supabase's three default roles. Without these, service_role
-- (even though it bypasses RLS) still gets "permission denied" at the
-- Postgres level on tables it didn't itself create.
alter default privileges in schema public grant all on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;

-- shared helpers -------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- content hierarchy ----------------------------------------------------------
create table levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on levels for each row execute function set_updated_at();

create table units (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references levels(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index units_level_id_idx on units(level_id);
create trigger set_updated_at before update on units for each row execute function set_updated_at();

create table sequences (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sequences_unit_id_idx on sequences(unit_id);
create trigger set_updated_at before update on sequences for each row execute function set_updated_at();

create table sessions (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references sequences(id) on delete cascade,
  title text not null,
  duration_minutes int,
  content_markdown text not null default '',
  order_index int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sessions_sequence_id_idx on sessions(sequence_id);
create trigger set_updated_at before update on sessions for each row execute function set_updated_at();

-- exercises (self-check, no DB attempt tracking) -----------------------------
create table exercises (
  id uuid primary key default gen_random_uuid(),
  level_id uuid references levels(id) on delete set null,
  title text not null,
  order_index int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exercises_level_id_idx on exercises(level_id);
create trigger set_updated_at before update on exercises for each row execute function set_updated_at();

create table exercise_questions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('qcm_single','qcm_multiple','true_false','fill_blank','matching')),
  points numeric not null default 1,
  order_index int not null default 0
);
create index exercise_questions_exercise_id_idx on exercise_questions(exercise_id);

create table exercise_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references exercise_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_index int not null default 0
);
create index exercise_options_question_id_idx on exercise_options(question_id);

-- exams (parent + models A/B/C/D children) -----------------------------------
create table exams (
  id uuid primary key default gen_random_uuid(),
  level_id uuid references levels(id) on delete set null,
  title text not null,
  duration_minutes int not null default 60,
  start_at timestamptz,
  end_at timestamptz,
  max_attempts int not null default 1,
  is_published boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exams_level_id_idx on exams(level_id);
create trigger set_updated_at before update on exams for each row execute function set_updated_at();

create table exam_models (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  label text not null,
  secret_code char(4) not null unique check (secret_code ~ '^[0-9]{4}$'),
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, label)
);
create index exam_models_exam_id_idx on exam_models(exam_id);
create index exam_models_secret_code_idx on exam_models(secret_code);
create trigger set_updated_at before update on exam_models for each row execute function set_updated_at();

create table exam_sections (
  id uuid primary key default gen_random_uuid(),
  exam_model_id uuid not null references exam_models(id) on delete cascade,
  title text not null,
  image_url text,
  order_index int not null default 0
);
create index exam_sections_model_id_idx on exam_sections(exam_model_id);

create table exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_model_id uuid not null references exam_models(id) on delete cascade,
  section_id uuid references exam_sections(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('qcm_single','qcm_multiple','true_false','fill_blank','matching')),
  points numeric not null default 1,
  order_index int not null default 0
);
create index exam_questions_model_id_idx on exam_questions(exam_model_id);
create index exam_questions_section_id_idx on exam_questions(section_id);

create table exam_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references exam_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_index int not null default 0
);
create index exam_options_question_id_idx on exam_options(question_id);

create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_model_id uuid not null references exam_models(id) on delete cascade,
  student_name text not null,
  student_first_name text not null,
  student_class text,
  student_number text,
  score numeric,
  max_score numeric,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  ip_address inet
);
create index exam_attempts_model_id_idx on exam_attempts(exam_model_id);
create index exam_attempts_submitted_idx on exam_attempts(submitted_at) where submitted_at is not null;

create table exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  question_id uuid not null references exam_questions(id) on delete cascade,
  answer_text text,
  is_correct boolean,
  points_earned numeric
);
create index exam_answers_attempt_id_idx on exam_answers(attempt_id);

-- platform access ------------------------------------------------------------
create table access_codes (
  id uuid primary key default gen_random_uuid(),
  code char(4) not null unique check (code ~ '^[0-9]{4}$'),
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on access_codes for each row execute function set_updated_at();

create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on settings for each row execute function set_updated_at();

insert into settings (key, value) values
  ('teacher_name',  'Mr. Habala'),
  ('institution',   'Collège Ibn Battouta'),
  ('academie',      'Marrakech – Safi'),
  ('direction',     'Province de Kelâa des Sraghna');

-- RLS -----------------------------------------------------------------------
alter table levels              enable row level security;
alter table units               enable row level security;
alter table sequences           enable row level security;
alter table sessions            enable row level security;
alter table exercises           enable row level security;
alter table exercise_questions  enable row level security;
alter table exercise_options    enable row level security;
alter table exams               enable row level security;
alter table exam_models         enable row level security;
alter table exam_sections       enable row level security;
alter table exam_questions      enable row level security;
alter table exam_options        enable row level security;
alter table exam_attempts       enable row level security;
alter table exam_answers        enable row level security;
alter table access_codes        enable row level security;
alter table settings            enable row level security;

create policy "levels_public_read"             on levels              for select to anon, authenticated using (is_active = true);
create policy "levels_admin_all"               on levels              for all    to authenticated using (true) with check (true);
create policy "units_public_read"              on units               for select to anon, authenticated using (is_published = true);
create policy "units_admin_all"                on units               for all    to authenticated using (true) with check (true);
create policy "sequences_public_read"          on sequences           for select to anon, authenticated using (is_published = true);
create policy "sequences_admin_all"            on sequences           for all    to authenticated using (true) with check (true);
create policy "sessions_public_read"           on sessions            for select to anon, authenticated using (is_published = true);
create policy "sessions_admin_all"             on sessions            for all    to authenticated using (true) with check (true);
create policy "exercises_public_read"          on exercises           for select to anon, authenticated using (is_published = true);
create policy "exercises_admin_all"            on exercises           for all    to authenticated using (true) with check (true);
create policy "exercise_questions_public_read" on exercise_questions  for select to anon, authenticated using (
  exists (select 1 from exercises e where e.id = exercise_questions.exercise_id and e.is_published = true)
);
create policy "exercise_questions_admin_all"   on exercise_questions  for all    to authenticated using (true) with check (true);
create policy "exercise_options_public_read"   on exercise_options    for select to anon, authenticated using (
  exists (
    select 1 from exercise_questions q
    join exercises e on e.id = q.exercise_id
    where q.id = exercise_options.question_id and e.is_published = true
  )
);
create policy "exercise_options_admin_all"     on exercise_options    for all    to authenticated using (true) with check (true);

create policy "exams_admin_all"           on exams           for all to authenticated using (true) with check (true);
create policy "exam_models_admin_all"     on exam_models     for all to authenticated using (true) with check (true);
create policy "exam_sections_admin_all"   on exam_sections   for all to authenticated using (true) with check (true);
create policy "exam_questions_admin_all"  on exam_questions  for all to authenticated using (true) with check (true);
create policy "exam_options_admin_all"    on exam_options    for all to authenticated using (true) with check (true);
create policy "exam_attempts_admin_all"   on exam_attempts   for all to authenticated using (true) with check (true);
create policy "exam_answers_admin_all"    on exam_answers    for all to authenticated using (true) with check (true);

create policy "access_codes_admin_all" on access_codes for all to authenticated using (true) with check (true);
create policy "settings_public_read"   on settings     for select to anon, authenticated using (true);
create policy "settings_admin_all"     on settings     for all    to authenticated using (true) with check (true);

-- polymorphic session content blocks (from 0002_lesson_blocks.sql)
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
create policy "lesson_blocks_public_read" on lesson_blocks for select to anon, authenticated using (
  is_published = true
  and exists (select 1 from sessions s where s.id = lesson_blocks.session_id and s.is_published = true)
);
create policy "lesson_blocks_admin_all" on lesson_blocks for all to authenticated using (true) with check (true);

-- migration tracker (so scripts/migrate.mjs considers these as already applied)
create table _migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);
insert into _migrations (filename) values ('0001_v2_schema.sql'), ('0002_lesson_blocks.sql');

-- Seed one access code so the student side is immediately testable.
-- Admin should change/rotate it from /admin/access-codes.
insert into access_codes (code, label) values ('2026', 'Démo');
