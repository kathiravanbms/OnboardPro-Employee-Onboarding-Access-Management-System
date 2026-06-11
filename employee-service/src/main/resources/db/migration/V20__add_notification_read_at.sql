ALTER TABLE notifications
  ADD COLUMN read_at TIMESTAMP(6) NULL AFTER read_status;

UPDATE notifications
SET read_at = created_at
WHERE read_status = b'1'
  AND read_at IS NULL;
