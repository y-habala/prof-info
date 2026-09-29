-- Timed, code-gated exams. Independent secret_code on top of the platform
-- access session (see architecture doc, Access Code strategy).

create table exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level_id uuid references levels(id) on delete set null,
  duration_minutes int not null,
  secret_code char(4) not null check (secret_code ~ '^[0-9]{4}$'),
  is_active boolean not null default false,
  start_at timestamptz,
  end_at timestamptz,
  max_attempts int not null default 1,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exams_level_id_idx on exams(level_id);
create trigger set_updated_at before update on exams
  for each row execute function set_updated_at();

create table exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in
    ('qcm_single','qcm_multiple','true_false','fill_blank','open')),
  points numeric not null default 1,
  order_index int not null default 0
);
create index exam_questions_exam_id_idx on exam_questions(exam_id);

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
  exam_id uuid not null references exams(id) on delete cascade,
  student_name text not null,
  student_first_name text not null,
  student_class text,
  student_code text,
  score numeric,
  max_score numeric,
  percentage numeric,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  ip_address inet
);
create index exam_attempts_exam_id_idx on exam_attempts(exam_id);

create table exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  question_id uuid not null references exam_questions(id) on delete cascade,
  answer_text text,
  is_correct boolean,
  points_earned numeric
);
create index exam_answers_attempt_id_idx on exam_answers(attempt_id);
create index exam_answers_question_id_idx on exam_answers(question_id);
