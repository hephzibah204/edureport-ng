ALTER TABLE `score_sheets` ADD `session` text DEFAULT '' NOT NULL;
ALTER TABLE `score_sheets` ADD `term` text DEFAULT '' NOT NULL;
DROP INDEX IF EXISTS `school_student_unique_scores`;
CREATE UNIQUE INDEX `school_student_term_unique_scores` ON `score_sheets` (`school_id`, `student_id`, `session`, `term`);
