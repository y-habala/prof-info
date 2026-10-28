-- "categorize" becomes "table": same data (one "row||column" option per
-- row), shown as a grid where the student ticks the right column. Existing
-- categorize questions are converted rather than dropped.
alter table exam_questions drop constraint if exists exam_questions_question_type_check;

update exam_questions set question_type = 'table' where question_type = 'categorize';

alter table exam_questions add constraint exam_questions_question_type_check
  check (question_type in (
    'qcm_single', 'qcm_multiple', 'true_false', 'fill_blank', 'matching',
    'association', 'ordering', 'table'
  ));
