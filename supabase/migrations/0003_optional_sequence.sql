-- A séance no longer has to sit inside a séquence. Some units are taught as
-- unité → séance directly, so a session now points at its unit, and the
-- séquence becomes an optional grouping in between.

-- Nullable at first so the backfill below can run.
alter table sessions add column unit_id uuid references units(id) on delete cascade;

-- Every existing session reaches its unit through its sequence, and
-- sequence_id is still NOT NULL at this point, so this covers every row.
update sessions s
   set unit_id = q.unit_id
  from sequences q
 where q.id = s.sequence_id;

alter table sessions alter column unit_id set not null;
alter table sessions alter column sequence_id drop not null;

create index sessions_unit_id_idx on sessions(unit_id);

-- Deleting a séquence now un-groups its séances instead of destroying them:
-- they stay on the unit, which is where they would have sat had the séquence
-- never existed. The constraint is looked up rather than assumed by name.
do $$
declare
  cname text;
begin
  select con.conname
    into cname
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = any (con.conkey)
   where con.conrelid = 'sessions'::regclass
     and con.contype = 'f'
     and att.attname = 'sequence_id';

  if cname is not null then
    execute format('alter table sessions drop constraint %I', cname);
  end if;
end $$;

alter table sessions
  add constraint sessions_sequence_id_fkey
  foreign key (sequence_id) references sequences(id) on delete set null;
