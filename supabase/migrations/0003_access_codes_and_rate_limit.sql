-- Platform access codes (student gate) + a failed-attempt log used for rate limiting.

create table access_codes (
  id uuid primary key default gen_random_uuid(),
  code char(4) not null unique check (code ~ '^[0-9]{4}$'),
  label text,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on access_codes
  for each row execute function set_updated_at();

create table access_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_address inet not null,
  code_attempted char(4),
  scope text not null check (scope in ('platform','exam')),
  success boolean not null,
  created_at timestamptz not null default now()
);
create index access_attempts_ip_scope_created_idx on access_attempts(ip_address, scope, created_at);
create index access_attempts_code_scope_created_idx on access_attempts(code_attempted, scope, created_at);
