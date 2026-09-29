-- Interactive practice exercises (ungraded-stakes). level/unit/sequence/session
-- are all nullable: an exercise can stand alone or be attached anywhere in the
-- curriculum tree; denormalized on purpose to allow filtering without joins.

create table exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level_id uuid references levels(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  sequence_id uuid references sequences(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  duration_minutes int,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exercises_level_id_idx on exercises(level_id);
create index exercises_unit_id_idx on exercises(unit_id);
create index exercises_sequence_id_idx on exercises(sequence_id);
create index exercises_session_id_idx on exercises(session_id);
create trigger set_updated_at before update on exercises
  for each row execute function set_updated_at();

create table exercise_questions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in
    ('qcm_single','qcm_multiple','true_false','fill_blank','matching','ordering','open')),
  points numeric not null default 1,
  order_index int not null default 0,
  image_url text,
  explanation text
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

create table exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  student_name text not null,
  student_first_name text not null,
  student_class text,
  score numeric,
  max_score numeric,
  percentage numeric,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index exercise_attempts_exercise_id_idx on exercise_attempts(exercise_id);

create table exercise_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exercise_attempts(id) on delete cascade,
  question_id uuid not null references exercise_questions(id) on delete cascade,
  answer_text text,
  is_correct boolean,
  points_earned numeric
);
create index exercise_answers_attempt_id_idx on exercise_answers(attempt_id);
create index exercise_answers_question_id_idx on exercise_answers(question_id);
