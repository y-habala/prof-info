-- Contrôle continu (Massar). One row per Massar "notes CC" export, i.e. one
-- class × one semester × one school year, plus one row per student with the
-- four Massar columns (3 contrôles + activités intégrées), each a grade and
-- an absence mark. The original file is kept so the export back to Massar
-- rewrites exactly the workbook Massar produced (hidden IDs, protection…).

create table cc_sheets (
  id uuid primary key default gen_random_uuid(),
  school_year text not null,
  level_label text not null,
  class_name text not null,
  session_code text not null,
  session_label text not null,
  teacher text,
  establishment text,
  massar_meta jsonb not null default '{}',
  source_file_name text not null,
  source_file_b64 text not null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_year, class_name, session_code)
);

create table cc_students (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references cc_sheets(id) on delete cascade,
  row_number int not null,
  massar_id text,
  student_code text not null,
  full_name text not null,
  birth_date text,
  note1 numeric(4,2) check (note1 between 0 and 20),
  note2 numeric(4,2) check (note2 between 0 and 20),
  note3 numeric(4,2) check (note3 between 0 and 20),
  note4 numeric(4,2) check (note4 between 0 and 20),
  abs1 text,
  abs2 text,
  abs3 text,
  abs4 text,
  updated_at timestamptz not null default now(),
  unique (sheet_id, student_code)
);

create index cc_students_sheet_id_idx on cc_students(sheet_id);

create trigger set_updated_at before update on cc_sheets
  for each row execute function set_updated_at();
create trigger set_updated_at before update on cc_students
  for each row execute function set_updated_at();

-- Student names, birth dates and grades: admin only, never anon.
alter table cc_sheets enable row level security;
alter table cc_students enable row level security;
create policy "cc_sheets_admin_all" on cc_sheets for all to authenticated using (true) with check (true);
create policy "cc_students_admin_all" on cc_students for all to authenticated using (true) with check (true);
