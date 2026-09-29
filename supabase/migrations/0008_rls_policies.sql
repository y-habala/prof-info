-- RLS strategy (see architecture doc §8): curriculum content is readable by
-- anon once published (the real access gate is the app-layer access-code
-- session, not RLS); anything that can reveal correct answers or secrets
-- (question options, exam/exercise metadata that isn't curriculum-level,
-- access codes, exam secret codes, attempts/answers) has ZERO anon grants
-- and is mediated exclusively by server-only service-role code.
--
-- `authenticated` = admin in this app (single-teacher V1, no roles table —
-- see architecture doc §6). Public sign-up must be disabled in the Supabase
-- Auth dashboard for this assumption to hold; that's a project setting, not
-- something this migration can do.

-- ── Curriculum: public read when published, admin full access ─────────────

alter table levels enable row level security;
create policy "levels_public_read" on levels
  for select to anon, authenticated using (is_active = true);
create policy "levels_admin_all" on levels
  for all to authenticated using (true) with check (true);

alter table units enable row level security;
create policy "units_public_read" on units
  for select to anon, authenticated using (is_published = true);
create policy "units_admin_all" on units
  for all to authenticated using (true) with check (true);

alter table sequences enable row level security;
create policy "sequences_public_read" on sequences
  for select to anon, authenticated using (is_published = true);
create policy "sequences_admin_all" on sequences
  for all to authenticated using (true) with check (true);

alter table sessions enable row level security;
create policy "sessions_public_read" on sessions
  for select to anon, authenticated using (is_published = true);
create policy "sessions_admin_all" on sessions
  for all to authenticated using (true) with check (true);

alter table lesson_contents enable row level security;
create policy "lesson_contents_public_read" on lesson_contents
  for select to anon, authenticated using (is_published = true);
create policy "lesson_contents_admin_all" on lesson_contents
  for all to authenticated using (true) with check (true);

alter table html_pages enable row level security;
create policy "html_pages_public_read" on html_pages
  for select to anon, authenticated using (is_published = true);
create policy "html_pages_admin_all" on html_pages
  for all to authenticated using (true) with check (true);

alter table announcements enable row level security;
create policy "announcements_public_read" on announcements
  for select to anon, authenticated using (is_published = true);
create policy "announcements_admin_all" on announcements
  for all to authenticated using (true) with check (true);

-- Exercise metadata only (title/description/duration) — no answers here.
alter table exercises enable row level security;
create policy "exercises_public_read" on exercises
  for select to anon, authenticated using (is_published = true);
create policy "exercises_admin_all" on exercises
  for all to authenticated using (true) with check (true);

-- ── Zero anon access: questions/options can reveal correct answers ────────
-- Read during an active attempt is mediated server-side (service role),
-- which strips is_correct/explanation before sending anything to the client.

alter table exercise_questions enable row level security;
create policy "exercise_questions_admin_all" on exercise_questions
  for all to authenticated using (true) with check (true);

alter table exercise_options enable row level security;
create policy "exercise_options_admin_all" on exercise_options
  for all to authenticated using (true) with check (true);

alter table exam_questions enable row level security;
create policy "exam_questions_admin_all" on exam_questions
  for all to authenticated using (true) with check (true);

alter table exam_options enable row level security;
create policy "exam_options_admin_all" on exam_options
  for all to authenticated using (true) with check (true);

-- ── Zero anon access: exams carry secret_code, never exposed via RLS ──────

alter table exams enable row level security;
create policy "exams_admin_all" on exams
  for all to authenticated using (true) with check (true);

-- ── Zero anon access: access codes are admin-only, verified via service role ─

alter table access_codes enable row level security;
create policy "access_codes_admin_all" on access_codes
  for all to authenticated using (true) with check (true);

alter table access_attempts enable row level security;
create policy "access_attempts_admin_read" on access_attempts
  for select to authenticated using (true);
-- No insert/update/delete policy for anyone: only the service-role client
-- (which bypasses RLS) writes rate-limit log rows.

-- ── Private results: readable/deletable by admin only, never by anon ──────

alter table exercise_attempts enable row level security;
create policy "exercise_attempts_admin_read" on exercise_attempts
  for select to authenticated using (true);
create policy "exercise_attempts_admin_delete" on exercise_attempts
  for delete to authenticated using (true);

alter table exercise_answers enable row level security;
create policy "exercise_answers_admin_read" on exercise_answers
  for select to authenticated using (true);
create policy "exercise_answers_admin_delete" on exercise_answers
  for delete to authenticated using (true);

alter table exam_attempts enable row level security;
create policy "exam_attempts_admin_read" on exam_attempts
  for select to authenticated using (true);
create policy "exam_attempts_admin_delete" on exam_attempts
  for delete to authenticated using (true);

alter table exam_answers enable row level security;
create policy "exam_answers_admin_read" on exam_answers
  for select to authenticated using (true);
create policy "exam_answers_admin_delete" on exam_answers
  for delete to authenticated using (true);
