-- "matching" is modeled as a repeated qcm_single (each pair is its own
-- exam_questions row with its own full option pool, one is_correct=true) —
-- see plan doc §12.1. This needs zero grading changes, just a wider enum.
alter table exam_questions drop constraint exam_questions_question_type_check;
alter table exam_questions add constraint exam_questions_question_type_check
  check (question_type in ('qcm_single', 'qcm_multiple', 'true_false', 'fill_blank', 'matching', 'open'));

-- Optional roll number, separate from the class label (Phase 26) — printed
-- on the answer sheet, never validated as required (mirrors the reference).
alter table exam_attempts add column student_number text;
