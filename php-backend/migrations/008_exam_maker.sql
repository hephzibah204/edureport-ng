-- Migration: Exam Maker module

CREATE TABLE IF NOT EXISTS generated_exams (
    id VARCHAR(36) PRIMARY KEY,
    school_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_level VARCHAR(50) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    questions JSON NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY(school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_exams_school ON generated_exams(school_id);
