-- Storage buckets for lesson media. PUBLIC read (see architecture note in
-- Phase 11 commit): this matches the same soft-gate philosophy already
-- applied to all curriculum tables — the real access control is the
-- app-layer access-code gate, not per-object secrecy. Filenames are
-- randomly generated (never derived from user input), so a public bucket
-- doesn't mean "browsable," only "fetchable if you already have the exact
-- unguessable URL" — the same tradeoff already accepted for lesson text.
-- Only `authenticated` (admin) can write.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('lesson-images', 'lesson-images', true, 5242880,
    array['image/png','image/jpeg','image/gif','image/webp','image/svg+xml']),
  ('lesson-files', 'lesson-files', true, 20971520,
    array['application/pdf','application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation']),
  ('documents', 'documents', true, 20971520, null)
on conflict (id) do nothing;

create policy "lesson_images_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'lesson-images');
create policy "lesson_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'lesson-images');
create policy "lesson_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'lesson-images');

create policy "lesson_files_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'lesson-files');
create policy "lesson_files_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'lesson-files');
create policy "lesson_files_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'lesson-files');

create policy "documents_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');
create policy "documents_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'documents');
create policy "documents_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'documents');
