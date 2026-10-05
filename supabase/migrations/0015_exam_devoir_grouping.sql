-- The old "devoirs" grouping table (join table + exams.devoir_id) was
-- removed from the application earlier this session in favor of direct
-- per-exam reporting, but the schema itself was deliberately left in place
-- at the time. It is now genuinely superseded: devoir grouping is reborn
-- below as two plain columns directly on exams (no join table, no separate
-- admin CRUD section) — multiple exam "modèles" belong to the same devoir
-- simply by sharing the same level_id + devoir_number + semester.
alter table exams drop column devoir_id;
drop table devoirs;

alter table exams add column devoir_number int;
alter table exams add column semester text check (semester in ('semestre1', 'semestre2'));
