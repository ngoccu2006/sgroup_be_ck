CREATE TABLE IF NOT EXISTS class_schedules (
  id           VARCHAR(36) PRIMARY KEY,
  class_id     VARCHAR(36) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  session_date DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  location     TEXT,
  note         TEXT,
  created_by   VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_class_schedules_class_date
  ON class_schedules (class_id, session_date, start_time);
