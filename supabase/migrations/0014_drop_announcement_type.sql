-- The "type" categorization (Actualité/Annonce/Information/Examen/Activité)
-- is no longer used anywhere in the app (public filter+badges and admin
-- field both removed) — drop it. Postgres cascades the drop to
-- announcements_type_idx (Phase 22) automatically.
alter table announcements drop column type;
