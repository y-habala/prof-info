-- "association" (link two columns) is replaced by "boxes" (sort items into
-- boxes). Same option format ("item||target"), so existing association
-- questions are converted rather than dropped: each right-hand value
-- becomes a box.
alter table exam_questions drop constraint if exists exam_questions_question_type_check;

update exam_questions set question_type = 'boxes' where question_type = 'association';

alter table exam_questions add constraint exam_questions_question_type_check
  check (question_type in (
    'qcm_single', 'qcm_multiple', 'true_false', 'fill_blank', 'matching',
    'ordering', 'table', 'boxes'
  ));
