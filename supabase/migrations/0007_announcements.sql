-- Actualites & Annonces

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  content text,
  image_url text,
  type text not null check (type in ('actualite','annonce','information','examen','activite')),
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on announcements
  for each row execute function set_updated_at();
