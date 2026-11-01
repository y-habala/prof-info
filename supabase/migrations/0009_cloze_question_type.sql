-- New exam question type "cloze": a sentence whose blanks are filled from a
-- word list (dropdowns inside the sentence).
alter table exam_questions drop constraint if exists exam_questions_question_type_check;

alter table exam_questions add constraint exam_questions_question_type_check
  check (question_type in (
    'qcm_single', 'qcm_multiple', 'true_false', 'fill_blank', 'matching',
    'ordering', 'table', 'boxes', 'cloze'
  ));
