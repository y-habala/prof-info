-- Groups exam_questions into named "Exercice N" blocks, each optionally
-- carrying one shared image (e.g. a diagram several matching questions
-- refer to). Nullable section_id keeps existing flat exams (e.g. "Quiz
-- Algorithmique") working untouched, unsectioned.
create table exam_sections (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);

create index exam_sections_exam_id_idx on exam_sections(exam_id);

alter table exam_questions add column section_id uuid references exam_sections(id) on delete set null;
create index exam_questions_section_id_idx on exam_questions(section_id);

-- Same zero-anon-access shape as every other admin-only table (see exams,
-- devoirs in 0008/0011).
alter table exam_sections enable row level security;
create policy "exam_sections_admin_all" on exam_sections
  for all to authenticated using (true) with check (true);
