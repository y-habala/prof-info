-- Groups multiple exam "modèles" (separate secret codes, same questions'
-- spirit, used to deter copying) under one devoir, so the admin can run a
-- single class-level report across all of them. Nullable FK on exams keeps
-- existing exams valid without a migration of historical data.
create table devoirs (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references levels(id) on delete cascade,
  title text not null,
  session text not null check (session in ('semestre1', 'semestre2')),
  created_at timestamptz not null default now()
);

alter table exams add column devoir_id uuid references devoirs(id) on delete set null;

-- Same zero-anon-access shape as exams itself (see 0008_rls_policies.sql).
alter table devoirs enable row level security;
create policy "devoirs_admin_all" on devoirs
  for all to authenticated using (true) with check (true);
