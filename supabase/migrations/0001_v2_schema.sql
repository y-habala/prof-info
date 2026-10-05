-- Plateforme Informatique v2 — fresh schema (2026-10-05)
--
-- Clean rewrite after v1 (15+ migrations, 20+ tables, accumulated complexity).
-- Scope reductions explicitly made:
--   • No `description` columns anywhere (noise, rarely filled)
--   • No `announcements` table (feature dropped)
--   • No `html_pages` table (feature dropped)
--   • No `lesson_contents` polymorphic blocks — replaced by a single
--     `sessions.content_markdown` text column (admin writes markdown)
--   • No `devoirs`/`devoir_id` — replaced by `exams` ↔ `exam_models` parent/child
--   • No `access_attempts` rate-limit table (in-memory limiter in src/lib)
--   • No `access_codes.expires_at` (is_active toggle sufficient at this scale)
--   • `exercise_attempts`/`exercise_answers` dropped (exercises are self-check,
--     client-only — the server no longer tracks any attempt data for them)
--
-- Everything a user already approved in v1 (JWT access cookie, Supabase Auth
-- admin, service-role for sensitive reads, RLS as hard gate, 4-digit secret
-- codes) remains the same architectural approach; only the DATA shape changes.

-- =========================================================================
-- shared helpers
-- =========================================================================

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- Content hierarchy: Level → Unit → Sequence → Session
-- =========================================================================

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

-- =========================================================================
-- Exercises (self-check, student-only — no attempt tracking in DB)
-- =========================================================================

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

-- =========================================================================
-- Exams: parent (= the test) + models (= variants A/B/C/D)
-- Students in the same class take different models; results aggregate under
-- the parent exam.
-- =========================================================================

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
  label text not null,                                    -- "A", "B", "C", "D"...
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

-- =========================================================================
-- Platform access
-- =========================================================================

create table access_codes (
  id uuid primary key default gen_random_uuid(),
  code char(4) not null unique check (code ~ '^[0-9]{4}$'),
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on access_codes for each row execute function set_updated_at();

-- =========================================================================
-- Settings (key-value, replaces hardcoded teacher/school constants)
-- =========================================================================

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
  ('direction',     'Province de Kelâa des Sraghna')
on conflict (key) do nothing;

-- =========================================================================
-- Row Level Security
-- =========================================================================
--
-- Published content: readable by anon, writeable by authenticated (admin).
-- Everything else (secrets, attempts, codes): zero anon access; the server
-- uses the service role key when it needs to touch these on behalf of a
-- gated student request.

-- published content
alter table levels              enable row level security;
alter table units               enable row level security;
alter table sequences           enable row level security;
alter table sessions            enable row level security;
alter table exercises           enable row level security;
alter table exercise_questions  enable row level security;
alter table exercise_options    enable row level security;

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

-- IMPORTANT: anon CAN read exercise_options including `is_correct` because
-- exercises are self-check (student sees correction immediately after
-- answering). This is intentional and different from exam options below,
-- which are strictly admin-only.
create policy "exercise_options_public_read"   on exercise_options    for select to anon, authenticated using (
  exists (
    select 1 from exercise_questions q
    join exercises e on e.id = q.exercise_id
    where q.id = exercise_options.question_id and e.is_published = true
  )
);
create policy "exercise_options_admin_all"     on exercise_options    for all    to authenticated using (true) with check (true);

-- exam-related (admin-only via RLS; server uses service role for student flows)
alter table exams          enable row level security;
alter table exam_models    enable row level security;
alter table exam_sections  enable row level security;
alter table exam_questions enable row level security;
alter table exam_options   enable row level security;
alter table exam_attempts  enable row level security;
alter table exam_answers   enable row level security;

create policy "exams_admin_all"           on exams           for all to authenticated using (true) with check (true);
create policy "exam_models_admin_all"     on exam_models     for all to authenticated using (true) with check (true);
create policy "exam_sections_admin_all"   on exam_sections   for all to authenticated using (true) with check (true);
create policy "exam_questions_admin_all"  on exam_questions  for all to authenticated using (true) with check (true);
create policy "exam_options_admin_all"    on exam_options    for all to authenticated using (true) with check (true);
create policy "exam_attempts_admin_all"   on exam_attempts   for all to authenticated using (true) with check (true);
create policy "exam_answers_admin_all"    on exam_answers    for all to authenticated using (true) with check (true);

-- platform access
alter table access_codes enable row level security;
alter table settings     enable row level security;
create policy "access_codes_admin_all" on access_codes for all to authenticated using (true) with check (true);
-- settings: anon can READ (settings are rendered into student pages too — e.g.
-- the school name in the header), only admin can write.
create policy "settings_public_read"   on settings     for select to anon, authenticated using (true);
create policy "settings_admin_all"     on settings     for all    to authenticated using (true) with check (true);
