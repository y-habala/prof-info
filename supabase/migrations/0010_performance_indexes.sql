-- A few lookup/filter columns that never got an index when their table was
-- created, unlike their siblings (exercises/html_pages/exams all indexed
-- level_id from the start; announcements never got type or is_published
-- since it wasn't filterable until Phase 20 added the type filter).

-- Hot path: every /api/exam/verify call looks up by secret_code, including
-- failed/rate-limited attempts.
create index exams_secret_code_idx on exams(secret_code);

create index announcements_type_idx on announcements(type);

-- Matches the actual public query shape exactly:
-- .eq('is_published', true).order('published_at', {ascending: false})
create index announcements_published_idx on announcements(is_published, published_at desc);
