-- New interactive exam question types: association (link two columns),
-- ordering (put items back in order) and categorize (sort items into
-- categories). They reuse exam_options; only the type check widens.
do $$
declare
  cname text;
begin
  select con.conname
    into cname
    from pg_constraint con
   where con.conrelid = 'exam_questions'::regclass
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%question_type%';
  if cname is not null then
    execute format('alter table exam_questions drop constraint %I', cname);
  end if;
end $$;

alter table exam_questions add constraint exam_questions_question_type_check
  check (question_type in (
    'qcm_single', 'qcm_multiple', 'true_false', 'fill_blank', 'matching',
    'association', 'ordering', 'categorize'
  ));
