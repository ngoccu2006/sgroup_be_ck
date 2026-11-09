-- Level 9: Submission History + Resubmission
-- submissions.id là VARCHAR (id được sinh bằng uuidv4() ở tầng app), nên các cột id ở đây cũng dùng VARCHAR.
-- Nếu độ dài khác 36, kiểm tra lại bằng: SELECT character_maximum_length FROM information_schema.columns
--   WHERE table_name='submissions' AND column_name='id';

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS submission_history (
  id             VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  submission_id  VARCHAR(36) NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  version        INT NOT NULL,
  content        TEXT,
  repository_url TEXT,
  file_url       TEXT,
  score          NUMERIC,
  feedback       TEXT,
  submitted_at   TIMESTAMP,
  reviewed_at    TIMESTAMP,
  archived_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (submission_id, version)
);

CREATE INDEX IF NOT EXISTS idx_submission_history_submission
  ON submission_history (submission_id, version DESC);
